/**
 * Update a blog post in doughatcher/dotcom.
 *
 * Two modes:
 *   threadCtx — called from a reply in an active post thread (vibe edit).
 *               Reads directly from the known branch/file, no slug lookup needed.
 *   intent    — called from a new message. Finds the post by slug match,
 *               then checks for a draft PR and commits to the branch if found,
 *               or to main for already-published posts.
 *
 * Always returns the full revised content so the caller can post it to Slack.
 */

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { readFile, writeFile, listDir, listPRs, readFileOnBranch, updateFileOnBranch } from './github.js';

export async function updateBlogPost(intent, env, threadCtx) {
  const repo = env.DOTCOM_REPO;
  const contentPath = env.BLOG_CONTENT_PATH;
  const { blogInstructions } = intent;

  let filePath, filename, branch, currentPost, sha, prUrl;

  if (threadCtx) {
    // Vibe-edit path: we already know exactly which file and branch to use
    branch = threadCtx.branch;
    filePath = threadCtx.filePath;
    filename = filePath.split('/').pop();
    prUrl = threadCtx.prUrl;
    ({ content: currentPost, sha } = await readFileOnBranch(repo, filePath, branch, env.GITHUB_TOKEN));
  } else {
    // Slug-lookup path
    const { blogSlug } = intent;
    const files = await listDir(repo, contentPath, env.GITHUB_TOKEN);
    const match = findPost(files, blogSlug);

    if (!match) {
      throw new Error(`No blog post found matching "${blogSlug}". Available posts: ${files.map(f => f.name).join(', ')}`);
    }

    filename = match.name;
    filePath = match.path;

    // Check for an open draft PR on a blog/ branch for this file
    const draftPR = await findDraftPR(repo, filename, env.GITHUB_TOKEN);

    if (draftPR) {
      branch = draftPR.head.ref;
      prUrl = draftPR.html_url;
      ({ content: currentPost, sha } = await readFileOnBranch(repo, filePath, branch, env.GITHUB_TOKEN));
    } else {
      ({ content: currentPost, sha } = await readFile(repo, filePath, env.GITHUB_TOKEN));
    }
  }

  const revised = await revisePost(currentPost, blogInstructions, env);

  let commitUrl;
  if (branch) {
    commitUrl = await updateFileOnBranch(
      repo, filePath, revised,
      `blog(revise): ${blogInstructions.slice(0, 60)}`,
      sha, branch, env.GITHUB_TOKEN
    );
  } else {
    commitUrl = await writeFile(
      repo, filePath, revised,
      `blog(revise): ${blogInstructions.slice(0, 60)}`,
      sha, env.GITHUB_TOKEN
    );
  }

  return { commitUrl, file: filename, branch, prUrl, content: revised };
}

function findPost(files, slug) {
  if (!slug) return null;
  const term = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
  let match = files.find(f => f.name.toLowerCase().includes(term));
  if (!match) {
    const words = term.split('-').filter(w => w.length > 3);
    match = files.find(f => words.some(w => f.name.toLowerCase().includes(w)));
  }
  return match ?? null;
}

async function findDraftPR(repo, filename, token) {
  try {
    const prs = await listPRs(repo, token, 'blog/');
    const fileSlug = filename.replace(/\.md$/, '');
    return prs.find(pr => pr.head.ref.endsWith(fileSlug)) ?? null;
  } catch {
    return null;
  }
}

async function revisePost(currentPost, instructions, env) {
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt: `You are revising a blog post for Doug Hatcher. His non-negotiable style rules:
- NO em-dashes (—). Never. Restructure the sentence instead.
- Short sentences. One idea per sentence.
- No hedging language. Commit to the claim.
- Active voice throughout.
- No buzzwords: seamless, scalable, robust, leverage (as verb), journey, ecosystem.
- Sound like a confident senior practitioner talking to a peer.

Revision instructions: "${instructions}"

Current post:
---
${currentPost}
---

Apply the revision instructions while strictly following the style rules. Preserve the frontmatter exactly. Return only the revised post, no commentary.`,
  });

  return text;
}
