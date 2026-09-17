---
title: "AI providers"
navTitle: "AI providers"
description: "Choose OpenAI Codex or Anthropic Claude while Toone keeps the surrounding project structure consistent."
eyebrow: "Feature · Intelligence layer"
pageType: "feature"
---

## Choose the provider for your work

Toone supports OpenAI Codex and Anthropic Claude as the intelligence layer behind agents. Connect the provider you want to use during setup before creating and testing your first agent.

Settings also lets you choose a default model for new conversations and routine runs, or defer to the provider CLI’s own default. An active thread can still select a different model when the work requires it.

## Keep the project model stable

The provider powers agent work, while Toone maintains the surrounding project: agent roles, routines, tools, files, knowledge, and run context. This separates the model connection from the structure used to operate the work.

## Define agents independently

An agent should still have a clear purpose and responsibility regardless of the provider behind it. Test the agent’s behavior with a small request before placing it inside a larger routine.

## Understand the data boundary

Project files and working context are designed around the local workspace, while model requests necessarily leave the device for the selected provider. Consider the provider’s own account and data policies when deciding what an agent should receive.

Toone tracks the installed provider CLI versions and can surface approved updates, minimum-version warnings, and blocked releases before an outdated runtime becomes an invisible source of failure.

Return to the [feature directory](/how-to/features) or begin with [Install and connect](/how-to/getting-started/install-and-connect).
