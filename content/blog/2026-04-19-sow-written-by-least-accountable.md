---
title: "The SOW Is Written By the Person Least Accountable For Delivering It"
date: 2026-04-19
draft: false
pillar: "The Optimism Cascade"
tags: [sow, presales, mid-market, commerce, implementation]
---

Here's a pattern that shows up consistently across mid-market commerce implementations. It's not controversial once you see it. But almost nobody names it out loud.

The statement of work defines what gets built, how long it takes, and what it costs. It's written by the person on the selling team who is least likely to be on the project when things get hard.

This is a structural observation, not a criticism of anyone in it.

The presales architect or solutions consultant who writes the SOW is usually talented. They understand the platform. They've done discovery calls. They've mapped integrations on a whiteboard. They genuinely believe the scope is achievable in the timeline they've outlined.

But they're solving a different problem than the delivery team will solve. They're solving for "how do we win this deal in a way that's defensible and competitive." The delivery team will solve for "how do we actually build this thing with these specific APIs, this specific data model, and this specific client team."

Those are not the same problem.

The presales architect sees the integration landscape at altitude. They know there's an ERP connection, a CDP, an ESP, a payment gateway, maybe a loyalty platform. They've scoped hours against each one. What they haven't done, because they can't at this stage, is open the codebase. They haven't seen overlapping payment modules from different agency eras. They haven't found pricing logic scattered across four different places. They haven't discovered custom middleware that nobody documented because the developer who built it left years ago.

So the SOW says something like "Payment Gateway Migration: 120 hours" and everyone nods. It feels reasonable. It's a line item in a spreadsheet that adds up to a number competitive with other bids.

Six months later, the tech lead discovers that "payment gateway migration" means untangling three generations of payment architecture, migrating tokenized card data across providers, and reconciling transaction flows that behave differently for guest checkout, registered users, and B2B accounts with net terms. That's not 120 hours. That's 400 hours, and it's on the critical path.

Nobody lied. Nobody was negligent. The presales architect estimated based on what they could see. The problem is that what you can see before you open the codebase is about 30% of what's actually there. The other 70% is scar tissue from previous implementations, undocumented customizations, and integration debt that only reveals itself when you start pulling threads.

This pattern is consistent enough to call it a law: **the confidence of a commerce SOW is inversely proportional to the number of integration points in the stack.**

A simple storefront replatform with minimal integrations? The SOW is probably close to reality. A mid-market merchant with an ERP, a CDP, a search provider, a loyalty program, a subscription engine, and a custom pricing layer? The SOW is a work of well-intentioned fiction.

Here's what makes it structural rather than a skill gap. The presales architect is compensated, at least indirectly, on deal closure. The delivery team is compensated on utilization. The merchant pays for the delta between what was sold and what's actually required. By the time that delta becomes visible, the SOW is signed, the presales architect has moved to the next opportunity, and the delivery team is managing a change order conversation that feels adversarial even when both sides are trying to be fair.

Knowing this pattern exists is an advantage. Merchants who understand it ask better questions and structure better agreements. The best agencies will help you do exactly that.

Here's what to push for going into any mid-market commerce engagement:

**Treat the SOW as a hypothesis, not a contract.** The scope is an estimate based on what's knowable at signing. Build a change management process into the agreement from day one. The teams that do this well avoid the adversarial change order conversation entirely. They make scope evolution a normal part of how the project runs.

**Ask who wrote the SOW and whether they'll be on the project.** This isn't a gotcha question. It's a signal. If the presales architect is also the delivery architect, that's a strong sign. If there's a clean handoff with a documented knowledge transfer, that works too. Continuity between the person who scoped the work and the person who delivers it is one of the highest-value things an agency can offer.

**Demand a discovery phase before the SOW is finalized.** Not a sales discovery. A paid, technical discovery where someone opens the codebase, maps the real integration landscape, and produces an honest assessment of complexity. This costs money upfront. It saves multiples of that downstream. Agencies that offer this are telling you something important about how they operate.

**Look at the integration line items.** If each integration is a single line with a single hour range, push back. Real integration scoping breaks down by data flow direction, error handling, historical data migration, and edge cases. The SOW that reflects that granularity was built by someone who has actually delivered integrations, not just designed them on a whiteboard.

The SOW problem is structural to how services are sold. It won't disappear. But merchants who understand the pattern can avoid the most predictable failure mode in mid-market commerce: the project that was lost before implementation started, in the document everyone signed but nobody stress-tested.

Blue Acorn builds its engagements around exactly these principles. If you're navigating a complex commerce implementation and want a team that scopes honestly, structures for change, and closes the gap between what's sold and what's delivered, that's the conversation worth having.