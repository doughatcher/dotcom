/**
 * publish.js — micro.blog cross-post entry point
 *
 * Called by the blog-publish workflow when a blog post is merged to main.
 * Reads the post file from POST_PATH env var, generates an excerpt via Claude
 * (or pulls pre-generated linkedin_copy from frontmatter), and posts it as a
 * note to micro.blog via Micropub. Micro.blog renders the note on the timeline
 * at doughatcher.com/ and syndicates it to any cross-post destinations
 * (LinkedIn, Mastodon, etc.) configured on the account.
 */

import fs from 'fs';
import { generateMicroblogPost, postToMicroblog } from './lib/microblog-poster.js';

const POST_PATH = process.env.POST_PATH;
const BASE_URL = process.env.BASE_URL || 'https://doughatcher.com';

async function main() {
  if (!POST_PATH) throw new Error('POST_PATH env var required');

  const content = fs.readFileSync(POST_PATH, 'utf8');

  // Derive public URL from file path: content/blog/2026-04-18-my-slug.md → /blog/2026-04-18-my-slug/
  // Hugo permalink includes the date prefix; the full basename (sans .md) is the slug.
  const slug = POST_PATH.split('/').pop().replace('.md', '');
  const postUrl = `${BASE_URL}/blog/${slug}/`;

  console.log(`📖 Post: ${POST_PATH}`);
  console.log(`🔗 URL: ${postUrl}`);

  console.log('🧠 Generating micro.blog note...');
  const noteText = await generateMicroblogPost(content, postUrl);
  console.log('--- micro.blog note preview ---');
  console.log(noteText);
  console.log('---');

  console.log('📤 Posting to micro.blog...');
  const result = await postToMicroblog(noteText);
  console.log(`✅ Posted: ${result.location || '(no Location header returned)'}`);
}

main().catch(err => {
  console.error('❌ publish failed:', err.message);
  process.exit(1);
});
