---
title: "Go-Live Is the Middle of the Project, Not the End"
date: 2026-04-22
draft: true
pillar: "The Merchant-Side Gap"
tags: [commerce, replatform, go-live, post-launch, mid-market]
linkedin_copy: |
  The SI sends the final invoice within days of go-live. For the merchant, the most expensive phase of the replatform starts the next morning.
  
  This is not a complaint about SIs. It is a structural mismatch. The SI's revenue model depends on shipping the SOW and rolling the team. The merchant's revenue model depends on conversion, order sync reliability, and operational stability, none of which are measurable on launch day.
  
  The post-launch pattern is remarkably consistent. Week one: an integration breaks under real traffic that held up fine in load testing. Weeks two through four: the SI team is half-staffed on your project and half on their next one. Response times stretch. Months two and three: the build team is gone. The support contract is staffed by people who were not on the project. The merchant discovers analytics are incomplete, conversion is below the old platform, and nobody can explain why.
  
  I have seen merchants spend more in the six months after launch, through emergency fixes, re-implementations, and consultant hours, than they spent on the original build.
  
  The fix is not longer SI engagements. It is planning for post-launch as seriously as you plan for the build. Budget 20-30% of total project cost for the first 90 days of stabilization. Hire the operations team before go-live, not after. Define success metrics that extend 30 days past launch, not just "site is live and processing orders." Get an independent architecture review at T-minus 30 days.
  
  Go-live is halftime. Plan accordingly.
  
  Full post: {{url}}
---

Every commerce replatform I have been part of treats go-live as the finish line. The SOW is structured around it. The project plan counts down to it. The executive team celebrates it. The SI sends the final invoice within days of it.

For the merchant, go-live is the middle of the project. The most expensive phase starts the next morning.

## Why the structure looks this way

This is not malice. It is incentive alignment.

The SI's business model is project-based. Revenue recognition, team utilization, and margin all depend on shipping the SOW and rolling the team to the next engagement. Go-live is the event that triggers all of those things. So the entire engagement is organized around reaching it.

The merchant's business model is different. Revenue depends on conversion, average order value, retention, and operational efficiency. None of those things are measurable on launch day. They become visible over the first 30, 60, 90 days as real traffic hits real integrations under real conditions.

This is a structural mismatch, not a character flaw on either side. But the merchant is the one who absorbs the consequences.

## What happens in the first 90 days

The patterns are remarkably consistent across projects.

**Week one.** Something breaks under real traffic that did not break in load testing. Usually an integration. The payment processor times out under concurrent load. The OMS sync drops orders during peak hours. The CDP event pipeline backs up and personalization serves stale segments. The team scrambles. Some SI resources are still available because they have not fully rolled off yet.

**Weeks two through four.** The SI team is half-staffed on your project and half-staffed on their next one. Response times stretch. The merchant's internal team is fielding customer complaints about issues they do not fully understand, in a codebase they did not build, on a platform they are still learning. Tickets pile up. The distinction between "bug" and "change request" becomes a source of friction.

**Months two and three.** The SI has moved on. A skeleton support contract exists, maybe, but it is staffed by people who were not on the build team. The merchant realizes that the analytics implementation is incomplete. Conversion is below the old platform, and nobody can explain why with confidence. The merchandising team cannot do half of what they expected because the admin was configured for launch, not for ongoing operations. Someone discovers that the staging environment has drifted from production and deployments are now risky.

This is the gap. It is predictable. It happens on almost every mid-market replatform. And almost nobody budgets for it.

## The cost of the gap

The post-launch gap is expensive in direct costs: emergency contractor hours, vendor escalations, lost revenue from conversion drops, expedited fixes that introduce new bugs because there is no proper QA process after the build team leaves.

But the indirect costs are worse. The merchant's confidence in the new platform erodes. The executive sponsor who championed the replatform starts hearing "I told you so" from skeptics. The internal team burns out. And the institutional knowledge about why the architecture was built a certain way walks out the door with the SI team.

I have seen merchants spend more in the six months after launch, through emergency fixes, re-implementations, and consultant hours, than they spent on the original build. That is not an exaggeration. It is a pattern.

## What the merchant can do about it

The fix is not to blame the SI or negotiate a longer engagement. The fix is to plan for the post-launch phase as seriously as you plan for the build.

**Budget for stabilization explicitly.** Set aside 20-30% of the total project budget for the first 90 days after launch. Not as a contingency hidden in the SOW. As a separate, named line item with its own scope: performance tuning, integration hardening, analytics validation, merchandising enablement.

**Negotiate a transition period, not a cutover.** The SI team should overlap with whoever will own the platform post-launch for a minimum of 30 days. This is not "support." It is knowledge transfer, conducted by the people who built the thing, while they can still remember why they built it that way.

**Hire the post-launch team before go-live.** The people who will run the platform daily need to be embedded in the project during the build, not hired after launch. They need to see the architectural decisions being made, understand the tradeoffs, and know where the bodies are buried. If they start on day one of post-launch, they are three months behind.

**Define success metrics that extend past launch.** The SOW should not end with "site is live and processing orders." It should include 30-day targets for conversion rate, page load time, order sync reliability, and integration error rates. If those metrics are part of the contract, the SI has an incentive to build for durability, not just for launch day.

**Get an independent technical review at T-minus 30 days.** Someone who is not on the SI team and not on the vendor's team should review the integration architecture, the deployment pipeline, the monitoring setup, and the runbook. Not to find bugs. To find the gaps that will become emergencies at 2am on a Saturday during your first major sale.

## The role that is missing

Most of what I have described above is the work of a technical advisor on the merchant's side of the table. Someone who understands the architecture, can read the SOW critically, and stays through the post-launch period to bridge the gap between the build team and the operations team.

This role does not exist in most mid-market commerce engagements. The SI will not provide it because their incentives point toward go-live. The platform vendor will not provide it because their scope ends at the platform boundary. The merchant's internal team usually does not have the depth of implementation experience to fill it.

So the gap persists. And the merchant pays for it, every time.

If you are planning a replatform, plan for what happens after. Go-live is not the finish line. It is halftime.