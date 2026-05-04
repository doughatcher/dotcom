/**
 * post-creator.js
 *
 * Creates a new blog post draft from a topic using an agentic loop:
 *   1. Agent searches the web (Tavily) for relevant context
 *   2. Agent reads existing posts from the repo to calibrate voice
 *   3. Agent submits a structured draft with research annotations
 *
 * Annotations: when the agent hits a topic that needs deeper research
 * (beyond what a few Tavily searches can reliably confirm), it marks
 * the passage with <!-- [RESEARCH] topic: description --> and logs it
 * in research_needed[]. These are surfaced in Slack so you know exactly
 * where to dig in with a bigger research run.
 *
 * Loop is capped at STEP_LIMIT agentic steps to keep costs predictable.
 *
 * After the PR is created, stores thread context in KV so follow-up
 * messages in the same Slack thread auto-route to this post.
 */

import { generateText, tool, stepCountIs } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { getRef, createBranch, createFileOnBranch, createPR, listDir, readFile } from './github.js';
import { setThreadContext } from './thread-context.js';

const STEP_LIMIT = 6;

export async function createBlogPost(intent, threadTs, env) {
  const { blogTopic, blogInstructions } = intent;
  const repo = env.DOTCOM_REPO;
  const contentPath = env.BLOG_CONTENT_PATH;

  const existingFiles = await listDir(repo, contentPath, env.GITHUB_TOKEN).catch(() => []);
  const existingPosts = existingFiles
    .filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep')
    .map(f => f.name);

  const today = new Date().toISOString().split('T')[0];
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const tools = {
    web_search: tool({
      description: 'Search the web for facts, examples, data, or recent context. Keep queries specific and technical. Use sparingly — 2-3 searches max.',
      inputSchema: z.object({
        query: z.string().describe('A focused, specific search query.'),
      }),
      execute: async ({ query }) => tavilySearch(query, env.TAVILY_API_KEY),
    }),

    read_existing_post: tool({
      description: 'Read an existing blog post to calibrate voice, depth, and to avoid repeating covered ground.',
      inputSchema: z.object({
        filename: z.string().describe('Filename from the existing posts list.'),
      }),
      execute: async ({ filename }) => {
        try {
          const { content } = await readFile(repo, `${contentPath}/${filename}`, env.GITHUB_TOKEN);
          return content.slice(0, 3000);
        } catch {
          return `Could not read ${filename}`;
        }
      },
    }),

    submit_draft: tool({
      description: [
        'Submit the finished draft. Call this when ready.',
        'For any claim or section where Tavily results were thin, unreliable, or the topic clearly needs expert-level research,',
        'annotate that passage inline with <!-- [RESEARCH] topic: what needs deeper investigation --> ',
        'and list it in research_needed. Be honest about the limits of what a web search can confirm.',
      ].join(' '),
      inputSchema: z.object({
        title: z.string().describe('Post title — specific, compelling, not a listicle'),
        slug: z.string().describe('URL slug, e.g. "enterprise-ai-org-design-tradeoffs"'),
        draft_content: z.string().describe('Full markdown with frontmatter. Annotate uncertain passages with <!-- [RESEARCH] topic: ... -->'),
        research_needed: z.array(z.string()).describe('List of topics flagged for deeper research. Empty array if none.'),
      }),
    }),
  };

  const { toolCalls } = await generateText({
    model: anthropic('claude-opus-4-6'),
    tools,
    toolChoice: 'auto',
    stopWhen: stepCountIs(STEP_LIMIT),
    system: `You are an editorial agent writing a blog post for Doug Hatcher at doughatcher.com.

Doug is a senior technical architect in mid-market commerce (SFCC, Shopify Plus) with Adobe corporate experience.
His voice: plain, confident, specific, practitioner-to-practitioner. No hustle-bro content.

Today: ${today}

Existing posts (do not repeat these angles):
${existingPosts.length ? existingPosts.join('\n') : 'None yet.'}

Workflow:
1. Do 1-3 focused web searches to find concrete examples, data points, or recent context.
2. Optionally read one existing post to calibrate voice.
3. Draft the post. Be honest: if a claim needs deeper verification than Tavily can provide,
   annotate it with <!-- [RESEARCH] topic: what needs to be checked --> and add to research_needed.
4. Call submit_draft with the finished post and research_needed list.

Voice rules (non-negotiable):
- NEVER use em-dashes (—). Restructure or use a period.
- No hedging ("sort of", "kind of", "perhaps"). Commit to the claim.
- No filler openings ("In today's world"). Lead with the point.
- Active voice. Short sentences. One idea per sentence.
- No buzzwords: seamless, scalable, robust, leverage (verb), journey, ecosystem.
- Practitioner talking to a peer. Not a blog post written to impress.

Frontmatter:
---
title: "<post title>"
date: ${today}
tags: []
---

800-1200 words. Short punchy paragraphs. No headers needed for shorter posts.`,
    prompt: `Topic: ${blogTopic}${blogInstructions ? `\n\nAdditional guidance: ${blogInstructions}` : ''}`,
  });

  const submitCall = toolCalls.find(tc => tc.toolName === 'submit_draft');
  if (!submitCall) throw new Error('Agent did not produce a draft');

  const { title, slug, draft_content, research_needed } = submitCall.input;
  const branch = `blog/${today}-${slug}`;
  const filePath = `${contentPath}/${today}-${slug}.md`;

  const mainSha = await getRef(repo, 'main', env.GITHUB_TOKEN);
  await createBranch(repo, branch, mainSha, env.GITHUB_TOKEN);
  await createFileOnBranch(repo, filePath, draft_content, `blog(draft): ${title}`, branch, env.GITHUB_TOKEN);

  const prBody = `## Blog Post Draft

**Topic:** ${blogTopic}

Post is in \`${filePath}\`. Reply in Slack to iterate before publishing.

${research_needed?.length ? `**Research flagged:**\n${research_needed.map(r => `- ${r}`).join('\n')}\n\n` : ''}**To publish:** squash-merge this PR. The \`blog-publish\` workflow will cross-post to LinkedIn.

**To discard:** close without merging.`;

  const pr = await createPR(repo, branch, 'main', title, prBody, true, env.GITHUB_TOKEN);

  // Store thread context so follow-up Slack messages auto-route here
  if (threadTs) {
    await setThreadContext(threadTs, {
      branch,
      filePath,
      prUrl: pr.url,
      prNumber: pr.number,
      title,
    }, env);
  }

  return {
    prUrl: pr.url,
    prNumber: pr.number,
    title,
    filePath,
    content: draft_content,
    researchNeeded: research_needed ?? [],
  };
}

async function tavilySearch(query, apiKey) {
  if (!apiKey) return 'Search unavailable (no TAVILY_API_KEY set).';
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: true,
        search_depth: 'basic',
      }),
    });
    const data = await res.json();
    const results = (data.results || [])
      .map(r => `[${r.title}](${r.url})\n${r.content?.slice(0, 400)}`)
      .join('\n\n');
    return data.answer ? `Summary: ${data.answer}\n\nSources:\n${results}` : results;
  } catch (err) {
    return `Search failed: ${err.message}`;
  }
}
