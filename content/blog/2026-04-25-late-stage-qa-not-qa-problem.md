---
title: "Late-Stage QA Is Not a QA Problem"
date: 2026-04-25
draft: false
pillar: "The Post-Launch Reality"
tags: []
linkedin_copy: |
  The team that builds well and the team that submits well are not the same skill profile. Almost no project plan accounts for this.
  
  Three weeks before a submission deadline, the pattern is always the same. Regression bugs stacking. Security requirements not fully addressed. Documentation half-written. Everyone agrees it is a QA problem. It is not. It is a planning problem wearing a QA costume.
  
  Submission reviewers care about things builders deprioritize. Documentation formatted for an outside audience. Security posture under enumerated conditions. Regression coverage across every supported version. Edge cases your team accepted as tolerable risk. These are the actual requirements of the submission phase, and they take real time from people with specific skills.
  
  But most project plans treat submission as two weeks tacked onto the build timeline, staffed by the same developers who just finished building. A strong builder four months deep in feature work does not naturally context-switch into the procedural, documentation-heavy work that submission gates demand.
  
  Security requirements compound the problem. They shift between project kickoff and submission date. A checkbox in Q1 becomes a penetration test in Q3. If nobody tracked the target's evolving requirements during the build, the team discovers the gap when the cost of addressing it is highest.
  
  The fix: staff submission separately from the start. Track external requirements monthly throughout the build. And build the submission timeline backward from the deadline, not forward from build completion. What is left after you subtract review cycles, documentation, security prep, and regression runs is your actual build window. It is shorter than the original plan assumed.
  
  Full post: {{url}}
---

Three weeks before a submission deadline, the bug count is climbing. Regression issues from the last two sprints have stacked up. Security requirements that were acknowledged in month one have not been fully implemented. Documentation is half-written. The team is working overtime. Stakeholder confidence is eroding. Everyone agrees: we have a QA problem.

Except it is not a QA problem.

It is a planning problem that put on a QA costume and showed up at the worst possible time.

I have seen this pattern on marketplace submissions, app store reviews, platform extension certifications, and any launch gated by an external review process. The symptoms always look the same in the final weeks. Regression bugs, documentation gaps, security prep, and timeline pressure all converging at once. The temptation is to treat each one as an independent fire and throw resources at it. But the fires share a root cause: nobody planned for the submission phase as a distinct piece of work.

The team that builds well and the team that submits well are not the same team. They require different skills, different attention, and different timelines. Building is about making things work. Submitting is about proving things work to someone who has never seen the code, does not trust your word for it, and has a checklist that does not care about your sprint velocity.

Submission reviewers care about documentation completeness. They care about security posture under specific, enumerated conditions. They care about regression coverage across every supported platform version. They care about edge cases your team considered acceptable risk. These are not afterthoughts. They are the actual requirements. And they take real time from real people with specific skills.

But most project plans treat submission as the last line item on the build timeline. Two weeks at the end. Maybe three. Staffed by the same developers who just finished building the thing. The assumption is that the people who built it are best positioned to submit it. Sometimes that is true. Often it is not.

A developer who spent four months deep in feature work has a builder's relationship with the code. They know what it does, why it does it, and where the edges are. What they often do not have is the patience or the practice for the particular kind of documentation that submission gates demand. Security questionnaires. Integration architecture diagrams drawn for an outside audience. Test coverage reports formatted to a spec they have never seen before. This is a different kind of work. It is slower, more procedural, and less rewarding than building. Asking a strong builder to context-switch into it at the end of a long engagement is asking for exactly the kind of gaps that show up three weeks before deadline.

The security preparation problem is its own layer. Security requirements for marketplace submissions and external review boards are not static. They change between the time you scope the project and the time you submit. A requirement that was a checkbox in Q1 becomes a penetration test in Q3. If nobody is tracking the target's evolving requirements throughout the build, the team discovers the gap at the end, when the cost of addressing it is highest.

Here is what this looks like in practice. A team finishes the core build on schedule. Good velocity, clean code, features work as specified. Then the submission phase begins and the timeline fractures. Documentation takes twice as long as estimated because it has to be written for an external audience, not an internal one. Regression testing surfaces bugs that are minor in production but blocking in the submission checklist. Security prep reveals a requirement that changed since the project kicked off. Each of these is individually solvable. In sequence, under a hard deadline, they compound. The team starts debating whether to adjust the timeline or push through unresolved issues. Stakeholder confidence drops. The project that was on track for months is suddenly in crisis.

The fix is boring and structural.

Staff the submission phase separately. Identify the person who will own submission prep at the start of the project, not the end. This might be a QA lead with experience in the specific submission process. It might be a technical writer. It might be a senior developer who has been through the review before. Whoever it is, they need dedicated time and they need to start before the build is done.

Track external requirements throughout the build. Assign someone to monitor the submission target's requirement updates on a monthly cadence. Security requirements, documentation format changes, API versioning changes, supported platform versions. When a requirement changes mid-build, the team finds out while there is still time to adjust.

Build the submission timeline backward from the deadline. Not forward from the build completion. Start with the submission date. Subtract the review cycle time. Subtract the documentation completion time. Subtract the security prep time. Subtract the regression suite run time. What is left is the actual build window. It is almost always shorter than the original plan assumed.

The pattern here is the same one that shows up across the post-launch reality of commerce projects. The work that determines whether the relationship survives is not the work that gets celebrated. Nobody gets a congratulations email for completing a security questionnaire on time. Nobody gets recognized for catching a documentation gap in month two instead of month five. But these are the decisions that separate a smooth submission from a crisis.

Late-stage QA convergence is not bad luck. It is the predictable result of treating submission as the tail end of building instead of as its own phase with its own requirements. The team that recognizes this early ships on time. The team that does not spends its last three weeks wondering why everything broke at once.