---
title: "The SOW Is Written By the Person Least Accountable For Delivering It"
date: 2026-04-19
draft: true
pillar: "The Optimism Cascade"
tags: [sow, presales, mid-market, commerce, implementation]
---

Here's a pattern I've seen play out dozens of times across mid-market commerce implementations. It's not controversial once you see it, but almost nobody names it out loud.

The statement of work — the document that defines what gets built, how long it takes, and what it costs — is written by the person on the selling team who is least likely to be on the project when things get hard.

This isn't an accusation. It's a structural observation.

The presales architect or solutions consultant who writes the SOW is usually talented. They understand the platform. They've done discovery calls. They've mapped out integrations on a whiteboard. They genuinely believe the scope is achievable in the timeline they've outlined.

But they're solving a different problem than the delivery team will solve. They're solving for "how do we win this deal in a way that's defensible and competitive." The delivery team will solve for "how do we actually build this thing with these specific APIs, this specific data model, and this specific client team."

Those are not the same problem.

The presales architect sees the integration landscape at altitude. They know there's an ERP connection, a CDP, an ESP, a payment gateway, maybe a loyalty platform. They've scoped hours against each one. What they haven't done — because they can't, at this stage — is open the codebase. They haven't seen the three overlapping payment modules from three different agency eras. They haven't discovered that the pricing logic lives in four different places. They haven't found the custom middleware that nobody documented because the developer who built it left two years ago.

So the SOW says something like "Payment Gateway Migration — 120 hours" and everyone nods. It feels reasonable. It's a line item in a spreadsheet that adds up to a number that's competitive with the other bids.

Six months later, the tech lead on the project discovers that "payment gateway migration" actually means untangling three generations of payment architecture, migrating tokenized card data across providers, and reconciling transaction flows that behave differently for guest checkout, registered users, and B2B accounts with net terms. That's not 120 hours. That's 400 hours, and it's on the critical path.

Nobody lied. Nobody was negligent. The presales architect did their job — they estimated based on what they could see. The problem is that what you can see before you open the codebase is about 30% of what's actually there. The other 70% is scar tissue from previous implementations, undocumented customizations, and integration debt that only reveals itself when you start pulling threads.

This pattern is so consistent I'd call it a law: **the confidence of a commerce SOW is inversely proportional to the number of integration points in the stack.**

A simple storefront replatform with minimal integrations? The SOW is probably close to reality. A mid-market merchant with an ERP, a CDP, a search provider, a loyalty program, a subscription engine, and a custom pricing layer? The SOW is a work of collaborative fiction. Well-intentioned fiction, but fiction.

Here's what makes it structural rather than just a skill gap: the presales architect is usually compensated, at least indirectly, on deal closure. The delivery team is compensated on utilization. The merchant is paying for the delta between what was sold and what's required. But by the time that delta becomes visible, the SOW is signed, the presales architect has moved to the next opportunity, and the delivery team is managing a change order conversation that feels adversarial even when both sides are trying to be fair.

I've been on every side of this table. I've written SOWs. I've delivered against SOWs someone else wrote. I've watched merchants try to hold agencies to scope documents that were structurally incapable of being accurate.

So what's the fix? It's not to blame the presales process. It's to change what the merchant expects from the SOW in the first place.

A few things I'd tell any merchant going into a mid-market commerce engagement:

**Treat the SOW as a hypothesis, not a contract.** The best agencies will tell you this themselves. The scope is an estimate based on what's knowable at signing. Build a change management process into the agreement from day one, not as an afterthought when reality diverges.

**Ask who wrote the SOW and whether they'll be on the project.** This isn't a gotcha question. It's a signal. If the presales architect is also the delivery architect, that's a good sign. If there's a clean handoff with a documented knowledge transfer, that's fine too. If the SOW was written by someone you'll never see again — that's a risk worth pricing in.

**Demand a discovery phase before the SOW is finalized.** Not a sales discovery. A paid, technical discovery where someone opens the codebase, maps the real integration landscape, and produces an honest assessment of complexity. This costs money upfront. It saves multiples of that money downstream.

**Look at the integration line items.** If each integration is a single line with a single hour range, be skeptical. Real integration scoping breaks down by data flow direction, error handling, historical data migration, and edge cases. If the SOW doesn't reflect that granularity, it was estimated at altitude.

The SOW problem isn't going away. It's structural to how services are sold. But merchants who understand the pattern can ask better questions, structure better agreements, and avoid the most predictable failure mode in mid-market commerce: the project that was lost before implementation started, in the document everyone signed but nobody stress-tested.