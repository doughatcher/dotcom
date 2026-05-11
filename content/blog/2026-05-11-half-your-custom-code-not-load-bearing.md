---
title: "Half Your Custom Code Is Not Load-Bearing"
date: 2026-05-11
pillar: "The Merchant-Side Gap"
tags: []
linkedin_copy: |
  Every commerce platform I have migrated carried custom code that nobody could explain.
  
  Not "nobody remembered." Nobody could articulate what it did, why it existed, or whether removing it would break anything visible to a customer. The code was there. It had been there for years. And nobody on the current team had ever seen it execute for a purpose anyone could name.
  
  This is where replatform budgets go to die.
  
  A mature mid-market commerce platform accumulates dozens of customizations over five to seven years. Each made sense at the time. A holiday campaign checkout flow. A loyalty points calculation. A shipping rule for a specific warehouse. A feature a VP requested that got built in two sprints and never revisited.
  
  Some of that code is genuinely load-bearing. Your multi-state tax logic. Your inventory sync to the WMS. Your subscription billing flow. Remove those and the business breaks.
  
  But the promotional pricing override built for a 2021 campaign? The product badge logic one merchandiser used before they left? The API endpoint feeding a dashboard nobody has opened in eighteen months?
  
  Telling those apart is the project. And it is the work that almost never gets done before the scope is committed.
  
  The agency selling the replatform has a structural incentive to scope everything. If the current platform has forty custom features, the safe play is to scope forty on the new platform. Defensible. Thorough. Also how a migration that should cost X ends up costing 2X.
  
  The harder play is to audit the custom code, classify each piece, and present findings to the merchant. That means telling someone: "This feature your predecessor approved and your team maintained for three years does not appear to be used." Politically expensive. Most agencies skip it.
  
  The result: merchants enter design carrying a full list of "must-have" features, half of which are not must-haves. The vanilla SaaS promise they bought collapses under the weight of reimplementing capabilities that should have been retired.
  
  Thirty to forty percent of custom development scope in a typical migration, in my experience, does not survive a honest audit. That is not a rounding error. That is the budget for the features that actually matter.
  
  Full post: {{url}}
---

Every commerce platform I have ever migrated carried custom code that nobody could explain.

Not "nobody remembered." Nobody could explain what it did, why it existed, or whether removing it would break anything. The code was there. It had been there for years. It had tests. It had documentation, sometimes. And nobody on the current team had ever seen it execute in production for a purpose anyone could name.

This is normal. It is also where replatform budgets go to die.

## The accumulation problem

Commerce platforms accumulate custom code the way houses accumulate extension cords. Each one made sense at the time. A holiday campaign needed a custom checkout flow. A loyalty program required a non-standard points calculation. A specific warehouse had a shipping rule that did not fit the platform's native logic. A VP requested a feature that the team built in two sprints and never revisited.

Over five or seven years, a mature commerce platform carries dozens of these customizations. Some are critical. The custom tax logic that handles your multi-state nexus obligations is load-bearing. The integration that syncs inventory to your warehouse management system every fifteen minutes is load-bearing. The checkout modification that handles your subscription billing is load-bearing.

The promotional pricing override that was built for a campaign in 2021? Probably not. The custom product badge logic that one merchandiser used before they left the company? Probably not. The API endpoint that feeds a reporting dashboard nobody has opened in eighteen months? Probably not.

Telling those apart is the project.

## Why agencies do not do this work

The agency selling the replatform has a structural incentive to scope everything. If the merchant's current platform has forty custom features, the safe play is to scope forty custom features on the new platform. This approach is defensible. It is thorough. It is also how a migration that should cost X ends up costing 2X.

The harder play is to audit the custom code, classify each piece as load-bearing or not, present the findings to the merchant, and let them make informed decisions about what to carry forward. This requires someone to walk into a room and say: "This feature that your predecessor approved and your team has maintained for three years does not appear to be used. We recommend not rebuilding it."

That conversation is politically expensive. Someone approved that spend. Someone maintained it. Calling it unnecessary feels like calling their judgment unnecessary. Most agencies avoid this conversation entirely by scoping the safe path and letting the budget absorb the waste.

## The vanilla SaaS promise collapses here

Merchants buy replatforms with a vision of simplicity. Move to a modern SaaS platform. Reduce custom code. Lower maintenance burden. Increase speed to market. The pitch is compelling because it is true in theory.

In practice, the merchant arrives at the design phase and discovers that a meaningful subset of their current custom behavior does not exist in the new platform's native feature set. Now they face a choice nobody prepared them for: give up the capability, or customize the new platform to replicate it.

This is where the vanilla SaaS promise breaks. Not because the platform is insufficient. Because nobody did the work upfront to determine which custom capabilities were actually essential to the business.

The merchant who skips the audit enters design with a full list of "must-have" features, half of which are not must-haves. The merchant who does the audit enters design with a short list of genuinely load-bearing capabilities and a clear understanding of what they are choosing to leave behind.

## How to do the audit

The method is not complicated. It is tedious, which is why it gets skipped.

Start with the custom code inventory. Every modification, extension, plugin, custom API endpoint, and non-standard configuration on the current platform. List them. This is a technical exercise and usually takes a senior developer two to three days on a mid-market platform.

For each item, answer three questions:

1. Is this code executing in production? Check logs, not assumptions. If there is no evidence of execution in the last ninety days, flag it.

2. Does a current employee own or use the output of this code? If the answer is "I think so" or "the person who used it left," flag it.

3. If this capability disappeared tomorrow, what business process would break? If nobody can answer specifically, flag it.

The items that survive all three questions are load-bearing. Scope them for migration. The items that do not survive are candidates for retirement. Present them to the merchant with the evidence and let them decide.

## The conversation nobody wants to have

The real value of this audit is not the technical inventory. It is the conversation it forces.

When you put a list in front of a merchant that says "here are twenty-two custom features on your current platform, and our assessment is that nine of them are load-bearing," you are giving them something they almost never get: the ability to make an informed decision about scope before the budget is committed.

Most merchants have never seen this list. They approved these features individually over years. Nobody ever showed them the aggregate picture and asked: "Do you still need all of this?"

The answer is almost always no. And the budget savings from that "no" are significant. Not ten percent. Thirty to forty percent of the custom development scope in a migration, in my experience.

That is the gap. Not a technology gap. An information gap on the merchant side of the table. The merchant cannot make good scope decisions without data they do not have, and nobody in the room is incentivized to give it to them.

Someone should be.