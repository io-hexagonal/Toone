---
title: "Create your first routine"
navTitle: "Create a routine"
description: "Turn an intent into a repeatable process by drafting it with an agent, in plain language."
eyebrow: "Getting started · Step 4"
pageType: "tutorial"
estimatedTime: "4 minutes"
---

## What a routine is

A routine describes work that should be carried out consistently. It names the input, the responsible agent, the expected process, and the output. Once published, it can be run again and again with different inputs, and every run leaves a trail you can inspect.

## Two ways to start

You never write a routine by hand. Both paths open a conversation in which you and an agent build the routine together, and both end in a draft you review before publishing.

- **Talk to an agent.** Ask the Research Assistant to do the work once: “Research how acme.com compares to its two main competitors on pricing and write me a brief.” When the result is useful, choose **Create routine** on that message. Toone opens a drafting thread that already knows what you asked for and what came back.
- **Start from the Routines panel.** Open the **Routines** panel, switch to **Routine Drafts**, and press **+**. This creates an empty draft and a conversation in which you describe the routine from scratch.

Use the first path when you have already seen a good result and want to keep it. Use the second when you know what the routine should do but have not run it yet.

## Start with the intent and the objective

Do not begin with steps. Begin by telling the agent what the routine is for and how you will know it worked. For the quickstart, describe a routine called **Produce a research brief**:

- **Intent:** turn a topic or question about acme.com's market into a brief the growth team can act on.
- **Input:** a topic or question.
- **Objective:** a readable brief with a summary, the evidence found, open uncertainties, and suggested next steps, saved as a file in the project.

That is enough for the agent to propose a first version of the routine. And don't worry if you can't state it that cleanly yet: the agents will help you self-correct as you go.

## Optionally, debate and break it down with an agent

For best results, or if you are not sure what the pipeline should look like, debate the steps with the agent. It is fine to start high level and go into the detail of each step once you have a draft. Ask the agent to break the work into smaller steps, and push back where a step is vague. For the research brief, the steps will look something like:

1. Accept a topic or question.
2. Ask the Research Assistant to investigate it.
3. Organize the findings into summary, evidence, uncertainties, and next steps.
4. Save the result as a readable project file.

When a step is a repeatable job in its own right, ask the agent to make it a sub-routine instead of a step. “Investigate a topic” is a good candidate: other routines in the acme.com growth project will want it too. Sub-routines keep each routine short and let you improve a piece of work in one place.

The draft fills in as you talk. Check its steps, inputs, outputs, and completion criteria in the panel, and keep refining until it reads the way you would explain the job to a colleague.

## Tip: make small routines, then orchestrate them into a bigger one

Focused routines are quicker to test and iterate. Build a routine that does one thing well, run it until it is reliable, and only then compose it with others as sub-routines under a bigger routine. You can also instruct the agent to call another routine as the last step of a routine, piping them together so the output of one becomes the input of the next.

## Make success visible

The routine should produce something you can inspect. Naming the expected sections and the destination file makes it easy to tell whether a run completed correctly, and gives the agent a concrete target instead of “write something good.”

## Review the draft

Before publishing, walk through the draft in the Routines panel. The graph shows every step and sub-routine; click any of them to see what it does, what it consumes, and what it outputs. This is the fastest way to catch a step that is doing too much, or an output that nothing downstream uses.

If a step is not right, you do not have to fix it alone. Select it and press **Discuss with agent** to open a conversation about that step only. Describe what should change, and the agent updates the draft while you watch.

## Publish it

Once the agent has drafted the routine and you have reviewed it, publish it to the organization. Either tell the agent you want it published, or press **Publish** on the draft in the Routines panel.

Publishing makes the routine part of the project: it appears under **Routines**, any agent in the project can be handed it, and it can be run, scheduled, and called from other routines. You can keep editing it afterwards; publishing is not the end of the conversation, only the point where the routine becomes real.

## Checkpoint

Before running it, verify that the published routine names the Research Assistant as the responsible agent, accepts a topic as input, and states what the final brief must contain and where it is saved.

Next: [Run, watch, and debug the routine](/how-to/getting-started/run-and-debug).
