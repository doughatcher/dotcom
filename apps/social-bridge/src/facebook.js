/**
 * Facebook ingest — webhook handler.
 *
 * Make.com (or any automation tool) watches new Facebook posts and POSTs
 * to this endpoint. We classify the content and route to the right
 * micro.blog site.
 *
 * Expected JSON body:
 *   {
 *     "text":  "post body text",          // required
 *     "url":   "https://facebook.com/...", // required, permalink
 *     "id":    "fb-post-id",              // optional, used as idempotency key
 *     "force_destination": "political",   // optional override: "personal" | "political"
 *     "attachments": ["https://...", ...] // optional, will be appended as links
 *   }
 *
 * KV `fb_seen:<id>` prevents Make.com retries from double-posting.
 */

import { classify } from "./classifier.js";
import { postEntry } from "./micropub.js";

function formatPost(payload) {
  const lines = [];
  if (payload.text) lines.push(payload.text.trim());
  if (Array.isArray(payload.attachments) && payload.attachments.length) {
    lines.push("");
    for (const a of payload.attachments) lines.push(a);
  }
  if (payload.url) {
    lines.push("");
    lines.push(`— [from Facebook](${payload.url})`);
  }
  return lines.join("\n");
}

export async function handleFacebookIngest(env, payload, { dryRun = false } = {}) {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload must be a JSON object");
  }
  if (!payload.text && !Array.isArray(payload.attachments)) {
    throw new Error("payload requires 'text' or 'attachments'");
  }

  // Idempotency: if Make.com retries, don't double-post.
  if (payload.id) {
    const seen = await env.STATE.get(`fb_seen:${payload.id}`);
    if (seen) return { skipped: true, reason: "already processed", id: payload.id };
  }

  const content = formatPost(payload);
  const classification =
    payload.force_destination === "political" || payload.force_destination === "personal"
      ? payload.force_destination
      : await classify(payload.text || "", env);

  if (dryRun || env.DRY_RUN === "1") {
    return { dryRun: true, classification, preview: content };
  }

  // Facebook has no subreddit → always routes to MICROPUB_DEST_FALLBACK
  // (superterran). Override via payload.force_destination if a specific
  // post needs to go to doughatcher.com instead.
  const r = await postEntry({
    env,
    payload: {
      content,
      categories: ["from-facebook"],
      subreddit: null,
    },
  });

  if (payload.id) {
    // 30 days is plenty for retry de-dup; Make.com retries within minutes.
    await env.STATE.put(`fb_seen:${payload.id}`, "1", { expirationTtl: 60 * 60 * 24 * 30 });
  }

  return { posted: true, classification, destination: r.destination, location: r.location };
}
