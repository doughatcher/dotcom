---
title: "Your Org Chart Is Your Architecture"
date: 2026-04-25
draft: true
pillar: "Wild Card"
tags: []
linkedin_copy: |
  The integration that breaks in production is the one where nobody on the merchant side owns the seam.
  
  Conway's Law is sixty years old. Most practitioners treat it as a cliche. In mid-market commerce, it is the most reliable predictor of where your architecture will fail.
  
  A typical replatform in 2026 involves a commerce platform, an ERP, an OMS, a payment gateway, a tax engine, a CDP, a search platform, and at least one custom internal system. The merchant hires a systems integrator for back-of-house and a specialist agency for the storefront. The boundary looks clean on the kickoff slide.
  
  By the third status meeting, someone is asking who owns the data contract between the OMS and the storefront's order status page. The SI assumes the agency. The agency assumes the SI. The merchant assumes both. Nobody owns it.
  
  This is not a communication problem. It is a structural one. The merchant's org chart has no integration owner. No single person sits at the seam between systems ensuring contracts are specified, tested, and maintained. So the seam stays unowned.
  
  Unowned seams produce recognizable failures: duplicated API adapters that drift apart, untested edge cases at system boundaries, and scope disputes that burn relationship capital when bugs appear in the gap between partners.
  
  The pattern reverses when someone on the merchant side actually owns integrations across all partners. That person does not write code. They ask the questions that force both partners to agree on data contracts, error handling, and monitoring before the first line of integration code gets written.
  
  Before you pick your platform, your SI, or your agency: who on your team owns the spaces between the boxes on your architecture diagram? If the answer is unclear, you have found your risk.
  
  Full post: {{url}}
---

There is an old observation in software engineering called Conway's Law. It says that organizations design systems that mirror their own communication structures. It was published in 1967. It has been restated, memed, and printed on conference t-shirts so many times that most practitioners treat it as a cliche.

It is not a cliche. In mid-market commerce implementations, it is the most reliable predictor of where the architecture will fail.

Here is the version of Conway's Law that I keep seeing in practice: the integration that breaks in production is the one where nobody on the merchant side owns the seam.

A typical mid-market commerce project in 2026 involves at minimum a commerce platform, an ERP, an OMS, a payment gateway, a tax engine, a CDP or ESP, a search platform, and at least one custom internal system. Most merchants hire a systems integrator for the back-of-house work and a specialist agency for the storefront. The boundary between those two partners is drawn on a slide during the kickoff. It looks clean.

It is not clean. By the third status meeting, someone is asking who owns the data contract between the OMS and the storefront's order status page. The SI assumes the agency is handling it. The agency assumes the SI is handling it. The merchant assumes both of them are handling it. Nobody is handling it.

This is not a communication failure. It is a structural one. The merchant's org chart does not have an integration owner. There is no single person whose job it is to sit at the seam between systems and ensure the contracts are specified, tested, and maintained. The CTO is too senior for that level of detail. The developers are too deep in their own systems. The project manager is tracking tasks, not data contracts.

So the seam stays unowned. And unowned seams produce a specific, recognizable set of failures.

The first failure is duplicated work that nobody catches. Both partners build their own version of the same API adapter because nobody told them the other one existed. The adapters are almost identical but not quite. They drift. Six months after launch, an order sync breaks because the two adapters handle a null field differently.

The second failure is untested edge cases at the boundary. Each partner tests their own system thoroughly. Neither partner tests the full round trip across the seam. The ERP sends a cancellation. The OMS processes it. The storefront never reflects it. Each system did what it was supposed to do. The customer sees a phantom order for two weeks.

The third failure is scope disputes that burn relationship capital. When a bug appears at the seam, both partners point at each other. Not maliciously. Genuinely. From their perspective, their system is working correctly. The bug lives in the gap. And the gap does not belong to anyone.

I have seen this pattern in retail, in B2B, in subscription commerce, across different platforms and different agencies. The specifics vary. The structure is identical every time. Where the org chart has a gap, the architecture has a gap.

The reverse is also true. When a merchant has a strong internal technical lead who owns integrations across all partners, the architecture holds. Not because that person writes code. Because that person asks the questions that force both partners to agree on the data contract, the error handling, and the monitoring before the first line of integration code is written.

This is the role that does not appear in most mid-market org charts. It is not a project manager. It is not a CTO. It is the person who reads both SOWs, notices that the ERP partner assumed the commerce partner would build the webhook listener, notices that the commerce partner assumed the opposite, and gets that resolved before it becomes a production incident.

You can call this role whatever you want. Integration lead. Technical owner. The person who reads both contracts. The title does not matter. What matters is that someone on the merchant side owns the space between the boxes on the architecture diagram.

If you are a merchant planning a replatform, before you pick your platform, before you pick your SI, before you pick your agency, answer this question: who on your team will own the seams? If the answer is "our project manager" or "we expect the SI to handle that" or "we will figure it out in the kickoff," you have a gap. And that gap will become your architecture.

Conway was right in 1967. He is still right. Your systems will mirror your organization. If your organization has no one at the seam, your systems will have no one at the seam. And that is where they will break.

Draw your org chart. Then draw your integration map. If the blank spaces line up, you have found your risk. The fix is not technical. It is organizational. Fill the role, or own the consequences.