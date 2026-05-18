---
title: "The Plan Assumed the Team. The Team Was One Person."
date: 2026-05-18
pillar: "Post-Launch Reality"
tags: [migration, knowledge-management, staffing, risk]
linkedin_copy: |
  Every migration plan I have reviewed in the last five years lists a team of six to ten people. Every migration that falls behind falls behind because one of those people was the only one who understood a critical workstream, and they took a week off.
  
  The plan modeled capacity. It did not model knowledge distribution. Those are different things.
  
  Forty work items sit untouched for five days. When the person returns, half those items have aged out of their review window or conflict with branches that merged while they were gone. Recovery takes nine days, not five. The rest of the team spent the week blocked or context-switching to other work they now have to switch back from.
  
  Nobody did anything wrong. The person earned their PTO. But the project plan treated allocation and knowledge as the same variable, and they are not.
  
  The fix is boring. Before any absence longer than two days: write down the actual state of every active work item (not a status update, the real state). Walk one other team member through it live for thirty minutes. Grant access to every credential and environment you are the sole holder of. Two to four hours of scheduled work that saves over a week on the back end.
  
  The structural fix is harder: never let a workstream have a single knowledge holder for more than two sprints. Rotate people through. Pair on integration work. Treat "only one person understands this" as a risk item, not a compliment.
  
  This does not happen by default because the knowledge holder is usually the strongest performer. The instinct is to let them run. Slowing them down to teach feels like friction. And the absence feels temporary. "Just a week. We will catch up." You do not catch up. You recover. Recovery is always slower than continuity.
  
  Full post: {{url}}
---

I have watched the same failure mode play out on content migrations, platform cutovers, and integration stabilization efforts across different companies, different platforms, different years. The details change. The shape does not.

A team of eight is listed on the project plan. One person holds the context for a critical workstream. That person takes PTO. Forty work items sit untouched for a week. When they come back, half of those items have aged past their review window or lost their place in the queue. The recovery takes longer than the original work would have.

Nobody did anything wrong. The person earned their time off. The project plan listed eight names. But the plan modeled capacity, not knowledge distribution. Those are different things.

This is not a people problem. It is a planning problem wearing a people costume.

## Where the model breaks

Project plans track allocation. They track hours, sprints, velocity. They rarely track which person is the only one who understands how the content taxonomy maps to the new platform's data model. Or which person is the only one who has access to the legacy system's admin panel. Or which person built the integration test harness and never documented the setup steps.

When that person is present, the plan works. The moment they are absent, the plan reveals what it always was: a capacity model that assumed knowledge was evenly distributed across the team.

It never is.

## Why recovery costs more than the original work

Stalled work does not pause cleanly. It decays. A content migration batch that sits for a week may need re-validation against source data that changed. A code review that waited five days now conflicts with three other branches that merged in the meantime. An integration test environment that was stable on Friday has drifted by the following Monday because someone else deployed to it.

The person comes back from PTO and spends their first two days untangling the drift instead of moving forward. The project lost a week of their absence plus two days of their return. Nine days, not five. And the rest of the team, who could not move those items forward, spent the week either blocked or context-switching to other work they now have to context-switch back from.

The compounding is quiet. It does not show up as a single dramatic failure. It shows up as a slow slide in velocity that the standup attributes to "complexity" rather than to a planning gap.

## The fix is boring and it works

Knowledge distribution is work. It takes time. It has to be scheduled.

Before any absence longer than two days, the knowledge holder should do three things:

1. Write down the current state of every active work item they own. Not a status update. The actual state: what is done, what is not, what decision is pending, what credential or access is needed.

2. Walk one other team member through the work live. Thirty minutes, screen share, questions allowed. The goal is not mastery. The goal is "someone else can unblock the next step."

3. Grant access. If they are the only person with admin credentials, API keys, or environment access, fix that before they leave. Not after.

This takes two to four hours. It feels like overhead in the moment. It saves nine days on the back end.

The harder version of this fix is structural: never let a workstream have a single knowledge holder for more than two sprints. Rotate people through. Pair on the complex integration work. Treat "only one person understands this" as a risk item on the project board, not a compliment to the person who built it.

## Why this does not happen by default

Two reasons.

First, the person who holds the knowledge is usually the strongest performer on the team. They move fast. They are reliable. The project manager's instinct is to leave them alone and let them run. Asking them to slow down and teach someone else feels like friction.

Second, the absence feels temporary. "It is just a week. We will catch up when they are back." This is the optimism that kills the timeline. You do not catch up. You recover. Recovery is slower than continuity.

The project that treats knowledge concentration as a risk, the same way it treats a tight deadline or an unstable environment as a risk, is the project that survives its first key-person absence without losing momentum.

The project that does not will learn this lesson the expensive way. Usually more than once.