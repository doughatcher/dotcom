---
title: "The Handoff Video Nobody Records"
date: 2026-05-11
pillar: "The Optimism Cascade"
tags: []
linkedin_copy: |
  The delivery team understood the spec. They did not understand the deal.
  
  This is the most predictable failure mode in mid-market commerce implementations, and it has nothing to do with technology. The person who sold the project understood why the client said yes. What internal pressure created urgency. Which executive staked their credibility on the outcome. What the client tried before and why it failed.
  
  That context lives in one place: the head of the salesperson. And it almost never transfers to the people building the thing.
  
  The fix is embarrassingly simple. A fifteen-minute video recorded before the kickoff meeting. Not polished. Just the sales lead answering three questions: Why did this client buy? What was said that is not in the documents? What should delivery know about internal dynamics?
  
  I have seen this done exactly twice in fifteen years. Both times, the delivery team called it the most useful artifact they received. Neither time was it a process. Nobody standardized it.
  
  The reason is structural, not lazy. The person who closes is incentivized to close the next deal. Recording an asynchronous artifact for a team they will never work with again is not in their objectives. The kickoff meeting is the path of least resistance. But a live meeting with twelve people in the room is where the real context, the uncomfortable stuff about politics and fear and competing priorities, gets filtered out.
  
  Three sprints later, delivery makes a decision that is technically correct and politically wrong. They deprioritize the feature a VP personally championed. They sequence an integration that delays the one capability the CEO mentioned in every sales call. Each decision is defensible. In aggregate, they erode trust that no amount of technical excellence repairs.
  
  The fix is not AI transcription or CRM pipelines. Automating the artifact does not automate the signal. The signal requires a human to say, out loud, what they actually think about why this client is different from the last one.
  
  Fifteen minutes. One person. Prevents weeks of compounding misalignment.
  
  Full post: {{url}}
---

Every mid-market commerce project I have worked on in the last five years has the same gap. Not a technology gap. Not a staffing gap. A context gap.

The person who sold the deal understood something about the client that never made it to the team building the thing.

This is not a mystery. It is not even a surprise. Everyone in delivery knows it happens. The interesting question is why it keeps happening despite being so well understood.

The answer is structural.

## What the spec contains and what it does not

By the time a deal closes, there is usually a decent document set. An RFP response. Architecture diagrams. Maybe a Solution Design Document or a discovery summary. These artifacts describe what the project is. They describe scope, timeline, platform, integrations, and constraints.

What they do not describe is why the client said yes.

Why this project, now. What internal pressure created urgency. Which executive staked their credibility on this initiative. What the client tried before and why it failed. What the client is afraid of. What promise was made in the room that is not in the SOW.

That context lives in exactly one place: the head of the person who ran the sales cycle.

## The fifteen-minute video that fixes it

The fix is so simple it feels insulting to write down. Before the kickoff meeting, the sales lead records a fifteen-minute video. Not a polished presentation. A casual walkthrough answering three questions:

1. Why did this client buy, and why now?
2. What was said in the room that is not in the documents?
3. What should delivery know about this client's internal dynamics that will affect the project?

Fifteen minutes. A webcam. A shared link. Done.

I have seen this work exactly twice in fifteen years. Both times, the delivery team described it as the single most useful artifact they received. Both times, it was an individual initiative by a specific salesperson. Neither time was it a process. Nobody standardized it. Nobody required it.

## Why it does not get made

The person who closes the deal is incentivized to close the next deal. Their compensation, their calendar, their attention all point forward. Recording a video for a delivery team they may never interact with again is not in their interest. It is not in their objectives. It is not in their workflow.

This is not laziness. It is rational behavior inside a system that does not value the artifact.

The kickoff meeting is the path of least resistance. The salesperson shows up, talks for thirty minutes, answers questions, and leaves. The delivery team feels like they got the context. They did not. They got the version of the context that survives a live conversation with twelve people in the room, where nobody wants to ask the uncomfortable questions in front of the client.

The real context, the stuff about internal politics, competing priorities, and unstated fears, never transfers in a group setting. It transfers in a quiet, asynchronous artifact made by someone who is not performing for an audience.

## What the gap costs

Three sprints into the project, delivery makes a prioritization decision that seems technically correct but is politically wrong. They deprioritize a feature that the client's VP of Marketing personally championed. Or they sequence an integration in a way that delays the one capability the CEO mentioned in every sales meeting. Or they staff a workstream lean because the SOW said it was low-complexity, not knowing that the client's last agency failed on exactly that workstream and the client is watching it like a hawk.

The delivery team is not wrong. They are working from incomplete information. The information existed. It just never arrived.

The cost is not a single mistake. It is a pattern of small misalignments that compound over months. Each one is explainable. Each one is defensible. In aggregate, they erode trust in a way that no amount of technical excellence can repair.

## The process that would fix it does not require technology

There is a temptation to solve this with tooling. Transcript AI. Automated context extraction. CRM-to-project-management pipelines. These tools are fine. Some of them are useful. None of them solve the core problem.

The core problem is that the signal, the part of context that matters most, is the part the salesperson carries in their head about why this client is different from the last one. Automating the artifact does not automate the signal. It automates the container. The signal requires a human being to sit down and say, out loud, what they actually think.

The fix is a process change, not a technology change. Add the video to the handoff checklist. Make it a requirement before the kickoff is scheduled. Review it in the first delivery team standup. Reference it in the first client-facing meeting.

Fifteen minutes of one person's time. It prevents weeks of misalignment downstream.

## Why this matters for merchants

If you are on the merchant side of a commerce implementation, you should know that the team building your platform probably does not understand why you bought it. They understand what you bought. They understand the scope and the timeline. They do not understand your internal politics, your previous failures, or the promises your leadership made to justify this investment.

You can help by asking a direct question in the kickoff: "What did our sales conversations tell you about why we are doing this project?" If the answer is vague, the context did not transfer. That is not a red flag about the team. It is a red flag about the process. And it is worth fixing in week one, not discovering in month three.