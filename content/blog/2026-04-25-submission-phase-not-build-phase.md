---
title: "The Submission Phase Is Not the Build Phase"
date: 2026-04-25
draft: false
pillar: "The Post-Launch Reality"
tags: []
linkedin_copy: |
  The build finished on time. The submission took twice as long as anyone planned. I have watched this happen on enough integration projects to know it is not bad luck. It is a scoping failure.
  
  Platform marketplace submissions operate under different rules than the build itself. The QA bar is higher. Security requirements are more specific and evolve independently of your project timeline. Documentation expectations are not "good enough for the team" but "good enough for an external reviewer with a checklist who has never seen your code."
  
  Most project plans treat submission as the last line item in the build phase. A week, maybe two. This framing is reliably wrong.
  
  What actually happens: regression bugs surface because the submission environment is not your staging environment. Security findings appear that were not in the original spec. Documentation gaps that are individually trivial become collectively blocking. Each review cycle takes days, not hours. Two rounds of feedback can turn a two-week submission into a six-week submission.
  
  The staffing problem makes it worse. The developers who built the integration are often the wrong people to manage the submission. Submission requires methodical documentation, patient reviewer communication, and compliance-oriented remediation. These are real skills. They are not the same skills that made the build successful.
  
  The fix: scope submission as a distinct workstream. Give it its own estimate, staffing, and acceptance criteria. Staff at least one person whose primary job is submission readiness. Build in two review cycles by default. Start security prep during the build, not after.
  
  The team that built it deserves a project plan that does not set them up to fail in the last mile.
  
  Full post: {{url}}
---

You built the integration. The code is clean. The feature set matches the spec. The team is proud of the work, and they should be. QA passed in your staging environment. The demo looks good.

Now you have to submit it to the platform marketplace. And this is where the project breaks.

The submission phase of a commerce integration, whether you are targeting a platform's app marketplace, an extension directory, or a partner certification program, operates under a different set of rules than the build phase. The QA bar is higher. The security requirements are more specific. The documentation expectations are not "good enough for the team" but "good enough for an external reviewer who has never seen your codebase and has a checklist."

Most project plans treat submission as the last line item in the build phase. A week. Maybe two. "Submit and iterate on feedback." This framing is wrong in a way that costs real time and real money.

Here is what actually happens when a submission converges against a hard window.

Regression bugs surface. Not because the code is bad, but because the submission environment is not your staging environment. Differences in platform version, API behavior, or test data expose edge cases that your internal QA did not catch. Each regression bug requires a fix, a retest, and often a re-review by the submission team. The cycle time on each round is not hours. It is days.

Security requirements appear that were not in your original spec. The platform's security review has its own checklist, and it evolves. What passed six months ago may not pass today. Common findings: credential handling that was acceptable in a private deployment but fails the marketplace's stricter standards. Data residency questions that your architecture assumed were out of scope. Penetration test results that require remediation before the reviewer will proceed.

Documentation gaps become blocking. Not code documentation. User-facing documentation. Installation guides. Configuration walkthroughs. Screenshots that match the current UI state. Changelog formatting that matches the marketplace's template. Each gap is individually small. In aggregate, they represent days of work that nobody estimated because the team that built the integration is not the team that writes installation guides.

And all of this happens under a fixed window. The marketplace has a review queue. You submitted on a specific date. If you miss the review window, you wait for the next one. If you need a re-review after feedback, you go back in the queue. Two rounds of feedback can turn a two-week submission phase into a six-week submission phase.

The staffing problem compounds this. The developers who built the integration are often the wrong people to manage the submission. Submission requires a different attention profile: methodical documentation, patient back-and-forth with reviewers, security remediation that is more about compliance posture than code quality. Many strong builders find this work tedious. That is not a character flaw. It is a skill mismatch that the project plan should anticipate.

I have seen this pattern on multiple integration projects across different platforms. The build finishes on time. The submission takes twice as long as planned. Stakeholder confidence erodes not because the product is bad, but because the timeline they were tracking was the build timeline, and nobody told them the submission timeline was a separate clock.

The fix is structural, not heroic.

First: scope the submission phase as a distinct workstream with its own estimate, its own acceptance criteria, and its own timeline. Do not bury it in the last sprint of the build. Give it a start date, a staffing plan, and a definition of done that includes "accepted by the marketplace review team," not "submitted to the marketplace review team."

Second: staff it with at least one person whose primary role is submission readiness. This person owns the documentation checklist, the security prep, and the communication with the review team. They are not the lead developer. They may not be a developer at all. They are the person who has read the marketplace's submission guide cover to cover and knows what the reviewers will flag before they flag it.

Third: build in two review cycles. Plan for your first submission to receive feedback. Plan for a second submission after remediation. If you pass on the first round, you are ahead of schedule. If you budgeted for one round and need two, you are behind, and the conversation with the merchant shifts from "we are on track" to "we need more time," which is a harder conversation than it should be for something entirely predictable.

Fourth: start security prep during the build, not after it. The marketplace's security requirements are published. Most of them are knowable before you write the first line of code. A security review that runs in parallel with the build catches issues when they are cheap to fix. A security review that runs after the build catches the same issues when they are expensive to fix and the team has mentally moved on.

The submission phase is not a formality. It is not a deliverable tacked onto the end of the real work. It is the gate between "we built a thing" and "merchants can use the thing." Treating it as an afterthought is how good integrations miss their launch windows.

Plan for it. Staff for it. Estimate it honestly. The team that built it deserves a project plan that does not set them up to fail in the last mile.