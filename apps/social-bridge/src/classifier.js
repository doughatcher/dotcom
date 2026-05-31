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

SKIP applies regardless of topic when:
- The post is a cheap dunk, snark, or one-liner without an underlying argument ("stay classy, Vanilla", "lol ok bud", "cope harder")
- The post is an ad hominem or personal attack without substantive critique
- The post reads as a tantrum, rant, or "hot under the collar" — emotional venting without a reasoned point
- The post makes a demonstrably wrong factual claim that would embarrass Doug-in-2026
- The post is so short or contextless it conveys nothing meaningful on its own (one-word reactions, "this", "+1", emoji-only)
- Doug-in-2026 (an enterprise architect building a public professional + personal brand) would cringe at this being publicly attributed to him

If SKIP does not apply, classify the remaining content:

POLITICAL covers: electoral politics, partisan policy debate, opinions on politicians/parties/candidates, government actions framed partisanly, civic activism, voting, abortion/guns/immigration/climate as policy issues, current events with a clear partisan slant.

PERSONAL covers: tech work, software/engineering, hobbies, family, sports, entertainment, jokes (that have a point), neutral news links, and any current event WITHOUT a partisan opinion.

When in doubt between POLITICAL and PERSONAL, lean PERSONAL.
When in doubt between SKIP and a real label, lean SKIP — keep the bar high for public attribution.

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
