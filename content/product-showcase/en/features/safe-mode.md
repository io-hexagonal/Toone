---
title: "Safe Mode"
navTitle: "Safe Mode"
description: "Screen Claude tool results for forbidden topics before the output reaches a conversation."
eyebrow: "Feature · Control and safety"
pageType: "feature"
---

## Redact before tool output enters the conversation

Safe Mode screens command results, file reads, and web content produced through Claude tools. When the selected redaction model finds a forbidden topic, that content is replaced before it reaches the agent conversation.

## Define forbidden topics

Add the subjects that should not appear in tool output and customize the redaction prompt when the default policy is not specific enough for the project.

## Fail closed

If screening fails, Safe Mode withholds the output instead of passing it through unreviewed. Choosing a faster screening model can change speed and precision, but it does not weaken that failure behavior.

## Inspect the audit trail

The audit log records the screening outcome for each tool call and the post-redaction text the model received. Review it when validating that the configured boundaries are behaving as intended.

Safe Mode currently requires the Claude provider; Codex sessions cannot use this redaction hook.

Next: [Live Share](/how-to/features/live-share).
