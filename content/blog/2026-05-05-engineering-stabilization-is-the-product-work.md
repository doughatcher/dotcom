---
title: "Engineering Stabilization Is Not a Prerequisite. It Is the Product Work."
date: 2026-05-05
draft: true
pillar: "The Merchant-Side Gap"
tags: []
linkedin_copy: |
  "Fix engineering first, then bring in product thinking" is one of the most common sequencing decisions in mid-market software and commerce. It is also one of the most quietly expensive.
  
  The logic sounds right. Stabilize the foundation. Get CI/CD running. Document disaster recovery. Introduce code review standards. Then, once the house is in order, figure out where to go next.
  
  The problem: deciding what to stabilize, in what order, against what business outcomes IS the product work. When you defer it, the engineering team optimizes for engineering health. That is not the same as business health.
  
  Disaster recovery is a clear example. Any engineering leader will make it priority one. They are right in the abstract. But DR for what? The recovery time objective for a checkout API is not the same as the RTO for an internal reporting dashboard. Sequencing DR work without understanding which business surfaces carry the most risk is not cautious. It is uninformed.
  
  CI/CD is the same. Automated test gates are a best practice. But when you have capacity for 30 test cases and a backlog of 200, the prioritization depends on knowing which flows carry the most revenue and the most customer pain. That knowledge does not live in the engineering team.
  
  I have seen this pattern repeat in commerce replatforms too. The agency rolls off. Leadership tells the internal team to stabilize before optimizing. Six months later the system is more reliable, but conversion has not moved, because nobody told the team which integrations and workflows matter most to the business.
  
  The missing role is not a product manager with a Jira board. It is someone who can translate business priority into technical sequencing. Engineering first, then product is a false sequence. They are the same work.
  
  Full post: {{url}}
---

I keep hearing the same sentence from founders, investors, and merchant CTOs: "We need to fix engineering first, then we will bring in product thinking."

It sounds reasonable. Stabilize the foundation. Stop the bleeding. Get the house in order. Then figure out where to go.

The problem is that deciding what to stabilize, in what order, against what outcomes, is the product work. It is not a prerequisite for product thinking. It IS product thinking. And when you defer it, the engineering team stabilizes against the wrong targets.

I have seen this play out the same way multiple times. A small or mid-market software company has a team that is struggling. Releases are unreliable. Infrastructure is fragile. The codebase has accumulated years of shortcuts. An investor or advisor says: fix the engineering org first. Hire a strong engineering lead. Get CI/CD in place. Get test coverage up. Get disaster recovery documented. Then, once that is stable, bring in someone to own the roadmap.

The engineering lead arrives and starts doing exactly what they were hired to do. They audit infrastructure. They implement pipelines. They introduce code review standards. They write runbooks. All of this is valuable work.

But here is the question nobody asked: which infrastructure matters most? Which pipelines serve the workflows that drive revenue? Which parts of the codebase are fragile in ways that cost customers, and which are fragile in ways that only bother developers?

Without someone in the room who owns the connection between business outcomes and technical priorities, the engineering team optimizes for engineering health. That is not the same as business health. A beautifully stable system that stabilized the wrong surfaces is still a business failure. It just fails more reliably.

Disaster recovery is a good example. Any engineering leader will tell you DR should be priority one. And they are right, in the abstract. But DR for what? A commerce platform with 50 merchant tenants needs a very different DR posture than a SaaS product with three enterprise clients. The recovery time objective for a checkout API is not the same as the RTO for an internal reporting dashboard. Sequencing DR work without understanding which business surfaces carry the most risk is not cautious. It is uninformed.

CI/CD is another one. Automated test gates on every pull request is a best practice. Nobody disputes it. But which user flows do you cover first? If you have 200 test cases to write and capacity for 30 in the first quarter, the prioritization depends on knowing which flows carry the most revenue, the most customer pain, or the most operational risk. That knowledge does not live in the engineering team. It lives in the people closest to the customer.

The sequencing error is subtle because both sides are acting rationally. The investor wants to see engineering discipline before investing in growth. The engineering lead wants a clean foundation before taking on new scope. Neither is wrong. But the gap between them is where the product decision lives, and nobody is filling it.

This same pattern shows up in mid-market commerce, just wearing different clothes. A merchant finishes a replatform. The agency rolls off. The internal team inherits a system with rough edges. Leadership says: let the team stabilize operations first, then we will think about optimization, personalization, and the next phase of the roadmap.

So the team stabilizes. They fix the deployment process. They patch the integrations that break on weekends. They document the workarounds. Six months later, the system is more stable, but conversion has not improved. Average order value has not moved. The integrations that matter most to the business are still held together with cron jobs and hope, because nobody told the team which integrations matter most to the business.

The missing role here is not a product manager with a backlog and a Jira board. It is someone who can sit between the business and the engineering team and say: here is what matters, here is what does not, and here is the order. Someone who understands both the technical cost of a decision and the business cost of deferring it.

Mid-market companies rarely have this person. Enterprise companies have them but call them different things. Agencies will not provide it because it requires independence from the delivery timeline. Platform vendors cannot provide it because they are selling, not advising.

So the sequencing error persists. Engineering stabilizes in a vacuum. Product thinking arrives late. And the company wonders why six months of hard work did not move the metrics that matter.

If you are making a hiring decision right now and the framing is "engineering first, then product," push back on the framing. Not because engineering is unimportant. Because engineering without product direction is activity without strategy. The question is not whether to stabilize. The question is what to stabilize first, and for whom. That question is the product work. It does not wait.