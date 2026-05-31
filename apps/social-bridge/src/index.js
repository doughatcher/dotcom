/**
 * doughatcher-social-bridge — Cloudflare Worker
 *
 * Classify-and-route ingest endpoint for multiple sources. Each item is
 * classified by Claude Haiku 4.5 as POLITICAL, PERSONAL, or SKIP and posted
 * via Micropub to one of three sites (leaning.blue / doughatcher.com /
 * superterran.net), or dropped if SKIP.
 *
 * Ingest paths:
 *   - Hourly cron       → fetches reddit.com/user/superterran/.rss directly
 *   - Manual / external → POST /ingest/historical (archive importers, Make.com)
 *   - Manual            → POST /ingest/facebook   (Make.com FB webhook)
 *   - Manual            → GET  /poll/reddit       (one-shot RSS pull for debugging)
 *
 * Auth on HTTP endpoints: ?token=<TRIGGER_TOKEN> or Authorization: Bearer.
 * The scheduled() handler runs unauthenticated (cron is internal).
 *
 *   ?dry=1 on any ingest/poll endpoint → dry-run (no Micropub POST, no KV write)
 */

import { handleFacebookIngest } from "./facebook.js";
import { handleHistoricalIngest } from "./historical.js";
import { pollRedditRss } from "./reddit_rss.js";

function authed(request, env) {
  if (!env.TRIGGER_TOKEN) return false;
  const url = new URL(request.url);
  const header = request.headers.get("authorization") || "";
  const qs = url.searchParams.get("token") || "";
  return (
    header === `Bearer ${env.TRIGGER_TOKEN}` ||
    header === env.TRIGGER_TOKEN ||
    qs === env.TRIGGER_TOKEN
  );
}

export default {
  async fetch(request, env) {
    if (!authed(request, env)) return new Response("unauthorized", { status: 401 });
    const url = new URL(request.url);

    try {
      if (url.pathname === "/ingest/facebook" && request.method === "POST") {
        const payload = await request.json();
        const dry = url.searchParams.get("dry") === "1";
        const r = await handleFacebookIngest(env, payload, { dryRun: dry });
        return Response.json(r);
      }

      if (url.pathname === "/ingest/historical" && request.method === "POST") {
        const payload = await request.json();
        const dry = url.searchParams.get("dry") === "1";
        const r = await handleHistoricalIngest(env, payload, { dryRun: dry });
        return Response.json(r);
      }

      if (url.pathname === "/poll/reddit" && request.method === "GET") {
        const dry = url.searchParams.get("dry") === "1";
        const r = await pollRedditRss(env, { dryRun: dry });
        return Response.json(r);
      }

      return new Response("not found", { status: 404 });
    } catch (e) {
      return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
  },

  // Cron trigger — runs hourly per wrangler.toml [triggers].crons.
  // Reddit's user RSS feed updates as comments are posted; an hourly pull is
  // a comfortable cadence given micro.blog's own publishing pace.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          const r = await pollRedditRss(env, { dryRun: env.DRY_RUN === "1" });
          console.log("reddit-rss poll:", JSON.stringify({
            scheduledTime: event.scheduledTime,
            parsed: r.parsed,
            posted: r.results.filter((x) => x.ok && x.result?.posted).length,
            skippedAlreadyImported: r.results.filter((x) => x.ok && x.result?.skipped).length,
            dropped: r.results.filter((x) => x.ok && x.result?.dropped).length,
            errors: r.results.filter((x) => !x.ok).length,
          }));
        } catch (e) {
          console.error("reddit-rss poll failed:", e.message, e.stack);
        }
      })()
    );
  },
};
