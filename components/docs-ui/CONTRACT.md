# Docs UI figures: contract for scene authors

Small, code-drawn replicas of the Toone desktop app, embedded in the product
guides (`content/product-showcase/en/**`). Read this file and
`docs/research/2026-10-30-docs-ui-figures/plan.md` (in the main `toone` repo)
before writing a scene. The plan lists every figure, its anchor, its state and
the exact Swift sources.

**Ground truth is the Swift code** in
`apps/toone-desktop/Toone/Toone/` (main `toone` repo). Read the files the plan
names for your scene. Where the plan and the code disagree, follow the code and
say so in the scene's header comment and your report.

## Layout

```
components/docs-ui/
  CONTRACT.md            this file
  docs-ui.module.css     tokens (--tu-*) + every primitive's styles, scoped under .root
  glyphs.tsx             <Glyph name="…">: SF Symbol lookalikes
  demo.ts                DEMO: the one demo story (plan §0.4)
  scene.ts               SceneDefinition type, MAX_FIGURE_WIDTH
  registry.ts            scene id → definition (append here)
  Figure.tsx             the frame (client; scaling, caption, aria)
  ToonUiFigure.tsx       <ToonUiFigure id> used by guides and the gallery
  Surface.tsx            P1  panel / card / inset / row surfaces
  PanelHeader.tsx        P2  panel header
  Button.tsx             P5  icon, prominent, bordered, routine-*, setup, plain
  Field.tsx              P7  search / text / URL field
  Pill.tsx               P9  StatusPill, LiveBadge, StatusChip, Badge, CountBadge
  graph/                 P15 GraphKit
    types.ts             GraphNode / GraphEdge / LaidOutGraph
    layout.ts            layoutLayers(): port of the app's layered layout
    GraphCanvas.tsx      viewport (zoom/pan like the app), focus dimming
    GraphContainer.tsx   container, toolbar, pipelineSummary(), FocusStrip
    NodeCard.tsx / StepCard.tsx / NodeSurface.tsx / Edges.tsx / focus.ts
    researchBrief.ts     the demo routine's graph, shared by graph scenes
  scenes/<scene-id>.tsx  one file per scene
```

## Add a scene

1. Create `scenes/<scene-id>.tsx` (id = the plan's id, kebab-case). Export:

   ```tsx
   export const scene: SceneDefinition = {
     id: "workspace-strip-add",
     width: 420,            // natural width in px (= app points), ≤ 640
     radius: 24,            // 24 if the crop shows a panel corner, else 16
     label: "…",            // aria-label: what is shown, in which state
     caption: "…",          // one short sentence shown under the figure
     Component: WorkspaceStripAdd,
   };
   ```

   `Component` is a **server component**: no props, no hooks, no `"use client"`.
   Put a header comment listing the Swift sources (file:line) you reproduced.
2. Register it in `registry.ts`: one import line and one entry in `ALL`,
   both in alphabetical order (keeps parallel additions mergeable).
3. Embed it in the guide at the plan's anchor, as its own paragraph:

   ````md
   ```toone-ui
   workspace-strip-add
   ```
   ````

   An unknown id throws in development and renders nothing in production.
4. Check it in the gallery, then screenshot (below).

## What the kit gives you

- **Frame**: `Figure` paints the dark crop (`--tu-panel`), the radius, the
  1px white-15% stroke, the card shadow, the caption, `role="img"` and the
  `aria-label`. Your component only draws what is inside the crop. Do not add
  another outer border or shadow. Pad inside your scene to show the panel
  around the element (the graph scenes use 12px).
- **Scaling**: a figure renders at its natural width. When the column is
  narrower, `Figure` scales the whole crop with a transform. Never write
  responsive CSS inside a scene; it must never reflow.
- **Tokens**: use the `--tu-*` custom properties from `docs-ui.module.css`
  (`--tu-inner`, `--tu-input`, `--tu-sep`, `--tu-accent`, `--tu-running`,
  `--tu-pipe-*`, `--tu-text-1/2/3`, `--tu-label-1/2/3` for SwiftUI
  `.primary/.secondary/.tertiary`, `--tu-success/warning/error/info`, …).
  For `color.opacity(x)` write
  `color-mix(in srgb, var(--tu-accent) 25%, transparent)` (or `alpha()` from
  `graph/NodeSurface.tsx`). Text sizes are the macOS ones: caption/caption2 10,
  subheadline 11, callout 12, body 13, title3 15, title2 17.
- **Styles**: shared styles live in `docs-ui.module.css`. Scene-only geometry
  can be inline `style` (positions, sizes). If a scene needs real CSS (hover
  states, keyframes), add `scenes/<scene-id>.module.css` and reference
  `--tu-*` variables. Never add global CSS.
- **Glyphs**: `<Glyph name="sidebar.left" size={14} weight="semibold" />`.
  `size` ≈ 1.15 × the text size the symbol sits next to (`.caption` → 11,
  `.body` → 15). Missing a symbol? Add it to `glyphs.tsx` drawn from scratch
  with a few strokes on its 16-unit grid. **Never trace or copy SF Symbol
  outlines** (licence).
- **Graph**: build nodes and edges, place them with `layoutLayers(nodes,
  edges, layers)` (you supply the columns and their order the way the app's
  Sugiyama pass would: longest path, pull-right for lone sources, id-sorted
  ties), then render inside `<GraphContainer toolbar={<GraphToolbar …/>}>`
  with `<GraphCanvas graph zoom pan selectedId />`. The canvas uses the app's
  transform (`centre + p × zoom + pan`), so any crop is a real pinch/pan state;
  `fitZoom()` and `focusPan()` reproduce fit-to-view and "Focus selection".
  The whole pipeline is wide (≈1,170pt for the demo routine), so prefer a
  zoom ≥ 0.6 crop over a fit-to-view where text drops to 5px.
  Do not draw the "N⌄" sub-routine count capsule (dead UI, plan §5.6).

## Rules

- **Dark only, Smoky Quartz.** The app has no light theme. No light variants.
- **Demo data only**: names, counts and times from `demo.ts` (plan §0.4).
  Extend `demo.ts` if you need something new; never put real user data,
  real emails, or real file paths in a figure. Times are relative
  ("2 min ago", "Today").
- **Faithful, not decorative**: same strings, sizes, paddings, radii and
  colours as the Swift code, including its quirks (the graph summary really
  says "1 sub-routines"). One state per figure, as the plan describes it.
- **Natural width ≤ 640px.** Crop to the element the guide talks about.
- **Motion** only inside `@media (prefers-reduced-motion: no-preference)`,
  with a static fallback that still shows the state (e.g. the running wash
  sits at 0.16). Only motion the app has (breath, pulse); no cursors.
- **No interactivity**: figures are images. Render `<span>`/`<div>`, not
  `<button>`/`<input>`; no links, no focusable elements.
- **Native AppKit controls** (switches, radio groups, popups, NSMenu,
  sheets, segmented controls) have no geometry in the repo. Draw a close
  approximation and mark it `calibrate` in the header comment; they will be
  calibrated from captures of the running app.

## Verify

1. `npx tsc --noEmit` clean.
2. Open the dev gallery: **http://localhost:3008/en/docs-ui-gallery** (dev
   server of this worktree; the route 404s in production builds) and the
   guide page at the anchor.
3. Screenshot with Playwright (`chromium.launch({ channel: "chrome" })`,
   `deviceScaleFactor: 2`) at 1440 and 390 wide, plus a pass with
   `reducedMotion: "reduce"`. Dismiss the cookie banner ("Essential only")
   first. Screenshot the `figure` element. A reference script is at
   `/tmp/docs-ui-scripts/shoot.mjs` (Playwright resolves from
   `/Users/matheusparanhos/Projects/node_modules`).
4. Open every PNG and check: no overflow or clipped text you didn't intend,
   proportions match the Swift numbers, running glow not stronger than the
   code's, figure scales as one piece at 390.
