import type { ReactNode } from "react";
import { LayoutScreen } from "../LayoutTile";
import { Keycap } from "../Miniature";
import type { SceneDefinition } from "../scene";

/**
 * The workspace growing with the task: Spotlight → Docked → Full Height,
 * each step one press of the layout hotkey ⌥L, with the same conversation
 * (and, once it is shown, the same project tree) in every layout. Schematic
 * screens at the real panel frames, in panel-layouts' tile vocabulary.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Windows/PanelLayout.swift:10-33; geometry FloatingPanel.swift:31-206
 *   (ported in Miniature.tsx panelFrames).
 * - Hotkey: Core/Models/HotkeyBinding.swift:66-69 (default ⌥L, "Toggle
 *   layout"); cycle App/AppDelegate.swift:1190-1201: Full Height → Zen →
 *   Spotlight → Docked → Full Height (Compact → Full Height).
 * - Tile and keycap vocabulary: Features/Setup/Views/LayoutHotkeysStepView
 *   .swift:73-86 (keycap), :107-136 (layout card name 11pt), :273-387
 *   (PanelLayoutMockup).
 *
 * Code vs plan: the plan shows Spotlight → Full Height on one ⌥L arrow. In
 * the code ⌥L moves Spotlight to Docked, and Docked to Full Height, so the
 * figure draws both steps (two presses), not a jump the hotkey never makes.
 */

const PAD = 16;
const SCREEN_W = 168;
const ARROW_W = (640 - PAD * 2 - SCREEN_W * 3) / 2; // 52

function Step({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {children}
      <span style={{ fontSize: 12, lineHeight: "15px", color: "var(--tu-text-1)", whiteSpace: "nowrap" }}>{name}</span>
    </div>
  );
}

function Arrow() {
  return (
    <div
      style={{
        width: ARROW_W,
        height: (SCREEN_W * 900) / 1440,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Keycap>⌥L</Keycap>
      <svg aria-hidden="true" height="10" viewBox="0 0 34 10" width="34">
        <path d="M1 5h30M26 1l5 4-5 4" fill="none" stroke="var(--tu-text-2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function LayoutTransition() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", padding: PAD }}>
      <Step name="Spotlight">
        <LayoutScreen layout="spotlight" width={SCREEN_W} />
      </Step>
      <Arrow />
      <Step name="Docked">
        <LayoutScreen layout="docked" width={SCREEN_W} />
      </Step>
      <Arrow />
      <Step name="Full Height">
        <LayoutScreen layout="fullHeight" width={SCREEN_W} />
      </Step>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "layout-transition",
  width: 640,
  radius: 16,
  label:
    "Three schematic screens joined by arrows marked Option L. Spotlight: one small chat panel centred on the screen. Docked: a wider chat panel at the bottom centre with Project Explorer beside it. Full Height: the chat panel down the left edge and Project Explorer down the right. The same conversation appears in every chat panel.",
  caption: "Press ⌥L to move to the next layout. The conversation stays the same as the workspace grows.",
  Component: LayoutTransition,
};
