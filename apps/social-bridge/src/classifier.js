/**
 * Three-label classifier using Claude Haiku 4.5.
 *
 * Labels:
 *   POLITICAL — substantive take on policy / electoral / civic issues
 *               → routes to leaning.blue
 *   PERSONAL  — non-political content (tech, hobbies, etc.)
 *               → routes per subreddit allowlist (doughatcher vs superterran)
 *   SKIP      — regardless of topic, content Doug-in-2026 would cringe at
 *               being publicly attributed to him: tantrum, ad hominem, cheap
 *               dunk with no argument, demonstrably wrong factual claim,
 *               "you can tell he's hot under the collar." Dropped entirely.
 *
 * Fails OPEN to "personal" — if the API errors, content goes to the catch-all
 * destination (superterran.net), NOT to leaning.blue and NOT skipped. Better
 * to mis-route than silently drop or mis-attribute.
 */

const SYSTEM_PROMPT = `You classify a single short social-media post (a Reddit comment by Doug Hatcher / u/superterran) into exactly one of three labels: POLITICAL, PERSONAL, or SKIP.

THE SKIP LABEL TAKES PRECEDENCE over the other two.

A post is SKIP only when BOTH conditions hold:
  (1) it does NOT contain a substantive opinion, argument, factual claim, recommendation, observation, or experience that stands on its own without knowing what it's replying to;
  AND
  (2) it falls into one of these categories:
    - cheap dunk, snark, or one-liner with no underlying reasoning ("stay classy, Vanilla", "lol ok bud", "cope harder", "you don't say")
    - ad hominem or personal attack without substantive critique
    - tantrum or rant — emotional venting with no reasoned point
    - demonstrably wrong factual claim that would embarrass Doug-in-2026
    - one-word reaction, "this", "+1", emoji-only, banter that requires external context to mean anything
    - partisan one-liner with no argument or evidence ("But Hillary's emails!", "Republicans just can't get anything right")

DO NOT mark as SKIP if the post contains ANY of:
  - A technical recommendation, opinion, or instruction (even brief — "Use Fedora on the M1 Pro for Magento" qualifies)
  - Local knowledge or advice ("Stick to Market Commons in Charleston, you'll feel like a yuppie")
  - A substantive workplace, relationship, or life observation ("You half-heartedly help, don't do much to save her from herself" — that's real advice)
  - A thoughtful argument or take, even if brief, where the reasoning is intelligible on its own
  - Topic-specific expertise, product reviews, or genuine recommendations

If SKIP does not apply, classify the remaining content:

POLITICAL covers: electoral politics, partisan policy debate, opinions on politicians/parties/candidates, government actions framed partisanly, civic activism, voting, abortion/guns/immigration/climate as policy issues, current events with a clear partisan slant.

PERSONAL covers: tech work, software/engineering, hobbies, family, sports, entertainment, jokes that have a point, neutral news links, life advice, local knowledge, product reviews, and any current event WITHOUT a partisan opinion.

When in doubt between POLITICAL and PERSONAL, lean PERSONAL.
When in doubt between SKIP and a substantive label, lean toward the substantive label — only SKIP what's genuinely contextless or cringe.

Respond with exactly one word: POLITICAL, PERSONAL, or SKIP.`;

/**
 * Classify text. Returns "political" | "personal" | "skip".
 */
export async function classify(text, env) {
  if (env.CLASSIFIER === "off" || !env.ANTHROPIC_API_KEY) {
    return "personal";
  }
  const model = env.CLASSIFIER_MODEL_ID || "claude-haiku-4-5";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text.slice(0, 4000) }],
      }),
    });
    if (!res.ok) {
      console.warn("classifier non-200:", res.status, await res.text());
      return "personal";
    }
    const data = await res.json();
    const word = (data?.content?.[0]?.text || "").trim().toUpperCase();
    if (word.startsWith("SKIP")) return "skip";
    if (word.startsWith("POLITICAL")) return "political";
    return "personal";
  } catch (e) {
    console.warn("classifier error:", e.message);
    return "personal";
  }
}
