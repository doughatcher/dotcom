/**
 * Ask Claude what the user wants to do.
 *
 * Returns:
 *   { action, summary, voiceNote, blogSlug, blogTopic, blogInstructions }
 *
 * action is one of:
 *   'update_voice_profile' — add/update a writing style rule
 *   'update_blog_post'     — revise a specific existing blog post
 *   'create_blog_post'     — write a brand-new draft post on a topic
 *   'merge_blog_post'      — merge/publish a draft PR
 *   'update_both'          — update voice profile + revise existing post
 *   'unclear'              — couldn't parse intent
 */

import { generateText, tool } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export async function parseIntent(userText, env) {
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const { toolCalls } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    tools: {
      parse_intent: tool({
        description: 'Parse the user\'s editorial feedback into a structured action plan',
        parameters: z.object({
          action: z.enum([
            'update_voice_profile',
            'update_blog_post',
            'create_blog_post',
            'merge_blog_post',
            'update_both',
            'unclear',
          ]).describe('What the user wants to do'),
          summary: z.string().describe('One sentence summary of what will be changed'),
          voiceNote: z.string().optional().describe(
            'The specific writing style rule to add to the voice profile. Only for update_voice_profile or update_both.'
          ),
          blogSlug: z.string().optional().describe(
            'The slug or partial title of an EXISTING blog post to edit or merge. Only for update_blog_post, merge_blog_post, or update_both. Leave empty if the post does not exist yet.'
          ),
          blogTopic: z.string().optional().describe(
            'Plain-language description of what a NEW post should be about. Only for create_blog_post. NOT a slug.'
          ),
          blogInstructions: z.string().optional().describe(
            'For update_blog_post: editing instructions. For create_blog_post: additional angle/tone guidance.'
          ),
        }),
      }),
    },
    toolChoice: { type: 'tool', toolName: 'parse_intent' },
    messages: [{
      role: 'user',
      content: `The user sent this message to an editorial assistant bot. It may be a voice transcript — expect run-on sentences, informal language, and stream-of-consciousness phrasing.

Message:
"${userText}"

The bot can:
1. Update a voice profile / writing style guide (stored in Obsidian vault)
2. Revise an EXISTING blog post (stored in a GitHub repo)
3. Write a NEW blog post draft on a given topic (creates a draft PR)
4. Merge/publish a draft blog post PR that's already been written
5. Do both voice profile update + existing post revision at once

Parsing rules — read carefully:
- "write a post about X", "draft a post on X", "I'd like to see a post about X", "can you write about X" = CREATE a NEW post (create_blog_post). Set blogTopic to X. Do NOT set blogSlug.
- If they mention revising, editing, updating, rewriting, fixing a post that already exists by name/slug = update an EXISTING post (update_blog_post). Set blogSlug.
- "publish the X post", "merge the X PR", "go ahead and publish X" = merge_blog_post. Set blogSlug.
- "regenerate the post", "rewrite the post", "fix the post" = update_blog_post if they name a specific post.
- Writing style / voice rules = update_voice_profile. Capture as a clear, actionable rule in voiceNote.
- When intent spans both voice style and existing post content, use update_both.
- Only return unclear if the message is genuinely unrelated to writing or editorial work.

CRITICAL: Do not confuse "write a new post about enterprise AI" (create_blog_post) with "edit the enterprise-ai post" (update_blog_post). If no existing post by that name could plausibly exist, it's a creation request.

For blogInstructions, synthesize their intent into clear instructions — do not just transcribe what they said.`,
    }],
  });

  return toolCalls[0]?.args ?? { action: 'unclear', summary: userText };
}
