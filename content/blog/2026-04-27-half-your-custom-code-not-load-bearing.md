---
title: "Half Your Custom Code Is Not Load-Bearing, but Nobody Will Tell You Which Half"
date: 2026-04-27
pillar: "The Merchant-Side Gap"
tags: [migration, custom-code, replatform, merchant-side, commerce]
linkedin_copy: |
  Every platform migration starts with a spreadsheet of custom features the merchant wants to bring forward. In my experience, roughly half of that list is not load-bearing. It is the residue of workarounds built because the old platform could not do something natively. The workaround became normal. Normal became "essential." Nobody remembers the original constraint, but the feature is on the migration list because it exists.
  
  The merchant does not know which half is which. And here is the structural problem: nobody in the room is paid to help them figure it out.
  
  The incoming platform vendor benefits from a longer feature list because it justifies a larger implementation. The incoming agency benefits because more custom work means more billable hours. Each party is responding rationally to their incentive structure. Nobody is lying. The merchant just pays for all of it.
  
  The work that should happen before the feature list becomes a Statement of Work is a custom-code triage. Not a technical audit. A business audit. Three questions per feature: Does it exist because of a real business requirement, or because the old platform lacked a native capability the new one provides? If it disappeared tomorrow, what is the revenue impact? What does it cost annually to maintain as custom code on the new platform?
  
  Those questions eliminate the ghosts, separate load-bearing features from inherited habits, and put a price on every decision to carry something forward.
  
  Most merchants have never been walked through this exercise. The people across the table during a migration are not paid to reduce scope. They are paid to deliver it. The role that is missing is someone whose only job is to represent the merchant's interest during the scoping conversation. Someone technical enough to know which features translate natively and commercial enough to challenge "we have always had it" as a justification.
  
  That voice almost never exists. The cost of its absence gets absorbed into the project budget as if it were inevitable. It is not inevitable. It is structural.
  
  Full post: {{url}}
---

Every platform migration starts with a spreadsheet of custom features the merchant wants to bring forward.

Some of those features are real differentiators. Custom pricing logic that matches a complex B2B contract structure. A returns flow tuned to the way the warehouse actually operates. A checkout modification that accounts for a regulatory requirement specific to their vertical.

The rest are ghosts. Features that were built because the old platform could not do something natively, so someone wrote a workaround five years ago. The workaround became normal. Normal became "essential." Nobody remembers why it was built, but it is on the migration list because it exists.

The merchant does not know which is which. And nobody in the room is paid to help them figure it out.

## Why the list is always too long

The migration feature list is usually assembled by someone on the merchant's team who was told to document "everything we have today." They are thorough. They catalog every custom behavior, every modified template, every integration touchpoint.

Thoroughness is the wrong instinct here. The right instinct is triage. But triage requires a question that nobody on the migration team is asking: does this feature earn its maintenance cost on the new platform?

That question is hard. Not technically hard. Politically hard.

The person who built the feature is sometimes still on the team. The business unit that requested it still believes it matters. The last agency that maintained it billed against it for three years. Everyone in the chain has a reason to keep it on the list.

## Who benefits from the long list

The incoming platform vendor benefits because a longer feature list justifies a larger implementation scope. The incoming agency benefits because more custom work means more billable hours. The outgoing agency has no opinion because they are already gone.

The merchant pays for all of it.

This is not a conspiracy. Nobody is lying. Each party is responding rationally to their own incentive structure. The vendor wants the deal to close. The agency wants the SOW to be large enough to staff well. The merchant wants to feel confident that nothing will break in the transition.

But confidence and accuracy are not the same thing. Carrying every custom feature forward feels safe. It is expensive. And it locks the merchant into a maintenance burden on the new platform that replicates the maintenance burden they were trying to escape.

## The audit nobody performs

The work that should happen before the migration feature list becomes a Statement of Work is a custom-code triage. Not a technical audit. A business audit.

For each custom behavior on the list, three questions:

1. Does this feature exist because of a genuine business requirement, or because the old platform lacked a native capability that the new platform provides out of the box?
2. If this feature disappeared tomorrow, what would the revenue impact be? Can anyone quantify it, or is the answer "we have always had it"?
3. What is the annual maintenance cost of carrying this feature forward as custom code on the new platform?

Question one eliminates the ghosts. Question two separates the load-bearing features from the inherited habits. Question three puts a price on the decision to keep something.

Most merchants have never been walked through these questions. Not because they are hard questions, but because the people sitting across the table from the merchant during a migration are not paid to reduce scope. They are paid to deliver scope.

## The role that is missing

What the merchant needs at this stage is someone whose only job is to represent the merchant's interest in the scoping conversation. Someone who understands the technical landscape well enough to know which features translate natively to the new platform. Someone who understands the business well enough to challenge "we have always had it" as a justification.

This person does not work for the platform vendor. They do not work for the agency. They work for the merchant, temporarily, during the most consequential decision window of the migration: the moment the feature list becomes a budget.

Agencies will not volunteer to reduce their own scope. They are not being dishonest. They are being rational. The incentive structure does not reward the agency for saying "you do not need half of this."

Platform vendors will not volunteer it either. Their sales motion depends on the merchant believing the migration will be comprehensive. "We will bring everything forward" is a closing line, not a technical assessment.

So the merchant carries the full list into the SOW. The SOW prices the full list. The project delivers the full list. And six months after launch, someone on the merchant's team quietly turns off three features that nobody was using, and nobody notices.

Those three features cost real money to build, test, and deploy. That money is gone.

## The pattern

This is not a one-time problem. It recurs on every migration because the structure of the migration conversation creates it. The buyer wants safety. The seller wants scope. The feature list is the artifact where those two desires meet, and it always grows.

The only intervention that works is an independent voice in the room during scoping. Someone who can look at the feature list and say, with credibility and specificity: this half is load-bearing, and this half is not.

That voice almost never exists. The merchant does not know to ask for it. The agency does not offer it. And the cost of its absence gets absorbed into the project budget as though it were inevitable.

It is not inevitable. It is structural. And structural problems have structural fixes.