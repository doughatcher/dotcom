/**
 * Historical / archive import endpoint.
 *
 * Accepts a pre-formatted post with an original timestamp and a stable id.
 * Idempotent: once `imported:<source>:<id>` is in KV, re-POSTing the same
 * payload is a no-op. Safe to re-run import scripts to completion.
 *
 * Expected JSON body:
 *   {
 *     "source": "reddit-api" | "reddit-export" | "reddit-rss" |
 *               "facebook-export" | ...,                          // any string
 *     "id": "stable-per-item-id",        // required, used as KV idempotency key
 *     "content": "markdown body to publish (formatted by the import script)",  // required
 *     "text_for_classifier": "raw user text only, for the classifier prompt",  // required
 *     "published": "2008-04-12T19:30:00Z",  // RFC 3339, micro.blog dates the post to this
 *     "categories": ["from-reddit", "r-sysadmin", "archive"],   // optional, merged with config defaults
 *     "force_destination": "personal" | "political" | "skip"    // optional override
 *   }
 *
 * Classifier returns one of three labels:
 *   "political" → routes to leaning.blue (MICROPUB_DEST_POLITICAL)
 *   "personal"  → routes per subreddit allowlist
 *   "skip"      → dropped entirely; KV marker records why
 *
 * Idempotency keys persist with no TTL — historical items are immutable.
 * Skipped items get a `dropped:true, reason:"classified-skip"` marker so
 * re-imports no-op.
 */

import { classify } from "./classifier.js";
import { postEntry, destinationFor } from "./micropub.js";

function importedKey(source, id) {
  return `imported:${source}:${id}`;
}

export async function handleHistoricalIngest(env, payload, { dryRun = false } = {}) {
  if (!payload || typeof payload !== "object") throw new Error("payload must be JSON object");
  if (!payload.source) throw new Error("payload.source required");
  if (!payload.id) throw new Error("payload.id required");
  if (!payload.content) throw new Error("payload.content required");
  if (!payload.text_for_classifier) throw new Error("payload.text_for_classifier required");

  const key = importedKey(payload.source, payload.id);

  if (!dryRun) {
    const seen = await env.STATE.get(key);
    if (seen) return { skipped: true, reason: "already imported", id: payload.id, source: payload.source };
  }

  const forced = payload.force_destination;
  const classification =
    forced === "political" || forced === "personal" || forced === "skip"
      ? forced
      : await classify(payload.text_for_classifier, env);

  if (dryRun || env.DRY_RUN === "1") {
    return {
      dryRun: true,
      source: payload.source,
      id: payload.id,
      classification,
      published: payload.published || null,
      preview: payload.content,
      wouldSkip: classification === "skip",
      wouldRouteTo: classification === "skip" ? null : destinationFor(payload, env, classification),
    };
  }

  // SKIP — content the classifier flagged as cringe / tantrum / cheap-dunk.
  // Record in KV so re-imports no-op. The raw CSV stays on disk as the
  // permanent source corpus.
  if (classification === "skip") {
    await env.STATE.put(key, JSON.stringify({
      at: new Date().toISOString(),
      classification,
      dropped: true,
      reason: "classified-skip",
    }));
    return {
      dropped: true,
      source: payload.source,
      id: payload.id,
      classification,
      reason: "classified-skip",
    };
  }

  const r = await postEntry({
    env,
    payload,
    classification,
    published: payload.published || null,
  });

  // Persist forever — historical items don't change.
  await env.STATE.put(key, JSON.stringify({
    at: new Date().toISOString(),
    classification,
    destination: r.destination,
    location: r.location,
  }));

  return {
    posted: true,
    source: payload.source,
    id: payload.id,
    classification,
    destination: r.destination,
    location: r.location,
    published: payload.published || null,
  };
}
