---
title: "Your AI Coding Tools Are Only as Safe as Your Slowest Approval Process"
date: 2026-05-05
draft: true
pillar: "Wild Card"
tags: []
linkedin_copy: |
  Every enterprise engineering org I talk to right now has the same problem with AI coding tools. It is not the models. It is not the security risk. It is the approval process.
  
  Security review boards were built for a world where new developer tooling appeared once a year. Four to eight weeks for a review was fine. The landscape moved slowly enough that the approval cadence matched the adoption cadence.
  
  AI tooling moves weekly. Models update. Data handling policies change. Pricing shifts. A tool approved in January has different terms in March. The review process has not adapted.
  
  So developers do what pragmatic people do: they adopt the tools anyway. Personal subscriptions. Local models. Workarounds that technically comply with policy while clearly violating its intent. The org thinks it has a controlled environment. It has an official environment and a shadow environment where the productive work happens.
  
  The security team has lost visibility into exactly the surface it was trying to protect.
  
  Clamping down harder works for about a month. Then the workarounds get more creative and less visible.
  
  The fix is not lowering the bar. It is matching the cadence. Tier the risk: a local code-completion tool is a different threat than a cloud agent ingesting your codebase. Create a fast lane for tools within existing vendor agreements. Set a 30-day time limit on reviews, with conditional approval as the default when the clock runs out. Publish the approved list monthly.
  
  None of this is radical. It is how mature procurement handles fast-moving categories. Security just has not been asked to operate at this speed before.
  
  When your approval process cannot keep up, developers route around it. You do not get safety. You get invisible risk and attrition.
  
  Full post: {{url}}
---

Every enterprise engineering org I talk to right now has the same problem. It is not the AI tools. It is the approval process.

The security review board was designed for a world where a new developer tool showed up once or twice a year. Someone would propose adopting a new IDE plugin, a testing framework, or a CI/CD service. The review would take four to eight weeks. That was fine. The tool was not going anywhere. The landscape moved slowly enough that the approval cadence matched the adoption cadence.

AI tooling does not work that way. A new model drops every few weeks. The IDE integrations update on a different schedule than the models behind them. The pricing changes. The data handling policies change. A tool that was safe to approve in January has different terms in March.

The approval process has not adapted. The gates are the same: responsible AI review, data protection review, information security review. Three separate teams, each with their own intake form, their own review cadence, and their own definition of risk. A tool that needs all three reviews can take three to six months to clear.

Meanwhile, your developers are not waiting.

This is the part that security teams do not want to hear, but need to. When the approved toolchain is months behind what is available, developers adopt the unapproved tools anyway. They run local models on their personal machines. They use personal subscriptions to services the org has not reviewed. They find workarounds that technically do not violate the letter of the policy while clearly violating its intent.

This is not defiance. It is pragmatism. A developer who can ship a feature in two hours with an AI assistant or two days without one will find a way to use the assistant. Especially when their performance review does not include a line item for "waited for tooling approval."

The result is shadow tooling. The org thinks it has a controlled environment. It does not. It has an official environment that some people use and an unofficial environment that the productive people use. The security team has lost visibility into exactly the attack surface they were trying to protect.

I watched this play out recently in a large enterprise environment. The official AI coding tool was approved and rolling out. It worked fine for basic tasks. But a different tool, not yet approved, was significantly better for the specific workflows the team needed: agent-based coding, multi-file refactoring, context-heavy architectural work. The team used both. The approved one for anything that touched the corporate network. The unapproved one for everything else, on personal devices, with data carefully partitioned.

Careful? Sure. Sustainable? No. Auditable? Absolutely not.

The org's security posture was technically intact on paper. In practice, a significant percentage of the engineering work was happening in a tool the security team had not reviewed, could not monitor, and would shut down via MDM the moment they discovered it.

The conventional response is to clamp down harder. Block the unapproved tools at the network level. Enforce device management. Make an example of someone.

This works for about a month. Then the workarounds get more creative and less visible.

The better response is to fix the approval process. Not to lower the bar, but to match the cadence.

What that looks like in practice:

First, tier the risk. Not every AI tool carries the same data exposure. A code completion tool that runs locally and sends nothing to an external API is a fundamentally different risk profile than a cloud-hosted agent that ingests your entire codebase. Treating them identically is not rigorous. It is lazy. Build three tiers: local-only tools, tools that operate within your existing cloud boundary, and tools that send data to new third parties. Each tier gets a different review depth and timeline.

Second, create a fast lane for tools within existing vendor relationships. If your org already has a Microsoft enterprise agreement and Copilot is rolling out under that agreement, an IDE extension that routes through the same Copilot API should not require a six-month review. The data boundary is the same. The vendor is the same. The contract is the same. Review the delta, not the whole stack.

Third, set a time limit on reviews. If the security team has not completed a review within 30 days, the default is conditional approval with monitoring, not indefinite hold. This forces the review teams to prioritize, and it gives developers a legitimate path that does not require shadow tooling.

Fourth, publish the approved list and update it monthly. Developers should not have to file a ticket to find out what they are allowed to use. The list should be a living document, searchable, with clear status for each tool: approved, under review, denied (with reason), conditionally approved.

None of this is radical. This is how mature procurement organizations handle fast-moving categories. The security function just has not been asked to operate at this speed before.

The cost of getting this wrong is not theoretical. When developers use unapproved tools, the org accumulates untracked risk. When the org blocks everything, it accumulates productivity debt and attrition risk. The developers who care most about using good tools are also the developers who are hardest to replace.

The approval process is not a security control. It is infrastructure. And like all infrastructure, when it cannot keep up with the demands placed on it, people route around it. Build the process that matches the pace, or accept that the process is decorative.