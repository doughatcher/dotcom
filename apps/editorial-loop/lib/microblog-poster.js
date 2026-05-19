/**
 * microblog-poster.js
 *
 * Generates a cross-post excerpt from a blog post via Claude, then posts it
 * to micro.blog as a note via the Micropub API. Micro.blog displays the note
 * on the timeline at doughatcher.com/ and syndicates it to any cross-post
 * destinations configured in the account (LinkedIn, Mastodon, etc.).
 *
 * Required env:
 *   MICROBLOG_APP_TOKEN  — app token from https://micro.blog/account/apps
 *
 * Optional env:
 *   MICROBLOG_DESTINATION_UID  — mp-destination UID (only needed if the token
 *                                has access to more than one site; omit otherwise)
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function generateMicroblogPost(postContent, postUrl) {
  // Use pre-generated linkedin_copy from frontmatter if present.
  // The field is still called linkedin_copy because LinkedIn is the
  // primary syndication target — micro.blog is the transport.
  const pregenerated = extractLinkedInCopy(postContent);
  if (pregenerated) {
    return pregenerated
      .replace('{{url}}', postUrl)
      .replace(/Full post: \{\{url\}\}/g, `Full post: ${postUrl}`)
      .trim();
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are writing a short LinkedIn tease for Doug Hatcher, a Director of Engineering with deep roots in commerce architecture and platform engineering.

This is a TEASE, not the post. Stay above the LinkedIn mobile fold — no "...see more" link, no truncation. Hard ceiling: 280 characters TOTAL including the final URL line.

Structure (1–3 short lines, blank line between):
1. The strongest single sentence from the post — the claim that makes a VP of Engineering stop scrolling because they have lived it.
2. (Optional) One more sentence with the counterintuitive punchline.
3. "Full post: ${postUrl}" — exactly this, nothing else.

Prefer lifting verbatim sentences from the post over paraphrasing.

No em-dashes. No hedging. No buzzwords. No "I'm thrilled to share." No call-to-action fluff.

The full blog post:
---
${postContent}
---

Write only the LinkedIn text. No commentary, no alternatives. Count characters before responding — if over 280, cut.`,
    }],
  });

  return response.content[0].text.trim();
}

function extractLinkedInCopy(content) {
  const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (!fmMatch) return null;
  const copyMatch = fmMatch[1].match(/^linkedin_copy:\s*\|\s*\n((?:[ \t].+\n?)*)/m);
  if (!copyMatch) return null;
  return copyMatch[1].replace(/^  /gm, '').trim();
}

export async function postToMicroblog(text) {
  const token = process.env.MICROBLOG_APP_TOKEN;
  if (!token) throw new Error('MICROBLOG_APP_TOKEN must be set');

  const params = new URLSearchParams();
  params.append('h', 'entry');
  params.append('content', text);
  if (process.env.MICROBLOG_DESTINATION_UID) {
    params.append('mp-destination', process.env.MICROBLOG_DESTINATION_UID);
  }
  // micro.blog requires per-post opt-in for syndication — it does NOT honor
  // the account-level cross-post default for API-posted entries. Pass each
  // destination UID as a separate mp-syndicate-to[] form field.
  // Discover UIDs at GET /micropub?q=syndicate-to (e.g. "linkedin", "mastodon").
  const syndicateTo = (process.env.MICROBLOG_SYNDICATE_TO || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  for (const uid of syndicateTo) {
    params.append('mp-syndicate-to[]', uid);
  }

  const res = await fetch('https://micro.blog/micropub', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Micropub ${res.status}: ${detail}`);
  }

  return { location: res.headers.get('location') || null };
}
