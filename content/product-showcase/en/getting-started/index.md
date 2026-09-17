---
title: "Getting started with Toone"
navTitle: "Getting started"
description: "Go from a fresh installation to a project with an agent and a routine you can run and inspect."
eyebrow: "Quickstart"
pageType: "tutorial"
estimatedTime: "About 15 minutes"
---

## The outcome

By the end of this path, you will have a working project with one specialized agent and one repeatable routine. You will run the routine, follow it while it works, and inspect its result.

For the first project, keep the goal deliberately small. A useful example is a research assistant that turns a topic into a structured brief.

## 1. Install and connect

Install the Toone build for your Mac and open it. Setup starts by asking you to choose one of two routes:

- **Express** covers the essentials: connect your AI provider, choose device permissions, and learn the show/hide hotkey. This is the recommended route for a first run.
- **Complete** does everything Express does and adds a walkthrough of your panel layout, theme, and essential keyboard shortcuts.

Both routes end in the same place. Everything Complete configures stays adjustable later in Settings, so Express never locks you out of anything.

When you reach the provider step, Toone checks your Mac for existing Claude Code and OpenAI Codex installations and shows each one as ready, not found, or in need of repair. If one provider is already ready, Toone selects it for you. If neither is installed, Toone can download and install the missing tool, or you can install it yourself and Toone will detect it when it appears. You then sign in to your Anthropic or OpenAI account in the browser.

[Install Toone and connect a provider](/how-to/getting-started/install-and-connect).

## 2. Create a project

A project in Toone is a folder on your Mac. Click the **+** at the top of the window and choose an empty folder; Toone takes care of the rest. Name the folder for the scope of the work, such as “acme.com growth” for one focused area, or simply “acme.com” if you want one project for everything around the site.

Each project holds its own agents, MCP servers, routines, and context, and everything the agents produce stays inside its folder.

[Create your first project](/how-to/getting-started/create-a-project).

## 3. Create an agent

Open the **Agents** panel and choose **Create agent**. Name the agent, such as “Research Assistant,” then optionally describe its purpose and the tasks it should take on, and give it any custom context it should pick up every time, such as markdown files with product or brand notes.

Give the agent a narrow responsibility rather than a personality: investigate a topic, distinguish evidence from assumptions, and return a structured brief. Toone turns that description into the agent’s role and capabilities, and the agent appears in the panel ready to talk to.

[Create your first agent](/how-to/getting-started/create-an-agent).

## 4. Create a routine

There are two ways to create a routine, and both end in a draft you can review before publishing:

- **Talk to an agent.** Ask the agent for the work directly. Once a request produces a useful result, choose **Create routine** from that message and Toone opens a drafting thread with its Routine Supervisor, using the conversation as the starting point.
- **Start from the Routines panel.** Open the **Routines** panel, switch to **Routine Drafts**, and press **+**. This creates an empty draft and a conversation in which you describe the routine.

Either way, begin with the intent and the objective: what should come in, what should come out, and how you will know the result is good. Then work with the agent to break the objective into smaller steps, or into sub-routines when a step is a repeatable job on its own. The draft fills in as you talk, and you can review its steps, inputs, outputs, and completion criteria before you publish it.

[Create your first routine](/how-to/getting-started/create-a-routine).

## 5. Run, watch, and improve

Run the routine with a real topic. Then open the **Routines** panel: routines that are in progress appear under **Running** at the top of the list, with their current stage. Select a running routine to follow its graph as each stage lights up, and use **Focus thread** on any active node to open the agent’s conversation and follow its execution as it happens.

When the run finishes, inspect the brief it produced. Revise one instruction in the routine, run it again, and compare. That loop of running, watching, and adjusting is how routines get reliable.

[Run and debug the routine](/how-to/getting-started/run-and-debug).

## What comes next

Once this loop feels familiar, the rest of Toone becomes easier to place. You can add specialized agents, connect tools, schedule routines, and delegate work between roles without changing the underlying model.
