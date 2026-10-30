---
title: "Workspace windows"
navTitle: "Workspace windows"
description: "Resize Toone from a compact companion to a full workspace, pick one of five panel layouts, and fit your other app windows around it as the work grows."
eyebrow: "Feature · Native workspace"
pageType: "feature"
---

## A workspace that follows the task

Toone can stay compact when you need a nearby agent and expand when a conversation becomes a larger piece of work. The window changes around the task instead of forcing every interaction into the same fixed layout.

```toone-ui
layout-transition
```

## Choose a panel layout

Settings provides five arrangements for the chat and Project Explorer panels:

- **Full Height** uses the visible height of the screen.
- **Compact** keeps an offset around panels and uses less vertical space.
- **Docked** places chat at the bottom center with Project Explorer beside it.
- **Zen** gives chat two thirds of the screen and Project Explorer the remainder.
- **Spotlight** centers a minimal chat panel and hides Project Explorer.

```toone-ui
panel-layouts
```

The same project and conversation remain active when the panel layout changes.

## Fit other applications around Toone

Toone can resize ordinary application windows into the space left around its panels. By default, those windows return to their previous frames when Toone is hidden; you can preserve the fitted layout instead. Fullscreen, minimized, and subsequently repositioned windows are left alone. This is not available in the Mac App Store edition.

```toone-ui
settings-other-applications
```

## Choose a panel style

Panel styles change color, contrast, and transparency without changing the information architecture. On the macOS 26 build, native material and tint controls provide additional visual tuning.

```toone-ui
settings-panel-style
```

## Why the transition matters

A quick interaction can become a deeper investigation. Moving between window sizes lets that transition happen without opening a separate product surface or beginning a new conversation.

```toone-ui
spotlight-over-app
```

Next: [Zen mode](/how-to/features/zen-mode).
