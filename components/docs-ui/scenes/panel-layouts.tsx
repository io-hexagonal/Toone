import type { CSSProperties } from "react";
import type { SceneDefinition } from "../scene";

/**
 * The five panel layouts as small schematic screens, each with the chat panel
 * and the Project Explorer panel drawn at the frames the app really gives
 * them. Full Height (the default) carries the selected-tile treatment.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - geometry: UI/Windows/FloatingPanel.swift:31-206 (`defaultFrame`): padding
 *   8, gap 8; chat 28% / project 24% of the screen width (Full Height,
 *   Compact); Compact = 85% height with a 44pt top offset; Docked = chat
 *   55% × 40% centred at the bottom, project 24% × 50% anchored 8pt right of
 *   it; Zen = (W − 24) × 2/3 and × 1/3, full height; Spotlight = chat
 *   53% × 1/3 centred, project parked off-screen (PanelLayout.swift:20-33).
 * - tile vocabulary: Features/Setup/Views/LayoutHotkeysStepView.swift:107-136
 *   (card: VStack 6, padding 8/12, r8, borderSubtle stroke, selected =
 *   toolBackground fill + iconColor stroke; name 11pt, primary when selected
 *   else tertiary) and the PanelLayoutMockup :273-387 (screen black .4 r6 +
 *   white .1 stroke; chat accent .25, project accent .15, panel border
 *   white .15, r3).
 * - names: LayoutHotkeysStepView.swift:391-399; order PanelLayout.allCases.
 *
 * Code vs plan / quirks:
 * - The rectangles use FloatingPanel's real fractions, not the mockup's
 *   rounded ones (the mockup draws Docked's chat 45% wide; the app uses 55%).
 * - Docked: the project panel starts 8pt right of a centred 55% chat and is
 *   24% wide, so on any screen it runs ≈1.5% + 8pt past the right edge
 *   (nothing clamps it, PanelWindowService.swift:543-560). Drawn clipped by
 *   the screen, as the mockup clips. Calibrate against a capture.
 * - Screen = a 1440 × 900 visible frame (16:10, menu bar ignored).
 */

const SCREEN_W = 1440;
const SCREEN_H = 900;
const PAD = 8;
const GAP = 8;

const MOCK_W = 88;
const MOCK_H = (MOCK_W * SCREEN_H) / SCREEN_W; // 55

type Rect = { x: number; y: number; w: number; h: number };
type Layout = { name: string; chat: Rect; project?: Rect; selected?: boolean };

// Top-left origin (AppKit's is bottom-left; every layout here is symmetric
// or explicitly anchored, so the flip is done per case).
const W = SCREEN_W;
const H = SCREEN_H;
const chatW = W * 0.28;
const projW = W * 0.24;
const zenW = W - PAD * 2 - GAP;
const dockChatW = W * 0.55;
const dockChatH = H * 0.4;
const dockChatX = (W - dockChatW) / 2;
const dockProjH = H * 0.5;
const compactH = H * 0.85;
const spotW = W * 0.53;
const spotH = H / 3;

const LAYOUTS: Layout[] = [
  {
    name: "Full Height",
    selected: true,
    chat: { x: PAD, y: PAD, w: chatW, h: H - PAD * 2 },
    project: { x: W - projW - PAD, y: PAD, w: projW, h: H - PAD * 2 },
  },
  {
    name: "Compact",
    chat: { x: PAD, y: 44, w: chatW, h: compactH },
    project: { x: W - projW - PAD, y: 44, w: projW, h: compactH },
  },
  {
    name: "Docked",
    chat: { x: dockChatX, y: H - PAD - dockChatH, w: dockChatW, h: dockChatH },
    project: { x: dockChatX + dockChatW + GAP, y: H - PAD - dockProjH, w: W * 0.24, h: dockProjH },
  },
  {
    name: "Zen",
    chat: { x: PAD, y: PAD, w: zenW * (2 / 3), h: H - PAD * 2 },
    project: { x: PAD + zenW * (2 / 3) + GAP, y: PAD, w: zenW / 3, h: H - PAD * 2 },
  },
  {
    name: "Spotlight",
    chat: { x: (W - spotW) / 2, y: (H - spotH) / 2, w: spotW, h: spotH },
  },
];

const S = MOCK_W / SCREEN_W;

function panelStyle(r: Rect, fill: number): CSSProperties {
  return {
    position: "absolute",
    left: r.x * S,
    top: r.y * S,
    width: r.w * S,
    height: r.h * S,
    borderRadius: 2,
    background: `color-mix(in srgb, var(--tu-accent) ${fill}%, transparent)`,
    boxShadow: "inset 0 0 0 1px var(--tu-panel-border)",
  };
}

function Tile({ layout }: { layout: Layout }) {
  const selected = Boolean(layout.selected);
  return (
    <span
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        borderRadius: 8,
        background: selected ? "var(--tu-bubble-agent)" : "transparent",
        boxShadow: `inset 0 0 0 1px ${selected ? "var(--tu-accent)" : "var(--tu-border-subtle)"}`,
      }}
    >
      <span
        style={{
          position: "relative",
          display: "block",
          width: MOCK_W,
          height: MOCK_H,
          overflow: "hidden",
          borderRadius: 6,
          background: "rgba(0, 0, 0, 0.4)",
          boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {layout.project ? <span style={panelStyle(layout.project, 15)} /> : null}
        <span style={panelStyle(layout.chat, 25)} />
      </span>
      <span
        style={{
          fontSize: 11,
          lineHeight: "13px",
          color: selected ? "var(--tu-text-1)" : "var(--tu-text-3)",
          whiteSpace: "nowrap",
        }}
      >
        {layout.name}
      </span>
    </span>
  );
}

function PanelLayouts() {
  return (
    <div style={{ display: "flex", gap: 8, padding: 16 }}>
      {LAYOUTS.map((layout) => (
        <Tile key={layout.name} layout={layout} />
      ))}
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "panel-layouts",
  width: 16 * 2 + (MOCK_W + 24) * 5 + 8 * 4,
  radius: 16,
  label:
    "Five small screen diagrams of the panel layouts. Full Height, selected: chat on the left and Project Explorer on the right, both full height. Compact: the same panels, shorter, with a gap above. Docked: a wide chat at the bottom centre with Project Explorer beside it on the right. Zen: chat across two thirds of the screen, Project Explorer in the last third. Spotlight: one centred chat panel, no Project Explorer.",
  caption: "The five panel layouts at their real proportions. The brighter panel is the chat, the dimmer one Project Explorer.",
  Component: PanelLayouts,
};
