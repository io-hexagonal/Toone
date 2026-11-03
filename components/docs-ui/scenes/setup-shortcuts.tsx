import { KeyCombo } from "../Keycap";
import type { SceneDefinition } from "../scene";

/**
 * Setup window, "Layout & hotkeys" step: the "Shortcuts" block with its five
 * keycap rows (the Layout cards above and the Theme picker below are
 * cropped out).
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
