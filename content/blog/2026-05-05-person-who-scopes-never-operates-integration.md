---
title: "The Person Who Scopes the Project Never Operates the Integration"
date: 2026-05-05
draft: true
pillar: "The Constellation"
tags: []
linkedin_copy: |
  The person who writes your integration estimate will never be the person who gets paged when it breaks in production.
  
  This is not a quality problem. It is a structural one. Pre-sales architects scope the happy path. They diagram clean data flows, estimate hours for "monitoring," and move to the next deal. They are good at their job. But their job ends before production starts.
  
  The result is that five things get systematically undercounted in every integration-heavy commerce SOW: error handling for partial and malformed responses, retry logic and idempotency, monitoring and alerting that actually catches failures before the merchant does, data reconciliation between systems that disagree, and credential rotation strategy.
  
  None of these are exotic. Every operator has war stories about each one. But they are invisible to the person writing the estimate, because that person has never lived through the production consequences of skipping them.
  
  The integration works in staging. It passes QA. It looks fine on launch day. Then over three to six months it degrades. Small failures compound. Manual workarounds become routine. By the time someone escalates, the agency has rolled off and the original scope is a PDF nobody opens.
  
  The fix is not a better template. It is putting an operator in the scoping room for two meetings: integration architecture review and estimate review. In my experience, that single addition changes the estimate by 30 to 50 percent. Not because the original was lazy. Because it was honest about what it could see, and it could not see production.
  
  If you are evaluating a commerce implementation, ask one question: has anyone who will operate this system reviewed the integration estimates?
  
  If the answer is no, you are buying a demo, not a system.
  
  Full post: {{url}}
---

Here is a pattern I have watched repeat across dozens of mid-market commerce implementations.

The person who writes the integration estimate will never be the person who operates that integration in production.

They will not be paged when the order sync stalls at 11 PM on a Friday. They will not debug the silent failure where the CDP stops receiving events because an auth token expired and the retry logic was never built. They will not be the one explaining to the merchant's ops team why 200 orders are missing tracking numbers.

The person who scopes it is usually a solutions architect or a pre-sales engineer. They are good at their job. They understand the happy path. They can diagram the data flow on a whiteboard and make it look clean. And they move on to the next deal before the integration reaches production.

This is not a criticism of any individual. It is a structural problem. The incentives are misaligned.

When you scope an integration without the operator's perspective, you systematically undercount five things:

1. Error handling. Not "what if the API is down" error handling. Real error handling. What happens when the OMS returns a partial success? What happens when the tax service times out on line item 43 of a 60-line order? What happens when the ESP receives a profile update with a null email field?

2. Retry and idempotency. Most integration estimates assume the message gets delivered once, correctly. Production is not that generous. Messages arrive twice. They arrive out of order. They arrive with stale data. If your integration was not scoped with idempotency keys and deduplication logic from the start, you are building tech debt into the foundation.

3. Monitoring and alerting. A scoping document will say "monitoring" and estimate four hours. An operator knows that monitoring means: dashboards for throughput, latency, and error rate per integration endpoint. Alert thresholds tuned to actual traffic patterns. Runbooks for the three most common failure modes. Four hours covers the dashboard. The rest takes weeks.

4. Data reconciliation. Every integration between two systems creates a question: when they disagree, which one is right? The scoping document rarely addresses this. The operator deals with it every week.

5. Credential and secret rotation. Integrations authenticate. Tokens expire. API keys get rotated. If the scoping did not account for a secrets management strategy, the first key rotation in production becomes an outage.

None of these items are exotic. Every experienced operator has a story about each one. But they are consistently underestimated in SOWs because the person writing the SOW has not lived through the production consequences of skipping them.

The downstream cost is predictable. The integration works in staging. It passes QA. It looks fine on launch day. Then, over the next three to six months, it degrades. Small failures accumulate. Manual workarounds become routine. The merchant's team absorbs the pain because they do not know it was supposed to be better.

By the time someone escalates, the agency that built the integration has rolled off. The original scope is a PDF nobody references. The merchant is left holding a system that technically works but operationally bleeds.

The fix is not a better estimation template. Templates do not solve incentive misalignment.

The fix is putting an operator's voice in the scoping room before the SOW is signed. Someone who has run integrations in production. Someone who will ask: what happens when this fails at 2 AM? Who gets paged? What is the runbook? How do we know it broke before the merchant's customer does?

This person does not need to be on the project full-time. They need to be in the room for two meetings: the integration architecture review and the estimate review. Their job is to add the lines that the pre-sales process structurally omits.

In my experience, this single addition changes the integration estimate by 30 to 50 percent. Not because the original estimate was lazy. Because the original estimate was honest about what it could see, and it could not see production.

Mid-market merchants rarely know to ask for this. They trust that the agency scoping the work has accounted for operational reality. That trust is usually misplaced, not because the agency is dishonest, but because the agency's scoping process was designed to win the deal, not to run the system.

If you are a merchant evaluating an integration-heavy commerce project, ask one question: has anyone who will operate this system in production reviewed the integration estimates? If the answer is no, you are buying a demo, not a system.