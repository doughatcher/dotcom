/**
 * pr-merger.js
 *
 * Finds and merges an open blog draft PR by slug/topic match.
 * Used when the user says "publish the X post" or "merge the X PR".
 */

import { listPRs, mergePR } from './github.js';

export async function mergeBlogPost(intent, env) {
  const { blogSlug } = intent;
  const repo = env.DOTCOM_REPO;

  const prs = await listPRs(repo, env.GITHUB_TOKEN, 'blog/');

  if (prs.length === 0) {
    throw new Error('No open blog draft PRs found.');
  }

  const pr = blogSlug ? findPR(prs, blogSlug) : prs[0];

  if (!pr) {
    const available = prs.map(p => p.head.ref.replace('blog/', '')).join(', ');
    throw new Error(`No draft PR found matching "${blogSlug}". Open blog PRs: ${available}`);
  }

  await mergePR(repo, pr.number, env.GITHUB_TOKEN);

  return { title: pr.title, url: pr.html_url };
}

function findPR(prs, slug) {
  const term = slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
  // Exact substring match on branch name
  let match = prs.find(pr => pr.head.ref.toLowerCase().includes(term));
  if (!match) {
    // Fuzzy: any meaningful word from the slug
    const words = term.split('-').filter(w => w.length > 3);
    match = prs.find(pr =>
      words.some(w =>
        pr.head.ref.toLowerCase().includes(w) ||
        pr.title.toLowerCase().includes(w)
      )
    );
  }
  return match ?? null;
}
