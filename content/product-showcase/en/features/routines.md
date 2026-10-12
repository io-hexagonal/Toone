---
title: "Routines"
navTitle: "Routines"
description: "Create repeatable workflows by talking through the work with an agent and expressing the resulting process in natural language."
eyebrow: "Feature · Repeatable work"
pageType: "feature"
---

## Turn a conversation into a process

A routine captures work that should be carried out consistently. Talk through the desired outcome with an agent, refine the approach together, and preserve the result as a process written in natural language.

## Define the important parts

A useful routine identifies its input, the agents responsible for the work, the sequence or conditions that matter, any approvals that should interrupt execution, and the output that must remain when the run finishes.

## Compose larger workflows

Routines can delegate to specialized agents and call smaller routines. This lets a complex workflow remain understandable as a set of focused responsibilities instead of becoming one long prompt. For published examples of focused routines, see [Launch Surface Preparation](/explore/routines/launch-surface-preparation-xzmzpbkf), which checks launch sites and prepares unpublished drafts, and [Launch Content Production](/explore/routines/launch-content-production-gni2lxu6), which turns an approved brief into reviewed launch content.

## Observe and improve each run

Run the routine with a real input, watch how work moves through it, and inspect the result. If a result is unclear, revise the relevant instruction and run it again with the change visible.

## Fix a failed step and keep going

When a step fails, the run doesn't have to start over. Toone fixes the routine and continues the same run from the failed step, keeping the work earlier steps already finished. Each routine has an **Auto-fix** setting in its inspector that decides how much Toone does on its own:

- **Off:** the step's agent explains the failure; fixes happen only when you ask.
- **Suggest** (the default): Toone and the step's agent propose a fix, and nothing changes until you confirm it.
- **Auto safe fix:** Toone fixes the failed step's own text and continues. The issue card shows the change with **Revert**.
- **Auto-fix:** Toone works out the fix, including changes to the routine's structure, and continues.

In every mode, Toone stops and asks you when only you can unblock the step: a sign-in, an approval, a missing input, or a step that may already have sent something outside Toone. An automatic fix never changes who a step sends to, permissions, credentials, or the step's provider or model. Temporary problems, such as a provider timing out, are retried twice unchanged before Toone asks you.

## Inspect early runs

Routine Inspector can review the first runs of each routine in a separate AI turn. It reports problems alongside the normal static checks and run-status badges, and can optionally apply a generated fix only after its diff passes local validation.

Choose whether inspection threads remain in Recent Threads and whether a main routine should continue automatically when its current turn ends.

For a first practical example, follow [Create your first routine](/how-to/getting-started/create-a-routine).

## Start from a shared routine

You don't have to build every routine yourself. [Explore](/how-to/features/explore) lists reviewed routines that other people have shared. [Import one from Explore](/how-to/getting-started/import-a-routine-from-explore) into your organization, and when one of yours works well, [share it on Explore](/how-to/getting-started/share-a-routine-on-explore).

Next: [Agent orchestration](/how-to/features/orchestration).
