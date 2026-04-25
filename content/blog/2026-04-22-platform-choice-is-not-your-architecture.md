---
title: "Your Platform Choice Is Not Your Architecture"
date: 2026-04-22
draft: false
pillar: "The Constellation"
tags: [commerce, architecture, integration, replatform, mid-market]
linkedin_copy: |
  Most mid-market merchants spend six months choosing a commerce platform and six days deciding how everything else connects to it.
  
  Then they wonder why the new platform feels just as brittle as the old one.
  
  The platform handles catalog, cart, checkout, and promotions. That is real scope. But around it sits a constellation of systems that actually produce the outcomes everyone cares about: CDP for segmentation, ESP for lifecycle messaging, OMS for order routing, tax, payments, loyalty, search, subscriptions, attribution.
  
  Each system has its own data model, its own API contract, its own release cadence, and its own opinion about what "the customer" looks like. The integration architecture across these systems accounts for roughly 80% of project complexity and 80% of post-launch pain.
  
  But scoping inverts those numbers. The platform gets 80% of the attention. Integrations get a blended line item: "third-party integrations (8)." As if integrating a tax engine and integrating a CDP are the same category of work.
  
  A tax engine has a constrained request/response contract. A CDP integration is an open-ended data architecture problem: event design, identity resolution across channels, segment evaluation latency at checkout, conflict handling when the CDP and platform disagree about who a customer is.
  
  When integration complexity gets underscoped, every connection gets built point-to-point with no middleware, no error handling strategy, and no monitoring. You end up with a brand-new platform that has the same data integrity problems as the old one. Orders that do not sync. Loyalty points that lag. Personalization firing on stale segments.
  
  The architecture is not a diagram of boxes and arrows. It is specific decisions about event contracts, failure modes, identity resolution, latency budgets, and observability. The platform is just the thing in the middle.
  
  Full post: {{url}}
---

I have watched merchants spend six months evaluating platforms and six days deciding how everything else connects to them. Then they wonder why the new platform feels just as brittle as the old one.

This is the most expensive misunderstanding in mid-market commerce.

## The decision that gets all the attention

The platform evaluation is a magnet for executive energy. It has a clear decision point, a vendor beauty contest, reference calls, a board presentation. It feels like the most consequential call you will make. Entire consulting engagements exist just to help you choose between two or three options.

And the platform does matter. But it matters less than you think.

A commerce platform handles catalog, cart, checkout, and maybe promotions and content. That is a real surface area. It is not, however, the whole surface area. Not even close.

## The decision that does not get enough attention

Around that platform sits a constellation of systems that actually produce the customer experience and the business outcomes you care about. CDP for segmentation and personalization. ESP for lifecycle messaging. OMS for order routing and fulfillment. Tax engine. Payment processor. Loyalty platform. Search and merchandising. Reviews. Subscriptions. Attribution.

Each of these systems has its own data model, its own API contract, its own release cadence, and its own opinion about what "the customer" looks like. The platform sits in the center, but it does not control these systems. It connects to them. And the quality of those connections is what determines whether the whole thing works or falls apart at load.

I would estimate, conservatively, that the integration architecture across these systems accounts for 80% of project complexity and 80% of post-launch operational pain. The platform accounts for 20%.

But the scoping inverts those numbers. The platform gets 80% of the attention. The integrations get scoped in a line item that says something like "third-party integrations (8)" with a blended estimate that assumes each one is roughly the same size.

They are not roughly the same size.

## What goes wrong

Integrating a tax engine is a different problem than integrating a CDP. A tax engine has a well-defined request/response contract: here is a cart, tell me the tax. The data model is constrained. The failure modes are known. You can scope it in hours with confidence.

A CDP integration is an open-ended data architecture problem. Which events flow from the platform to the CDP? Which segments flow back? How do you reconcile identity across sessions, devices, and channels? What happens when the CDP's notion of a customer profile conflicts with the platform's? How do you handle latency in segment evaluation at checkout?

These are different categories of work. Scoping them the same way is like scoping "install a light switch" and "rewire the panel" as the same task because both involve electrical work.

When integration complexity gets underscoped, one of two things happens. Either the team burns through the budget on the first few integrations and the rest get cut or rushed. Or every integration gets built as a point-to-point connection with no middleware, no error handling strategy, and no monitoring, because there was no time to build the connective tissue.

The second outcome is more common. And it is how you end up with a brand-new platform that has the same data integrity problems as the old one. Orders that do not sync to the OMS. Loyalty points that lag by hours. Personalization that fires on stale segments. Tax calculations that fail silently and default to zero.

## What "architecture" actually means here

When I say "architecture" in the context of mid-market commerce, I do not mean a diagram of boxes and arrows on a slide. I mean concrete decisions about:

- **Event contracts.** What data moves between systems, in what shape, triggered by what action, and with what guarantees about delivery?
- **Failure modes.** When a downstream system is unavailable, does the platform block the customer, degrade gracefully, or silently lose data? You need a specific answer for each integration, not a general philosophy.
- **Identity resolution.** How does a customer in the platform map to a profile in the CDP, a subscriber in the ESP, and a member in the loyalty system? Who is the source of truth, and what happens when they disagree?
- **Latency budgets.** Which integrations are synchronous (blocking the customer) and which are asynchronous? A payment authorization must be synchronous. A loyalty accrual can be eventual. A personalization call at checkout might need to be synchronous but with a 200ms timeout and a fallback.
- **Observability.** When an integration fails at 2am on a Saturday during a flash sale, how do you know? What alerts? What logs? What is the runbook?

These decisions are the architecture. The platform is just the thing in the middle.

## The practical upshot

If you are a merchant evaluating a replatform, spend less time on the platform beauty contest and more time asking these questions:

1. How many systems will connect to this platform on day one? List them.
2. For each one, what is the integration pattern? Event-driven, batch, synchronous API call?
3. Who is scoping each integration individually, not as a blended line item?
4. What happens to the customer experience when each integration fails?
5. Who owns these integrations after launch?

If your SI cannot answer these questions during scoping, the platform choice will not save you. You will have a new, expensive platform surrounded by the same fragile wiring. And eighteen months from now, someone will be in a room saying "the replatform did not deliver the results we expected," and they will blame the platform.

The platform was fine. The architecture was never defined.