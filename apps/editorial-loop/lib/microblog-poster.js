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
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are writing a LinkedIn post for Doug Hatcher, a Director of Engineering with deep roots in commerce architecture and platform engineering.

Write for two audiences at once: executive leaders (what broke, why it matters to the org, the strategic judgment call) and technical leaders (the specific tradeoff, the implementation detail that changes everything, the failure mode practitioners live with).

Voice rules:
- Open with a specific claim or observation — not a question, not an announcement, not "I'm excited to share"
- 300-500 words
- No em-dashes. No hedging. No buzzwords.
- Sound like someone who has already solved this problem twice and is talking to a peer, not performing on LinkedIn
- End with exactly: "Full post: ${postUrl}"

The full blog post:
---
${postContent}
---

Write only the LinkedIn post text. No commentary, no alternatives.`,
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
