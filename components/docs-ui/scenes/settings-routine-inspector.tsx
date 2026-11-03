import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → Routines, scrolled to the "Routine Inspector" section
 * (inspector on, automatic fixes off, inspection threads kept).
 *
 * CALIBRATE: switches, the native stepper and grouped Form geometry.
 */

/** NSStepper (small up/down arrows). CALIBRATE */
function Stepper() {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 15,
        height: 22,
        borderRadius: 5,
        background: "rgba(255,255,255,0.14)",
        boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.12), 0 0.5px 1px rgba(0,0,0,0.3)",
        color: "var(--tu-label-1)",
      }}
    >
      <Glyph name="chevron.up" size={8} weight="bold" />
      <Glyph name="chevron.down" size={8} weight="bold" />
    </span>
  );
}

function SettingsRoutineInspector() {
  return (
    <SettingsWindow formPaddingTop={16} selected="routines" showClose={false} sidebarOffset={160}>
      <SettingsSection
        footer="Toone reviews a new routine's first runs and flags problems."
        header="Routine Inspector"
      >
        <SettingsRow label="Enable Routine Inspector">
          <Switch on />
        </SettingsRow>
        <SettingsRow label="Inspect each routine's first runs">
          <Stepper />
        </SettingsRow>
        <SettingsRow label="Automatically apply validated fixes">
          <Switch on={false} />
        </SettingsRow>
        <SettingsRow label="Keep inspection threads in Recent Threads">
          <Switch on />
        </SettingsRow>
      </SettingsSection>

    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-routine-inspector",
  width: 640,
  radius: 16,
  label:
    "Settings, Routines page. Routine Inspector: Enable Routine Inspector is on, Inspect each routine's first runs has a stepper, Automatically apply validated fixes is off, and Keep inspection threads in Recent Threads is on. The footer reads: Toone reviews a new routine's first runs and flags problems.",
  caption: "Settings → Routines: Toone reviews each new routine's first runs and flags problems.",
  Component: SettingsRoutineInspector,
};
