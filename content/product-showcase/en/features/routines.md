---
title: "Routines"
navTitle: "Routines"
description: "Create repeatable workflows by talking through the work with an agent and expressing the resulting process in natural language."
eyebrow: "Feature · Repeatable work"
pageType: "feature"
---

## Turn a conversation into a process

A routine captures work that should be carried out consistently. Talk through the desired outcome with an agent, refine the approach together, and preserve the result as a process written in natural language.

```toone-ui
chat-create-routine-menu
```

## Define the important parts

A useful routine identifies its input, the agents responsible for the work, the sequence or conditions that matter, any approvals that should interrupt execution, and the output that must remain when the run finishes.

```toone-ui
routine-definition-card
```

## Mix fixed steps with agent steps

Not every step needs an AI agent. Mechanical work, such as fetching a known file, comparing it with the last run, sorting a list or filling a fixed template, can run as a script step: it runs the same way every time, finishes in seconds and uses no AI. Agent steps take the parts that need judgment: reading something unstructured to decide what to do, writing for a person, or working through a website.

A script step can also end a run early when there is nothing to do, so no agent starts and the run uses no AI at all. You don't write the scripts. The agent that drafts the routine with you decides which steps run as scripts and sets them up.

Script steps run in the Toone download from trytoone.com, not in the App Store edition. A routine that contains one can't be shared on Explore yet.

## Compose larger workflows

Routines can delegate to specialized agents and call smaller routines. This lets a complex workflow remain understandable as a set of focused responsibilities instead of becoming one long prompt. For published examples of focused routines, see [Launch Surface Preparation](/explore/routines/launch-surface-preparation-xzmzpbkf), which checks launch sites and prepares unpublished drafts, and [Launch Content Production](/explore/routines/launch-content-production-gni2lxu6), which turns an approved brief into reviewed launch content.

```toone-ui
subroutine-expanded-graph
```

## Observe and improve each run

Run the routine with a real input, watch how work moves through it, and inspect the result. If a result is unclear, revise the relevant instruction and run it again with the change visible.

```toone-ui
run-history-completed
```

## Fix a failed step and keep going

When a step fails, the run doesn't have to start over. Toone fixes the routine and continues the same run from the failed step, keeping the work earlier steps already finished. Each routine has an **Auto-fix** setting in its inspector that decides how much Toone does on its own:

- **Off:** the step's agent explains the failure; fixes happen only when you ask.
- **Suggest** (the default): Toone and the step's agent propose a fix, and nothing changes until you confirm it.
- **Auto safe fix:** Toone fixes the failed step's own text and continues. The issue card shows the change with **Revert**.
- **Auto-fix:** Toone works out the fix, including changes to the routine's structure, and continues.

```toone-ui
autofix-picker
```

In every mode, Toone stops and asks you when only you can unblock the step: a sign-in, an approval, a missing input, or a step that may already have sent something outside Toone. An automatic fix never changes who a routine contacts or what it can access.

```toone-ui
issue-card-autofixed
```

## Inspect early runs

With Routine Inspector on, Toone reviews a new routine's first runs and flags problems. Turn on **Automatically apply validated fixes** if you want it to fix them for you.

Choose whether inspection threads remain in Recent Threads.

```toone-ui
settings-routine-inspector
```

For a first practical example, follow [Create your first routine](/how-to/getting-started/create-a-routine).

## Start from a shared routine

You don't have to build every routine yourself. [Explore](/how-to/features/explore) lists reviewed routines that other people have shared. [Import one from Explore](/how-to/getting-started/import-a-routine-from-explore) into your organization, and when one of yours works well, [share it on Explore](/how-to/getting-started/share-a-routine-on-explore).

```toone-ui
explore-browser
```

Next: [Agent orchestration](/how-to/features/orchestration).
