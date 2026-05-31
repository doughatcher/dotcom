/**
 * Reddit RSS poller — unauth Atom feed at reddit.com/user/<name>/.rss.
 *
 * Reddit killed the unauth JSON API in 2023 but the RSS feeds for user pages
 * survived (different code path, used by old.reddit and various clients).
 * Verified working 2026-05-31: HTTP 200, full Atom feed.
 *
 * For each new entry (id not in KV), build a historical-ingest payload and
 * delegate to handleHistoricalIngest. That keeps SKIP-gate / classification /
 * routing / dedup all in one place.
 *
 * Front-matter convention (carried into Micropub `content`):
 *   The body sent to micro.blog is *just* the comment text. Reddit URLs go
 *   into structured fields the post template renders as a footer. See
 *   `formatBody` below.
 */

import { handleHistoricalIngest } from "./historical.js";

const REDDIT_RSS_BASE = "https://www.reddit.com/user";
const ATOM_NS = "http://www.w3.org/2005/Atom";

const FEED_FETCHED_KEY = "reddit-rss:last-fetched";
const FEED_RAW_KEY = (id) => `reddit-rss:raw:${id}`;

/**
 * Parse a Reddit comment/post URL like:
 *   https://www.reddit.com/r/PHP/comments/1abc/title_slug/oorsvug/
 * Returns { subreddit, submissionId, commentId | null, submissionPermalink }.
 * For top-level posts (no comment_id), commentId is null.
 */
export function parseRedditUrl(url) {
  try {
    const u = new URL(url);
    // /r/<sub>/comments/<sub_id>/<slug>/<comment_id>/?
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] !== "r" || parts[2] !== "comments") return null;
    const subreddit = parts[1].toLowerCase();
    const submissionId = parts[3];
    const commentId = parts.length >= 6 ? parts[5] : null;
    const submissionPermalink = `https://www.reddit.com/r/${subreddit}/comments/${submissionId}/`;
    return { subreddit, submissionId, commentId, submissionPermalink };
  } catch {
    return null;
  }
}

/**
 * Extract submission title from the entry title field. Reddit formats it as:
 *   "/u/<user> on <SUBMISSION_TITLE>"   (for comments)
 *   "<SUBMISSION_TITLE>"                (for posts)
 */
function extractSubmissionTitle(entryTitle) {
  const m = entryTitle.match(/^\/u\/[^ ]+ on (.+)$/s);
  return m ? m[1].trim() : entryTitle.trim();
}

/**
 * Convert Reddit's HTML content block into clean markdown-ish plain text.
 * Strips SC_OFF/ON comments, unwraps <div class="md">, collapses tags. This
 * is intentionally lossy — we want clean prose for the post body, not a
 * faithful HTML reproduction.
 */
function decodeEntitiesOnce(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// Reddit's RSS double-encodes some entities (e.g. emits &amp;#32; meaning a
// rendered &#32; which a UA would then decode to a space). Iterate until the
// string stabilizes — capped at 3 passes to bound runtime.
function decodeEntities(s) {
  for (let i = 0; i < 3; i++) {
    const next = decodeEntitiesOnce(s);
    if (next === s) return s;
    s = next;
  }
  return s;
}

function htmlToText(html) {
  if (!html) return "";
  // Reddit's <content type="html"> is entity-encoded, not CDATA — decode first
  // or the tag-strip regexes below won't see real angle brackets.
  return decodeEntities(html)
    .replace(/<!--\s*SC_(?:OFF|ON)\s*-->/g, "")
    .replace(/<div[^>]*>/g, "")
    .replace(/<\/div>/g, "\n")
    .replace(/<p[^>]*>/g, "")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Minimal Atom parser — extracts what we need from each <entry>. We avoid a
 * full XML library to keep the Worker bundle small; this regex pass works
 * because Reddit's feed format is stable and well-formed.
 */
export function parseAtomFeed(xml) {
  const entries = [];
  const entryRe = /<entry\b[^>]*>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRe.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : "";
    };
    const getAttr = (tag, attr) => {
      const m = block.match(new RegExp(`<${tag}[^>]*\\b${attr}="([^"]+)"`));
      return m ? m[1] : "";
    };
    const id = get("id");
    const updated = get("updated");
    const title = get("title").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const link = getAttr("link", "href");
    const subreddit = getAttr("category", "term");
    // Content is wrapped in CDATA inside <content type="html">
    const contentRaw = get("content").replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
    entries.push({ id, updated, title, link, subreddit, contentHtml: contentRaw });
  }
  return entries;
}

/**
 * Format the markdown body that micro.blog actually publishes. The body is
 * ONLY the comment text — Reddit URLs live in the categories array as
 * machine-readable hints (kind:reddit-comment, sub:foo, etc.) so the
 * site template can render a "Reply on /r/foo to <title>" footer.
 */
export function formatBody({ commentText, subreddit, submissionTitle, submissionPermalink, commentPermalink }) {
  const trimmed = (commentText || "").trim();
  const footer =
    `\n\n---\n` +
    `_Originally a Reddit comment on [${submissionTitle}](${submissionPermalink}) in r/${subreddit}. ` +
    `[Comment thread](${commentPermalink})._`;
  return trimmed + footer;
}

/**
 * Build the payload for handleHistoricalIngest from a parsed Atom entry.
 * Returns null if the entry can't be parsed (skip silently rather than crash
 * the whole poll on one malformed item).
 */
export function buildPayload(entry) {
  // Skip Reddit submissions (t3_) — for Doug's own link posts the RSS body is
  // boilerplate ("submitted by … [link] [comments]"), and re-syndicating them
  // would create a loop with whatever the original link points at (e.g.
  // experiencedigest.org articles he posted to r/PHP).
  if (entry.id.startsWith("t3_")) return null;
  const parsed = parseRedditUrl(entry.link);
  if (!parsed) return null;
  const submissionTitle = extractSubmissionTitle(entry.title);
  const commentText = htmlToText(entry.contentHtml);
  const stableId = entry.id.replace(/^t[13]_/, ""); // strip kind prefix

  const body = formatBody({
    commentText,
    subreddit: parsed.subreddit,
    submissionTitle,
    submissionPermalink: parsed.submissionPermalink,
    commentPermalink: entry.link,
  });

  return {
    source: "reddit-rss",
    id: stableId,
    content: body,
    text_for_classifier: commentText,
    published: entry.updated,
    categories: [
      `r-${parsed.subreddit}`,
      `reddit-kind-${entry.id.startsWith("t1_") ? "comment" : "post"}`,
    ],
    subreddit: parsed.subreddit,
  };
}

/**
 * Fetch the user's Reddit RSS feed and ingest every new entry through the
 * existing historical pipeline (which handles classification, SKIP, routing,
 * dedup, KV-write).
 *
 * Returns a summary {fetched, parsed, results:[…]}.
 */
export async function pollRedditRss(env, { dryRun = false } = {}) {
  const user = env.REDDIT_USERNAME;
  if (!user) throw new Error("REDDIT_USERNAME not set");

  const feedUrl = `${REDDIT_RSS_BASE}/${user}/.rss`;
  const ua = env.REDDIT_USER_AGENT || "doughatcher-social-bridge/1.0";

  const res = await fetch(feedUrl, { headers: { "user-agent": ua, accept: "application/atom+xml" } });
  if (!res.ok) throw new Error(`reddit rss fetch failed: ${res.status} ${res.statusText}`);
  const xml = await res.text();

  // Record poll metadata for ops visibility (not for dedup — historical handler owns that).
  if (!dryRun) {
    await env.STATE.put(FEED_FETCHED_KEY, new Date().toISOString());
  }

  const entries = parseAtomFeed(xml);
  const results = [];
  for (const entry of entries) {
    try {
      const payload = buildPayload(entry);
      if (!payload) {
        results.push({ id: entry.id, ok: false, reason: "unparseable url", link: entry.link });
        continue;
      }
      const r = await handleHistoricalIngest(env, payload, { dryRun });
      results.push({ id: entry.id, ok: true, result: r });
    } catch (e) {
      results.push({ id: entry.id, ok: false, error: e.message });
    }
  }
  return { fetched: feedUrl, parsed: entries.length, results };
}
