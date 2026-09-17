---
title: "Core concepts"
navTitle: "Core concepts"
description: "Learn how providers, projects, agents, threads, routines, runs, tools, and context fit together in Toone."
eyebrow: "Understand Toone"
pageType: "concept"
---

Toone has a small vocabulary, and every screen in the app maps onto it. This page defines each term once, in the order you meet them, so that the rest of the guide reads without surprises.

## Provider

A provider is the intelligence behind your agents. Toone works with **Anthropic Claude**, through Claude Code, and **OpenAI Codex**. You connect one during setup; Toone detects any Claude Code or Codex installation already on your Mac and can install a missing one for you.

The provider powers the thinking. Toone owns everything around it: the projects, agents, routines, tools, and context. That separation is why you can switch providers, or pick a different model for a single thread, without rebuilding your work. See [AI providers](/how-to/features/ai-providers).

## Project

A project is the boundary around one body of work, and on disk it is simply a folder. Click **+** at the top of the window, choose an empty folder, and Toone scaffolds the project inside it.

Each project holds its own agents, MCP servers, routines, and context. Nothing leaks between projects. The folder name is the project name, so it doubles as the scope: **acme.com growth** for one focused area, or **acme.com** for everything around the site. See [Create a project](/how-to/getting-started/create-a-project).

## Agent

An agent is a named role inside a project. You create one from the **Agents** panel by giving it a name, then optionally describing its purpose and tasks and attaching custom context it should pick up every time it works. Toone turns that description into the agent's role and capabilities.

A good agent has a responsibility narrow enough to evaluate: investigate a topic, draft outreach, review a pull request. Narrow roles are what let agents specialize and hand work to each other cleanly as the project grows. See [Create an agent](/how-to/getting-started/create-an-agent) and [Agent orchestration](/how-to/features/orchestration).

## Thread

A thread is one conversation with an agent. Some threads you start yourself, by talking to an agent directly. Others are opened by Toone: a drafting thread when you create a routine, and a thread for each agent working on a running routine.

Threads are where you follow the work. From a running routine's graph, **Focus thread** opens the conversation of the agent on that step, and you can watch what it reads, decides, and writes. Automated threads live under **System Threads** so they never crowd out your own. See [Background threads](/how-to/features/background-threads).

## Routine

A routine is a repeatable process written in natural language. It names the input, the responsible agent, the steps, the output that must exist when it finishes, and the criteria that say the run succeeded. Once published, it can be run again with different inputs, scheduled, and called by other routines.

You never write a routine by hand. You describe the intent and objective to an agent, debate the steps with it, and it drafts the routine for you. See [Create a routine](/how-to/getting-started/create-a-routine) and [Routines](/how-to/features/routines).

## Draft

A draft is a routine that is being built and has not been published yet. Drafts live under **Routine Drafts** in the Routines panel. You get one by choosing **Create routine** on a useful message in a thread, or by pressing **+** in the panel.

The draft fills in as you talk to the agent. You review it in the graph, use **Discuss with agent** on any step that is not right, and press **Publish** when it reads the way you would explain the job to a colleague. Publishing turns the draft into a routine the whole project can use.

## Step and sub-routine

A routine is a graph of steps. Each step has a job, something it consumes, and something it outputs, and clicking a step in the graph shows all three.

A sub-routine is a step that is a routine in its own right. When a piece of work is reusable, such as "investigate a topic", make it a sub-routine so several routines can share it and you can improve it in one place. Small, focused routines are quicker to test; compose them into a bigger one once they are reliable, or chain them by having the last step of one routine call the next.

## Run

A run is one execution of a routine. Runs make automation observable: routines that are in progress appear under **Running** at the top of the Routines panel, the graph lights up stage by stage, and the status shows whether the run is running, retrying, waiting for input, or paused.

Every run leaves a trail. It joins the routine's execution history as a resumable checkpoint, so you can compare runs, resume a stopped one, or stop a run that has gone wrong. The first run of a new routine is a test run: its job is to prove the pipeline works end to end. See [Run and debug](/how-to/getting-started/run-and-debug).

## Tools and MCP servers

Tools let agents act beyond conversation: read and write project files, query structured services, or operate a website. Most tools arrive through **MCP servers**, which can be global to your Mac or scoped to a single project so capabilities do not appear everywhere by default.

**Browser sessions** are a special kind of tool. An agent can work through a real browser, using a session you have already signed into, and you can click into that browser at any time to see exactly what it is doing on the web. See [MCPs and integrations](/how-to/features/mcp-integrations) and [Browser sessions](/how-to/features/browser-sessions).

## Context and knowledge

Context is what an agent knows before it starts. It comes from three places: the custom context you attach to the agent, such as markdown files with brand or product notes; the project's own files; and the knowledge the project accumulates as agents work, which outlives any single thread.

Because context lives on the agent and the project rather than in a chat, you never paste the same background twice, and a new routine starts from what the project already knows.

## Governance

Autonomy in Toone runs inside boundaries you set. A routine can require your approval before a step proceeds. **Safe Mode** screens tool output and redacts forbidden topics before they reach an agent, failing closed if screening fails. **Project History** records every change as a Git-backed checkpoint, so you can see what changed, who or which agent changed it, and ask for an explanation. See [Safe Mode](/how-to/features/safe-mode) and [Project History](/how-to/features/project-history).

## How the pieces connect

A provider supplies the intelligence. A project gives the work a home. Agents take responsibility, threads are where you talk to them and watch them work, and routines capture the processes that should happen the same way every time. Drafts are routines in the making; steps and sub-routines are their shape. Runs turn those definitions into observable work, tools and context give agents what they need to do it, and governance keeps the whole thing accountable to you.
