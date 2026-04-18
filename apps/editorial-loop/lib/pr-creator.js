/**
 * pr-creator.js
 *
 * Creates a branch, commits the draft post, and opens a Draft PR.
 * Returns the PR URL.
 *
 * Requires GH_TOKEN env var and gh CLI available in PATH.
 * Git identity must be configured before calling (done in workflow).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BLOG_PATH = process.env.BLOG_PATH || './content/blog';

export async function createDraftPR(idea) {
  const today = new Date().toISOString().split('T')[0];
  const branch = `blog/${today}-${idea.slug}`;
  const filePath = path.join(BLOG_PATH, `${today}-${idea.slug}.md`);

  try {
    // Create branch off main
    run(`git checkout -b ${branch}`);

    // Write the draft
    fs.mkdirSync(BLOG_PATH, { recursive: true });
    fs.writeFileSync(filePath, idea.draft_content, 'utf8');

    // Commit and push
    run(`git add "${filePath}"`);
    run(`git commit -m "blog(draft): ${idea.title}"`);
    run(`git push origin ${branch}`);

    // Open Draft PR
    const body = buildPRBody(idea, filePath);
    const prUrl = run(
      `gh pr create --draft \
        --title ${JSON.stringify(idea.title)} \
        --body ${JSON.stringify(body)} \
        --base main`,
    ).trim();

    return prUrl;
  } finally {
    // Always return to main for the next iteration
    run('git checkout main');
  }
}

function buildPRBody(idea, filePath) {
  return `## 📝 Blog Draft — ${idea.pillar}

**Hook:** ${idea.hook}

**Angle:** ${idea.angle}

**Source material:** ${idea.source_material}

---

Draft is in \`${filePath}\`. Edit directly on this branch or merge as-is.

**To publish:** merge this PR. The \`blog-publish\` workflow will auto-generate a LinkedIn post and cross-post it.

**To discard:** close without merging.`;
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] });
}
