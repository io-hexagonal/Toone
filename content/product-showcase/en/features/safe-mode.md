---
title: "Safe Mode"
navTitle: "Safe Mode"
description: "Redact forbidden topics from Claude tool output before it reaches the conversation, block output if screening fails, and check each result in an audit log."
eyebrow: "Feature · Control and safety"
pageType: "feature"
---

## Redact before tool output enters the conversation

Safe Mode screens command results, file reads, and web content produced through Claude tools. When it finds a forbidden topic, that content is removed before it reaches the agent conversation.

```toone-ui
composer-safe-badge
```

## Define forbidden topics

Add the subjects that should not appear in tool output. If the default screening is not specific enough for the project, describe how strictly to redact.

```toone-ui
settings-safe-mode
```

## Fail closed

If screening fails, Safe Mode withholds the output instead of passing it through unreviewed. Choosing a faster screening model can change speed and precision, but it does not weaken that failure behavior.

```toone-ui
chat-tool-output-withheld
```

## Inspect the audit trail

The audit log is a file on your Mac, not a view inside Toone. It records the screening outcome for each tool call. In **Settings → Mode**, choose **Reveal Audit Log** to open it in Finder. Review it when validating that the configured boundaries are behaving as intended.

```toone-ui
settings-safe-mode-audit
```

Safe Mode currently requires the Claude provider. Safe Mode is not available in the Mac App Store edition.

Next: [Live Share](/how-to/features/live-share).
