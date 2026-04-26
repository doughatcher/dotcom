---
title: "The Estimate Survived. The Integration Map Didn't."
date: 2026-04-26
pillar: "The Constellation"
tags: [integration, estimation, replatform, mid-market]
linkedin_copy: |
  The platform migration estimate holds. It almost always does. The storefront, the templates, the checkout flow, the content migration. All within margin.
  
  Then the integrations start. And the timeline dissolves.
  
  ERP sync hits field-mapping mismatches nobody surfaced in discovery. The OMS handoff needs a custom queue because the new platform handles order events differently. The CDP integration requires a consent layer that was not in the spec because the vendor changed their API between signing and kickoff. The tax engine works in staging and throws jurisdiction errors in production.
  
  Each one is a two-day problem on paper. Each one takes a week because it requires coordination across vendor teams that were not in the sprint plan. And there are eight of them.
  
  The pattern is consistent across mid-market commerce: the platform gets scoped as the project, and the integration architecture gets scoped as an appendix. A section near the back of the SOW. A line item labeled "integrations" with a rounded percentage.
  
  But a typical mid-market stack in 2026 touches ten or more integration boundaries. ERP, DAM, PIM, OMS, search, CDP, payments, tax, identity, and at least one custom internal system. Each with its own API cadence, auth model, error behavior, and vendor support response time.
  
  The platform determines maybe 20% of the outcome. The integration architecture determines the other 80%.
  
  The fix is not better estimation. It is changing what gets treated as the primary artifact in discovery. The integration map should be the spine of the project plan, not an attachment. Sprint planning should organize around integration boundaries, not platform features. The critical path should trace through the integration with the longest vendor response time.
  
  Merchants who get this right insist on one thing: a dedicated integration architecture review in discovery, before the SOW is signed, with every vendor team in the room at the same time. That single meeting surfaces more timeline risk than any estimation exercise.
  
  Full post: {{url}}
---

Here is a pattern I have watched play out on more projects than I can count.

The platform migration estimate holds. The team scoped the storefront work carefully. Templates, cart logic, checkout flow, content migration, search configuration. All of it lands within a reasonable margin of the original number.

Then the integrations start.

ERP sync runs into field-mapping mismatches that nobody surfaced in discovery. The OMS handoff requires a custom queue because the new platform handles order events differently than the old one. The CDP integration needs a consent layer that was not in the original spec because the CDP vendor changed their API between contract signing and kickoff. The tax engine works fine in staging and throws tax-jurisdiction errors in production because the test data did not cover enough states.

Each of these is a two-day problem on paper. In practice, each one takes a week because it requires coordination across two or three vendor teams that were not part of the original sprint plan. And there are eight of them. Or twelve.

The estimate survived. The integration map did not.

This is not a story about bad estimators. The people who scoped the platform work did their job well. The problem is structural. In most mid-market commerce projects, the platform migration gets treated as the project, and the integration architecture gets treated as an appendix. A section near the back of the SOW. A line item labeled "integrations" with a percentage allocation that somebody rounded.

But the integration map is not an appendix. It is the spine.

A typical mid-market commerce stack in 2026 touches an ERP, a DAM, a PIM, an OMS, a search platform, a CDP, a payment gateway, a tax engine, an identity provider, and at least one custom internal system. That is ten integration boundaries. Each one has its own API versioning cadence, its own authentication model, its own error-handling behavior, and its own vendor support response time.

The platform choice determines maybe 20% of the project outcome. The integration architecture across these ten boundaries determines the other 80%. Almost nobody scopes it that way.

Why? Because the sales process leads with platform fit. The RFP asks about platform capabilities. The vendor demo shows the platform admin. The executive sponsor signed off on a platform decision, not an integration architecture decision. By the time the integration map gets serious attention, the SOW is already signed, the team is already staffed, and the timeline is already committed.

So the team discovers the integration complexity in sprint three instead of in discovery. And the response is predictable: compress the timeline, rebalance resources, and hope the integration vendors are responsive. Sometimes they are. Often they are not.

The fix is not better estimation, though better estimation helps. The fix is changing what gets treated as the primary artifact in discovery.

If I were advising a merchant entering a replatform, the first thing I would want to see is not the platform selection matrix. It is the integration map. Every system the new platform needs to talk to. Every data flow between them. Every authentication boundary. Every vendor support SLA. Every API version in production today versus the version the new platform expects.

That map should be the spine of the project plan. Sprint planning should organize around integration boundaries, not platform features. The critical path should trace through the integration with the longest vendor response time, not the feature with the most story points.

This sounds obvious when stated plainly. But go look at the last three SOWs you reviewed. Find the integration section. Count the pages dedicated to it versus the pages dedicated to platform features and storefront design. The ratio will tell you everything about where the project is going to surprise you.

The merchants who get this right do one thing differently. They insist on a dedicated integration architecture review in discovery, before the SOW is signed, with every vendor team in the room at the same time. Not sequentially. Not through the SI as a proxy. In the room, on the same call, at the same time.

That single meeting surfaces more timeline risk than any estimation exercise. Because the vendors will tell you, in real time, what their API can and cannot do. They will tell you about the version migration they have scheduled for Q3 that nobody mentioned in the sales process. They will tell you that the webhook format changed last month and the documentation has not caught up.

That information, captured in discovery, saves weeks in build. Captured in sprint three, it costs weeks.

The estimate is not the problem. The estimate reflects what was scoped. The problem is what was not scoped. And what was not scoped, almost always, is the map between the boxes.