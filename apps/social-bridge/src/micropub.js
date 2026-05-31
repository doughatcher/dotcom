/**
 * Micropub posting to micro.blog with multi-site routing.
 *
 * micro.blog supports multiple sites per account; a single token can post
 * to any of them by setting `mp-destination=<site-url>` in the payload.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Routing (2026-05-31)
 * ─────────────────────────────────────────────────────────────────────
 *
 *   classification = SKIP      → caller drops (never reaches postEntry)
 *   classification = POLITICAL → MICROPUB_DEST_POLITICAL (leaning.blue)
 *   classification = PERSONAL  + subreddit ∈ PRO_SUBS
 *                              → MICROPUB_DEST_PROFESSIONAL (doughatcher.com)
 *   classification = PERSONAL  + otherwise
 *                              → MICROPUB_DEST_FALLBACK (superterran.net)
 *
 * Classifier takes precedence over the subreddit allowlist: a politically-
 * tinged comment in r/magento still routes to leaning.blue, not doughatcher.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Cross-post / syndication policy: NEVER from this bridge.
 * ─────────────────────────────────────────────────────────────────────
 * Doug explicitly does NOT want Reddit/Facebook-sourced backlog posts
 * cross-posted to LinkedIn, Bluesky, Mastodon, or Threads. We always send
 * an explicit empty `mp-syndicate-to[]=` to suppress micro.blog's account-
 * level defaults (observed firing on API-posted entries 2026-05-18).
 */

const MICROPUB_URL = "https://micro.blog/micropub";
const NEVER_SYNDICATE = true;

// Pull subreddit from explicit field or from the `r-<sub>` category tag.
function extractSubreddit(payload) {
  if (payload.subreddit) return String(payload.subreddit).toLowerCase();
  for (const cat of payload.categories || []) {
    if (typeof cat === "string" && cat.startsWith("r-")) {
      return cat.slice(2).toLowerCase();
    }
  }
  return null;
}

function isProSub(sub, env) {
  if (!sub) return false;
  const allow = (env.PRO_SUBS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allow.includes(sub);
}

/**
 * Pick the Micropub destination URL for a payload given a classification.
 * Returns null for SKIP (caller is expected to short-circuit before calling
 * this, but returning null is the safe fallback if SKIP slips through).
 */
export function destinationFor(payload, env, classification) {
  if (classification === "skip") return null;
  if (classification === "political") return env.MICROPUB_DEST_POLITICAL || null;
  const sub = extractSubreddit(payload);
  return isProSub(sub, env) ? env.MICROPUB_DEST_PROFESSIONAL : env.MICROPUB_DEST_FALLBACK;
}

export function categoriesFor(env) {
  return (env.CATEGORIES_DEFAULT || "").split(",").map((x) => x.trim()).filter(Boolean);
}

export async function postEntry({ env, payload, classification, published = null }) {
  const destination = destinationFor(payload, env, classification);
  if (!destination) throw new Error(`no Micropub destination resolved (classification=${classification}; check PRO_SUBS + MICROPUB_DEST_*)`);
  if (!env.MICROPUB_TOKEN) throw new Error("MICROPUB_TOKEN not set");

  const body = new URLSearchParams();
  body.append("h", "entry");
  body.append("content", payload.content);
  body.append("mp-destination", destination);
  if (published) body.append("published", published);
  for (const cat of categoriesFor(env)) body.append("category[]", cat);
  for (const cat of payload.categories || []) body.append("category[]", cat);
  // Explicit no-syndication suppression — see top-of-file policy.
  if (NEVER_SYNDICATE) body.append("mp-syndicate-to[]", "");

  const res = await fetch(MICROPUB_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MICROPUB_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Micropub POST → ${res.status} ${text}`);
  return { status: res.status, location: res.headers.get("Location"), destination };
}
