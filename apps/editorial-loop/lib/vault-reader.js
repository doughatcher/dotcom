/**
 * vault-reader.js
 *
 * Reads strategy doc, the policy-scrubbed external-index/ corpus, and a thin
 * slice of recent personal notes. Returns a structured object the idea
 * generator anchors on.
 */

import fs from 'fs';
import path from 'path';

const VAULT_PATH = process.env.VAULT_PATH || './vault';
const BLOG_PATH = process.env.BLOG_PATH || './content/blog';
const SCAN_DAYS = parseInt(process.env.SCAN_DAYS || '60');

const STRATEGY_DOC = 'Personal/Career/Public Voice - Positioning and Editorial POV.md';
const EXTERNAL_INDEX_DIR = 'Context/external-index';
const PERSONAL_SECTION = 'Personal/Career/';

const PERSONAL_FILE_LIMIT = 10;
const PERSONAL_EXCERPT_LENGTH = 1500;

export async function readVaultContent() {
  const strategyDoc = readFile(path.join(VAULT_PATH, STRATEGY_DOC));
  if (!strategyDoc) throw new Error(`Strategy doc not found at ${STRATEGY_DOC}`);

  const externalIndexDir = path.join(VAULT_PATH, EXTERNAL_INDEX_DIR);
  const baseline = readFile(path.join(externalIndexDir, '_baseline.md')) || '';
  const current = readFile(path.join(externalIndexDir, 'current.md')) || '';
  const delta = readLatestDelta(externalIndexDir);

  const recentContent = readPersonalNotes(path.join(VAULT_PATH, PERSONAL_SECTION));

  const existingPosts = fs.existsSync(BLOG_PATH)
    ? fs.readdirSync(BLOG_PATH, { recursive: true })
        .filter(f => f.endsWith('.md') && !f.endsWith('.gitkeep'))
    : [];

  return { strategyDoc, baseline, current, delta, recentContent, existingPosts };
}

function readLatestDelta(dir) {
  if (!fs.existsSync(dir)) return null;
  const dated = fs.readdirSync(dir)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();
  if (dated.length === 0) return null;
  const latest = dated[dated.length - 1];
  const content = readFile(path.join(dir, latest));
  if (!content) return null;
  // Skip zero-signal stub days where the upstream extractor had nothing to say
  if (/There is no content to produce/i.test(content)) return null;
  return { filename: latest, content };
}

function readPersonalNotes(sectionDir) {
  if (!fs.existsSync(sectionDir)) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SCAN_DAYS);

  const files = findRecentMarkdown(sectionDir, cutoff)
    .slice(0, PERSONAL_FILE_LIMIT);

  const out = [];
  for (const file of files) {
    const raw = readFile(file);
    if (!raw) continue;
    out.push({
      path: path.relative(VAULT_PATH, file),
      excerpt: raw.slice(0, PERSONAL_EXCERPT_LENGTH),
    });
  }
  return out;
}

function findRecentMarkdown(dir, cutoff) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        results.push(...findRecentMarkdown(full, cutoff));
      } else if (entry.name.endsWith('.md')) {
        const { mtime } = fs.statSync(full);
        if (mtime >= cutoff) results.push(full);
      }
    }
  } catch { /* skip unreadable dirs */ }

  return results.sort((a, b) =>
    fs.statSync(b).mtime - fs.statSync(a).mtime
  );
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}
