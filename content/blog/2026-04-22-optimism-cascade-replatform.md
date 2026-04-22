---
title: "Big Deals Die From the Same Optimism That Won Them"
date: 2026-04-22
draft: true
pillar: "The Optimism Cascade"
tags: [replatform, sales-cycle, scoping, mid-market, commerce]
linkedin_copy: |
  A $1.2M replatform becomes a $2M replatform without anyone lying. I have watched this happen repeatedly, and the pattern is always the same.
  
  The sales team trims scope assumptions to fit the merchant's budget. Each trim is defensible on its own. The solutions architect designs to the sold scope, making another set of reasonable, slightly optimistic calls. Delivery inherits a plan where every integration is estimated at the low end of the range and every platform behavior is assumed to work out of box.
  
  Three weeks in, the CDP connector needs custom field mapping. The OMS handoff has a split-shipment edge case that doubles complexity. The checkout customization touches a platform limitation the vendor does not advertise.
  
  Nobody was reckless. Nobody lied. But every person in the chain leaned optimistic in the same direction, and nobody had both the incentive and the authority to add it all up.
  
  This is the structural problem in mid-market commerce that nobody names out loud. The sales team's job is to close. The SA's job is to design within sold scope. The PM's job is to deliver on plan. Each person is doing their job correctly. The outcome is still a project that was underwater before the first sprint started.
  
  Three things break the pattern, and none are popular: scope with a budget for reality instead of the happy path, put an independent technical advisor on the merchant's side of the table during the sales cycle, and restructure SOWs to separate known work from discovery work with real go/no-go gates.
  
  The reason this does not change is that the current structure works well enough for the SI even when it fails the merchant. The merchant absorbs the cost through delayed launches and missed revenue targets. The SI absorbs it through staff rotation and quietly descoped stabilization phases.
  
  The optimism was not the mistake. The mistake was having nobody in the room whose job it was to name it.
  
  Full post: {{url}}
---

Here is how a $1.2M replatform becomes a $2M replatform without anyone lying.

The sales team talks to the merchant. The merchant has real pain: slow site, outdated platform, integrations held together with duct tape. The sales team listens carefully. They scope a solution that addresses every pain point. Then they look at the number and realize it is 40% higher than what the merchant's budget can absorb.

So they trim. Not dishonestly. They trim by assuming the data migration will be straightforward. They trim by estimating the integrations at the low end of the range. They trim by noting that the merchant's team will handle some of the UAT. Each assumption, taken alone, is defensible. Together, they remove about 25% of the realistic cost.

The deal closes.

Now the solutions architect picks it up. They read the SOW. They see the assumptions. They know some are tight, but the SA's job is to design the solution that fits the scope that was sold. So they make their own set of small optimistic choices. The CDP integration gets scoped as a standard connector. The OMS handoff gets two weeks instead of four. The custom checkout logic gets estimated as if the platform's out-of-box behavior will need only minor extension.

Each of these calls is reasonable. None of them are reckless. But each one leans in the same direction.

Now delivery starts. The project manager builds the plan from the SA's design. The developers start building. Within three weeks, somebody discovers that the "standard connector" for the CDP requires custom field mapping that was not in scope. The OMS handoff has an edge case around split shipments that doubles the integration complexity. The checkout customization touches a platform area that has known limitations the vendor does not advertise.

None of this is surprising to anyone who has done it before. All of it is surprising to the budget.

This is the optimism cascade. It is not fraud. It is not incompetence. It is what happens when every person in a long chain makes a slightly optimistic call, and nobody in the chain has both the incentive and the authority to add it all up and say: this does not work.

The sales team's incentive is to close the deal. The SA's incentive is to design a buildable solution within the sold scope. The PM's incentive is to deliver on time. The developers' incentive is to build what they are told to build. Everyone is doing their job. The problem is structural.

The merchant sits at the end of this chain. They approved a number. They planned around that number. Their board or their CFO or their CEO saw that number. Six months later, when change orders start arriving, the merchant feels blindsided. But the SI does not feel like they did anything wrong, because individually, they did not.

I have watched this pattern repeat across more projects than I can count. The details change. The platforms change. The dollar amounts change. The shape is always the same.

So what breaks the pattern?

Three things, and none of them are popular.

First, somebody has to scope the project with a budget for reality. Not the happy path. Not the vendor demo. Reality. That means padding integration estimates, building in discovery phases that have real budgets, and telling the merchant a number that might lose the deal. Most sales teams will not do this voluntarily because the competitive pressure pushes the other direction.

Second, the merchant needs their own technical advisor in the room during the sales cycle. Not after the SOW is signed. During. Someone who can read the assumptions, ask what happens when the CDP connector is not standard, and push back before the number is locked. This role almost never exists in mid-market commerce. The merchant relies on the SI to be both the seller and the honest broker, which is a conflict of interest that everyone politely ignores.

Third, the SOW itself needs to be structured differently. Instead of a fixed scope at a fixed price with change orders as the pressure valve, the deal should separate what is known from what is not known. Discovery phases, integration spikes, and proof-of-concept builds should be budgeted as their own line items, with go/no-go gates before the big spend begins. This makes deals harder to close. It also makes projects more likely to succeed.

None of this is secret knowledge. Every senior practitioner in mid-market commerce has lived it. The reason it does not change is that the current structure works well enough for the SI, even when it does not work for the merchant. The SI absorbs the overrun through staff rotation, reduced scope, or a stabilization phase that gets quietly descoped. The merchant absorbs it through delayed launches, missed revenue targets, and a vague feeling that they chose the wrong partner.

They did not choose the wrong partner. They chose a structure that was designed to produce this outcome.

The optimism was not the mistake. The mistake was having nobody in the room whose job it was to add up all the optimism and call it what it is.