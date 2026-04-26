/**
 * editorial-slack-bot — Cloudflare Worker
 *
 * Receives Slack Events API webhooks. Supports:
 *   - Creating new blog post drafts from a topic (agentic, with web research)
 *   - Editing existing posts / draft PRs by slug or thread context
 *   - Merging draft PRs to publish
 *   - Updating the voice profile in the Obsidian vault
 *
 * Thread-aware: once a draft is created, every follow-up message in that
 * Slack thread edits the same post automatically — no need to re-specify it.
 *
 * After every create/update, posts the full draft content in the thread
 * so you can read and react without leaving Slack.
 */

import { Hono } from 'hono';
import { verifySlackSignature } from './services/slack-verify.js';
import { parseIntent } from './services/intent-parser.js';
import { updateVoiceProfile } from './services/voice-updater.js';
import { updateBlogPost } from './services/blog-updater.js';
import { createBlogPost } from './services/post-creator.js';
import { mergeBlogPost } from './services/pr-merger.js';
import { slackReply } from './services/slack-reply.js';
import { getThreadContext, setThreadContext } from './services/thread-context.js';

const app = new Hono();

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ ok: true, service: 'editorial-slack-bot', version: '2.0.0' }));

// ── Slack Events API ──────────────────────────────────────────────────────────
app.post('/slack/events', async (c) => {
  const rawBody = await c.req.text();
  const body = JSON.parse(rawBody);

  if (body.type === 'url_verification') {
    return c.json({ challenge: body.challenge });
  }

  const isValid = await verifySlackSignature(c.req.raw, rawBody, c.env.SLACK_SIGNING_SECRET);
  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const event = body.event;

  if (!event || event.bot_id || event.subtype === 'bot_message') {
    return c.json({ ok: true });
  }

  const isRelevant =
    (event.type === 'message' && event.channel_type === 'im') ||
    event.type === 'app_mention';

  if (!isRelevant) return c.json({ ok: true });

  c.executionCtx.waitUntil(handleMessage(event, c.env));

  return c.json({ ok: true });
});

// ── Core handler ──────────────────────────────────────────────────────────────
async function handleMessage(event, env) {
  const { text, channel, ts, thread_ts } = event;
  const replyThread = thread_ts || ts;
  const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

  try {
    await slackReply(channel, replyThread, '⏳ On it — analyzing your feedback...', env);

    // Check if this message is in an active post-editing thread
    const threadCtx = thread_ts ? await getThreadContext(thread_ts, env) : null;

    if (threadCtx) {
      // Thread context found: treat the message as an edit instruction for this post
      const intent = {
        action: 'update_blog_post',
        summary: `Revise "${threadCtx.title}": ${cleanText.slice(0, 80)}`,
        blogInstructions: cleanText,
      };
      const result = await updateBlogPost(intent, env, threadCtx);

      await slackReply(
        channel, replyThread,
        `✅ Updated. <${result.commitUrl}|View commit>${threadCtx.prUrl ? ` · <${threadCtx.prUrl}|PR>` : ''}`,
        env
      );
      await postContent(channel, replyThread, threadCtx.title, result.content, [], env);
      return;
    }

    // No thread context — parse intent normally
    const intent = await parseIntent(cleanText, env);

    if (intent.action === 'update_voice_profile') {
      const result = await updateVoiceProfile(intent, env);
      await slackReply(
        channel, replyThread,
        `✅ Voice profile updated.\n>${intent.summary}\n<${result.commitUrl}|View commit>`,
        env
      );

    } else if (intent.action === 'update_blog_post') {
      const result = await updateBlogPost(intent, env, null);
      const prNote = result.prUrl ? ` · <${result.prUrl}|PR>` : '';
      await slackReply(
        channel, replyThread,
        `✅ *${result.file}* updated. <${result.commitUrl}|View commit>${prNote}`,
        env
      );
      await postContent(channel, replyThread, result.file, result.content, [], env);

      // If this edit was on a draft PR branch, store thread context for back-and-forth
      if (result.branch && result.prUrl) {
        await setThreadContext(replyThread, {
          branch: result.branch,
          filePath: `${env.BLOG_CONTENT_PATH}/${result.file}`,
          prUrl: result.prUrl,
          title: result.file.replace(/\.md$/, ''),
        }, env);
      }

    } else if (intent.action === 'create_blog_post') {
      await slackReply(channel, replyThread, '🔍 Researching and drafting — give me a minute...', env);
      const result = await createBlogPost(intent, replyThread, env);
      await slackReply(
        channel, replyThread,
        `✅ Draft ready: *${result.title}*\n<${result.prUrl}|View draft PR>\n\n_Reply here to keep editing. I'll update the draft each time._`,
        env
      );
      await postContent(channel, replyThread, result.title, result.content, result.researchNeeded, env);

    } else if (intent.action === 'merge_blog_post') {
      const result = await mergeBlogPost(intent, env);
      await slackReply(
        channel, replyThread,
        `✅ Published: *${result.title}*\nThe blog-publish workflow will cross-post to LinkedIn shortly.`,
        env
      );

    } else if (intent.action === 'update_both') {
      const [voiceResult, blogResult] = await Promise.all([
        updateVoiceProfile(intent, env),
        updateBlogPost(intent, env, null),
      ]);
      await slackReply(
        channel, replyThread,
        `✅ Done:\n• Voice profile updated — <${voiceResult.commitUrl}|commit>\n• Blog post updated — <${blogResult.commitUrl}|commit>`,
        env
      );
      await postContent(channel, replyThread, blogResult.file, blogResult.content, [], env);

    } else {
      await slackReply(
        channel, replyThread,
        `🤔 I understood: _${intent.summary}_\n\nNot sure what to change. Try:\n• "Write a new post about enterprise AI and org design"\n• "Revise the SOW post: make the opening paragraph shorter"\n• "Publish the SOW post"\n• "Update voice profile: no em-dashes"`,
        env
      );
    }

  } catch (err) {
    console.error('handleMessage error:', err);
    await slackReply(
      channel, replyThread,
      `❌ Something went wrong: ${err.message}`,
      env
    ).catch(() => {});
  }
}

// ── Post full draft content to Slack ──────────────────────────────────────────
// Strips frontmatter and sends the body as readable text. Slack renders basic
// mrkdwn (*bold*, _italic_) but not markdown headers — close enough for review.
// Research flags are posted as a follow-up bullet list.
async function postContent(channel, threadTs, title, content, researchNeeded, env) {
  // Strip YAML frontmatter
  const body = content.replace(/^---[\s\S]*?---\n+/, '').trim();
  const header = `📄 *${title}*\n${'─'.repeat(40)}`;

  // Slack text field handles up to ~40K chars; chunk conservatively at 3800
  const CHUNK = 3800;
  const chunks = [];
  let remaining = body;
  while (remaining.length > 0) {
    // Try to break at a paragraph boundary
    const slice = remaining.slice(0, CHUNK);
    const lastBreak = slice.lastIndexOf('\n\n');
    const cutAt = remaining.length <= CHUNK ? remaining.length : (lastBreak > CHUNK / 2 ? lastBreak : CHUNK);
    chunks.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }

  // First chunk gets the header
  await slackReply(channel, threadTs, `${header}\n\n${chunks[0]}`, env);
  for (const chunk of chunks.slice(1)) {
    await slackReply(channel, threadTs, chunk, env);
  }

  if (researchNeeded?.length > 0) {
    const items = researchNeeded.map(r => `• ${r}`).join('\n');
    await slackReply(
      channel, threadTs,
      `🔍 *Flagged for deeper research* (annotated in draft with \`<!-- [RESEARCH] -->\`):\n${items}\n\n_These are areas where a quick search wasn't enough to confirm specifics. Your subscription can dig into these._`,
      env
    );
  }
}

export default app;
