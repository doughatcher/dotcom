/**
 * thread-context.js
 *
 * Stores and retrieves per-thread post state in Cloudflare KV.
 * Enables back-and-forth editing: once a draft is created in a Slack thread,
 * every follow-up message in that thread automatically edits the same post.
 *
 * KV key: thread_ts (Slack thread timestamp string)
 * KV value: { branch, filePath, prUrl, prNumber, title }
 *
 * TTL: 30 days — drafts don't live in review forever.
 */

const TTL_SECONDS = 30 * 24 * 3600;

export async function getThreadContext(threadTs, env) {
  if (!env.THREAD_CONTEXT) return null;
  try {
    return await env.THREAD_CONTEXT.get(threadTs, 'json');
  } catch {
    return null;
  }
}

export async function setThreadContext(threadTs, ctx, env) {
  if (!env.THREAD_CONTEXT) return;
  await env.THREAD_CONTEXT.put(threadTs, JSON.stringify(ctx), {
    expirationTtl: TTL_SECONDS,
  });
}
