/**
 * editorial-loop — weekly idea generation entry point
 *
 * Flow:
 *   1. Read vault content + strategy doc + external-index
 *   2. Generate 3 ideas via Claude (2 pillar-aligned, 1 wild card)
 *   3. Either open a Draft PR per idea + notify Slack (default),
 *      or write candidate drafts to disk for review (DRY_RUN=1).
 *
 * Inject context for a given week via INJECT_CONTEXT env var
 * (set via workflow_dispatch input or manually).
 */

import fs from 'fs';
import path from 'path';
import { readVaultContent } from './lib/vault-reader.js';
import { generateIdeas } from './lib/idea-generator.js';
import { createDraftPR } from './lib/pr-creator.js';
import { notifySlack } from './lib/slack-notifier.js';

const DRY_RUN = process.env.DRY_RUN === '1';
const DRY_RUN_DIR = process.env.DRY_RUN_DIR || '/tmp/editorial-loop-drafts';

async function main() {
  console.log('📖 Reading vault content...');
  const { strategyDoc, baseline, current, delta, recentContent, existingPosts } = await readVaultContent();
  console.log(
    `   strategy ${strategyDoc.length}c, baseline ${baseline.length}c, current ${current.length}c, ` +
    `delta ${delta ? delta.content.length + 'c (' + delta.filename + ')' : 'none'}, ` +
    `${recentContent.length} personal files, ${existingPosts.length} existing posts`
  );

  console.log('🧠 Generating ideas via Claude...');
  const ideas = await generateIdeas({ strategyDoc, baseline, current, delta, recentContent, existingPosts });
  console.log(`   Generated ${ideas.length} ideas`);

  if (DRY_RUN) {
    fs.mkdirSync(DRY_RUN_DIR, { recursive: true });
    const today = new Date().toISOString().split('T')[0];
    for (const idea of ideas) {
      const filename = `${today}-${idea.slug}.md`;
      const dest = path.join(DRY_RUN_DIR, filename);
      fs.writeFileSync(dest, withFrontmatter(idea));
      console.log(`📝 [dry-run] wrote ${dest}`);
    }
    console.log(`✅ Dry run complete. ${ideas.length} candidates in ${DRY_RUN_DIR}`);
    return;
  }

  const prs = [];
  for (const idea of ideas) {
    console.log(`📝 Creating draft PR: "${idea.title}"`);
    const prUrl = await createDraftPR(idea);
    prs.push({ ...idea, prUrl });
  }

  console.log('📣 Notifying Slack...');
  await notifySlack(prs);

  console.log('✅ Done.');
}

function withFrontmatter(idea) {
  // pr-creator injects linkedin_copy + pillar into frontmatter at PR time;
  // for dry-run we replicate that so the file mirrors what would land.
  const draft = idea.draft_content || '';
  const fmMatch = draft.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return draft;
  const fmBody = fmMatch[1];
  const rest = draft.slice(fmMatch[0].length);
  const linkedinBlock = idea.linkedin_copy
    ? `\nlinkedin_copy: |\n${idea.linkedin_copy.split('\n').map(l => '  ' + l).join('\n')}`
    : '';
  return `---\n${fmBody}${linkedinBlock}\n---\n${rest}`;
}

main().catch(err => {
  console.error('❌ editorial-loop failed:', err.message);
  process.exit(1);
});
