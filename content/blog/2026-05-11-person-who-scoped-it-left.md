---
title: "The Person Who Scoped It Left Before the Build Started"
date: 2026-05-11
draft: true
pillar: "The Optimism Cascade"
tags: []
linkedin_copy: |
  The most expensive person on a mid-market commerce project is the one who leaves before the build starts.
  
  Not the most senior engineer. Not the most expensive contractor. The person who ran discovery, understood the merchant's actual problem, and shaped the SOW. They move to the next deal. The delivery team inherits a document that was designed to close a sale, not to transfer knowledge.
  
  I have watched this pattern across dozens of implementations. Week three of the build, someone asks a question nobody can answer. Why does this SOW allocate forty hours for loyalty but zero for the data mapping between loyalty and the CDP? The answer lived in someone's head. That person rotated off two weeks ago.
  
  What follows gets mislabeled as scope creep. It is not new requirements. It is original requirements that were understood during discovery but never survived the personnel transition. The merchant is not adding scope. They are restating what they already told someone who is no longer in the room.
  
  The standard fix is a kickoff meeting. Thirty minutes, a slide deck, a Q&A. It does not work. You cannot compress forty hours of stakeholder conversations into a briefing. The better approach is treating the handoff itself as a deliverable: a structured artifact capturing not just what was decided, but why. Business context behind each integration. Stakeholder map with notes on who has veto power. Assumptions made during scoping and the risks attached to each.
  
  Nobody wants to pay for this because it produces nothing the merchant can see. It is also the difference between a project that executes against original intent and one that drifts for two months before anyone notices.
  
  The structural issue is incentive alignment. Discovery is measured on deals closed. Delivery is measured on execution against a document they did not write. Both groups are doing their jobs. The gap between them is organizational.
  
  Full post: {{url}}
---

Somewhere around week three of a mid-market commerce build, someone on the delivery team will ask a question that nobody in the room can answer. It will be specific. Something like: why does this SOW allocate forty hours for the loyalty integration but zero hours for the data mapping between the loyalty provider and the CDP? Or: the discovery notes reference a custom pricing engine, but the technical spec assumes native catalog rules. Which one is it?

The answer lived in someone's head. That person is gone.

This is the most common and least discussed failure mode in mid-market commerce. Not the technology. Not the timeline. Not the budget. The handoff between the person who understood the merchant's problem and the team that inherited the document describing the solution.

I have watched this pattern repeat across dozens of implementations. The person who ran discovery, who sat in the room with the merchant's operations team, who understood why a particular integration mattered more than another, who knew which stakeholder cared about what, finishes the SOW and moves to the next deal. Sometimes they leave the company entirely. Sometimes they just rotate to a new engagement. The effect is the same. The project loses its memory.

The SOW was never designed to carry the weight the delivery team needs it to carry. It is a commercial document. It defines scope, timeline, and cost. It does not capture the reasoning behind those decisions. It does not explain why the OMS integration was scoped at sixty hours instead of a hundred and twenty. It does not record that the merchant's VP of Operations is skeptical of the whole project and needs to see inventory sync working before anything else ships. It does not note that the "custom checkout flow" line item exists because the merchant's current provider handles tax calculation in a way that no standard connector supports.

All of that context was in the room during discovery. None of it survived the handoff.

What happens next is predictable. The delivery team reads the SOW and builds what the document says. They make reasonable assumptions where the document is ambiguous. Those assumptions are wrong roughly a third of the time. Not because the team is bad. Because they are working from an artifact that was designed to close a deal, not to transfer institutional knowledge.

The merchant notices first. They start asking questions in sprint reviews that the delivery team cannot answer confidently. "We talked about this during discovery" becomes a recurring phrase. The delivery team checks the SOW. The SOW is silent on the topic, or it contains a single bullet point that could mean three different things.

This is where scope creep gets its reputation. Most of what gets labeled scope creep is not new requirements appearing from nowhere. It is original requirements that were understood during discovery but never made it into the document in a way that survived the personnel transition. The merchant is not adding scope. The merchant is restating what they already said to someone who is no longer on the project.

The standard industry fix for this is a "kickoff" meeting where the pre-sales team briefs the delivery team. I have been on both sides of these meetings. They last thirty to sixty minutes. They cover the highlight reel. They do not transfer the kind of deep, contextual, sometimes contradictory understanding that three weeks of discovery produces. You cannot compress forty hours of stakeholder conversations into a slide deck and a Q&A session.

A better approach, one I have seen work when teams commit to it, is to treat the handoff as a deliverable with its own timeline and acceptance criteria. Not a meeting. A structured artifact that captures not just what was decided, but why. The business context behind each integration. The stakeholder map with notes on who cares about what and who has veto power. The assumptions that were made during scoping and the risks attached to each one. The things the merchant said informally that never made it into a formal requirement but will absolutely surface during the build.

This artifact takes real time to create. Eight to twelve hours, usually. Nobody wants to pay for it because it does not produce anything the merchant can see. It is overhead. It is also the difference between a project that executes against the original intent and a project that drifts for two months before anyone realizes the drift.

The deeper structural issue is incentive alignment. The person who runs discovery is typically measured on deals closed. They are not measured on delivery outcomes. Their job is done when the SOW is signed. The delivery team is measured on on-time, on-budget execution against a document they did not write and cannot fully understand. Both groups are doing their jobs well. The gap between them is organizational, not personal.

Until someone owns the continuity between those two phases, mid-market commerce projects will keep losing their memory at the worst possible moment. The person who understood the problem should not be allowed to leave before the team that owns the solution can prove they understand it too.

That proof is not a meeting. It is a document that answers the questions the delivery team does not yet know to ask.