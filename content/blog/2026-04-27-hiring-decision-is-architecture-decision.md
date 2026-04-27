---
title: "Your Hiring Decision Is an Architecture Decision"
date: 2026-04-27
pillar: "Wild Card"
tags: [hiring, architecture, engineering-leadership, startups, infrastructure]
linkedin_copy: |
  A growing technology company needs an engineering leader. Two finalists. One knows the platform cold and can ship features immediately. The other brings infrastructure discipline: CI/CD, disaster recovery, automated testing, production observability. Does not know the platform yet.
  
  The company picks the platform-familiar candidate. Nearly every time.
  
  This is framed as a people decision. It is an architecture decision.
  
  Hiring for platform familiarity optimizes for velocity on the system as it exists today. Features ship. Bugs get fixed by someone who already knows where to look. But the infrastructure gap stays open. No automated regression suite. No tested recovery procedure. No deployment pipeline that lets you ship without fear.
  
  Six months later, the system is bigger. More clients, more data, more integrations, more surface area for failure. Feature velocity is decent. Operational discipline has not scaled with it. Deployments are still manual. Production incidents get resolved through heroics.
  
  This is when the company realizes they need the infrastructure person too. But now they are hiring into a system that is six months more complex, with a team structure that already has a leader in place. The hire is harder and more expensive.
  
  The pattern I keep seeing: companies treat infrastructure discipline as the second hire. It should be the first. Not because features do not matter. Because the infrastructure layer is what makes feature velocity sustainable. Without CI/CD, without automated quality gates, without disaster recovery, every feature shipped adds weight to a system with no shock absorbers.
  
  Investors reinforce this by framing "fix engineering" as "make the current team ship faster." That advice optimizes for the quarter. The operational foundation is what optimizes for the year.
  
  When you are choosing between these two profiles, ask one question: what is the cost of a production incident today, with no automated recovery and no regression suite? If the answer is "we would figure it out," you are describing heroics. Heroics do not scale.
  
  Full post: {{url}}
---

A growing technology company has an engineering team that built the product. The team knows the codebase. They know the workarounds. They know which parts of the system are fragile and which are solid. They do not have CI/CD. They do not have disaster recovery. They do not have automated test coverage on the critical paths.

The company needs an engineering leader. Two candidates reach the final round.

Candidate A knows the platform. They have been adjacent to the codebase or the product for a while. They understand the domain. They can ship features on the current system faster than anyone external could.

Candidate B does not know the platform. They bring infrastructure discipline: deployment pipelines, observability, automated quality gates, production stability practices. They have done this at other companies, in other stacks, and the patterns transfer.

The company picks Candidate A. Almost every time.

This is framed as a people decision. It is an architecture decision.

## What you are actually choosing

When you hire for platform familiarity, you are optimizing for velocity on the system as it exists today. Features ship. Bugs get fixed by someone who already knows where to look. The team feels continuity.

What you are not getting is the infrastructure layer that lets the system survive its own growth. CI/CD is not a feature. It is the mechanism that prevents every future feature from becoming a risk. Disaster recovery is not a project. It is the backstop that lets you take risks at all. Automated testing is not overhead. It is the thing that keeps your deployment frequency from being gated by fear.

These are not nice-to-haves for a mature organization. They are the foundation that makes a growing organization capable of growing without breaking.

A company that hires for platform knowledge and defers infrastructure discipline is making a bet: we will be able to add the discipline later, after the current fires are out.

That bet almost never pays off. The fires are never out. There are always more features to ship, more clients to onboard, more bugs to triage. The infrastructure work keeps getting deferred because it does not have a constituency. Nobody inside the company is asking for CI/CD. The clients are asking for features. The investors are asking for growth. The infrastructure gap widens quietly.

## The six-month cost

Six months after the hire, the picture usually looks like this:

Feature velocity is decent. The new leader knows the system. They can make tactical decisions quickly. The team trusts them.

But deployments are still manual or semi-manual. There is no automated regression suite. Nobody has tested the recovery procedure because there is no recovery procedure. The monitoring is partial. When something breaks in production, the response is heroic and ad hoc.

The system is bigger than it was six months ago. More clients. More data. More integrations. More surface area for failure. And the operational discipline has not scaled with it.

This is the moment the company realizes they also need Candidate B. But now they are hiring into a system that is six months more complex, with six months more technical debt, and with a team structure that already has a leader in the role. The hire is harder. The integration is harder. The cost is higher.

## Why companies keep making this choice

The logic is understandable. Hiring someone who knows the system feels lower-risk. The onboarding is faster. The team is less disrupted. The new person can contribute immediately.

Hiring for infrastructure discipline feels like a longer bet. The new person needs to learn the platform. They will spend their first months auditing, not shipping. The team might feel like they are being criticized rather than supported.

Investors and boards reinforce this. "Fix engineering" usually means "make the current team ship faster," not "build the operational foundation for the next stage." The advice is well-intentioned. It optimizes for the quarter, not the year.

The pattern I keep seeing is this: companies treat the infrastructure hire as the second hire. It should be the first. Not because features do not matter, but because the infrastructure layer is what makes feature velocity sustainable. Without it, every feature shipped adds weight to a system that has no shock absorbers.

## The architecture frame

Think about it as an architecture question instead of a personnel question.

If your system does not have CI/CD, automated testing, disaster recovery, and production observability, your architecture has a gap. That gap is not in the code. It is in the operational layer around the code.

Hiring someone who can ship features on a system with an operational gap does not close the gap. It adds features on top of the gap. The system gets more capable and more fragile at the same time.

Hiring someone who can close the operational gap first, and then support feature development on a stable foundation, changes the trajectory. The first three months are slower. The next eighteen months are faster, and safer, and cheaper.

## The question to ask

When you are choosing between platform familiarity and infrastructure discipline, ask this: what is the cost of a production incident on the current system, today, with no automated recovery and no regression suite?

If the answer is "we would figure it out," you are describing heroics, not engineering. Heroics do not scale. The hire that brings discipline scales.

The decision feels like it is about people. It is about what kind of system you are building for the next eighteen months. Choose accordingly.