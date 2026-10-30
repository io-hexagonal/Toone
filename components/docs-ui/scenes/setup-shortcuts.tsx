import { KeyCombo } from "../Keycap";
import type { SceneDefinition } from "../scene";

/**
 * Setup window, "Layout & hotkeys" step: the "Shortcuts" block with its five
 * keycap rows (the Layout cards above and the Theme picker below are
 * cropped out).
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Setup/Views/LayoutHotkeysStepView.swift:38-56 (VStack leading
 *   spacing 12: "Shortcuts" 13 semibold textSecondary, uppercased, tracking
 *   0.5; rows VStack spacing 8); :58-72 (row: HStack spacing 12; keys in an
 *   HStack spacing 4 framed to width 90, leading; label 13 textPrimary);
 *   :74-88 (keycap, see Keycap.tsx).
 * - Core/Models/HotkeyBinding.swift:53-80 (defaults: ⌥Tab toggle app, ⌥§
 *   focus chat input, ⌥L toggle layout).
 * - Features/Setup/Views/SetupView.swift:43-46,216 (window 620 wide,
 *   content margin 32).
 *
 * Code vs plan: none in the strings. Note the app's own label "Cycle layout
 * theme" for ⌥L: the hotkey cycles the panel layout (Full Height → Zen →
 * Spotlight → Docked, AppDelegate.swift:1190-1201), not the colour theme;
 * the figure reproduces the Setup copy as written.
 *
 * calibrate: the Setup window surface is drawn with the frozen --tu-panel.
 */

const ROWS: { keys: string[]; label: string }[] = [
  { keys: ["⌥", "Tab"], label: "Show / hide Toone" },
  { keys: ["⌥", "§"], label: "Focus chat input" },
  { keys: ["⇧", "Tab"], label: "Cycle mode (Plan → Loop)" },
  { keys: ["⌘", "⇧", "}"], label: "Next active thread" },
  { keys: ["⌥", "L"], label: "Cycle layout theme" },
];

function SetupShortcuts() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "24px 32px" }}>
      <span
        style={{
          fontSize: 13,
          lineHeight: "16px",
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: "var(--tu-text-2)",
        }}
      >
        Shortcuts
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ROWS.map((row) => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <KeyCombo keys={row.keys} style={{ width: 90, flex: "none" }} />
            <span style={{ fontSize: 13, lineHeight: "16px", color: "var(--tu-text-1)" }}>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-shortcuts",
  width: 360,
  radius: 16,
  label:
    "The Shortcuts list from Toone's setup: Option Tab shows or hides Toone, Option § focuses the chat input, Shift Tab cycles the mode from Plan to Loop, Command Shift right brace jumps to the next active thread, and Option L cycles the layout.",
  caption: "Setup lists the shortcuts: ⌥Tab brings Toone up over whatever you are working in.",
  Component: SetupShortcuts,
};
