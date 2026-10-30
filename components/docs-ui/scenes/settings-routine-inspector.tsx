import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { FormRadioPicker, SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → Routines, scrolled past Babysit: the "Routine Inspector"
 * section (inspector on, first 3 runs, automatic fixes off, inspection
 * threads kept) and the "Proceed at the End" section with its default, "No".
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/RoutineSettingsView.swift:34-61 (Toggle "Enable
 *   Routine Inspector"; Stepper "Inspect the first N runs of each routine",
 *   1…20; Toggles "Automatically apply validated fixes" and "Keep inspection
 *   threads in Recent Threads", all three disabled while the inspector is
 *   off; footer copy); :63-85 (Picker "Proceed at the end" .radioGroup;
 *   HStack top spacing 8 with the policy icon + caption .secondary
 *   explanation, .padding(.top, 4); footer copy); :88-115 (.never →
 *   stop.circle in .secondary, "Routines end when their turn ends …").
 * - Features/Organization/Models/Routine.swift:482-497 (policy order and
 *   names: "Yes, for all", "Yes (individual settings override)", "No").
 * - Features/Settings/ViewModels/SettingsViewModel.swift:170-197 (defaults:
 *   proceed .never, inspector off, run limit 5, auto-fix off, keep threads
 *   on).
 *
 * Code vs plan: none. The inspector is off by default with a limit of 5; the
 * figure shows a user who switched it on and set 3, as the plan asks. "Recent
 * Threads" is the app's own string (audit Part 3 item 3).
 *
 * CALIBRATE: switches, the native stepper, the radio group and grouped Form
 * geometry.
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
        footer="Inspection uses a separate AI turn after each of a routine's early runs. Static routine checks and run-status badges remain available when inspection is disabled. Automatic fixes are applied only after the generated diff passes local validation."
        header="Routine Inspector"
      >
        <SettingsRow label="Enable Routine Inspector">
          <Switch on />
        </SettingsRow>
        <SettingsRow label="Inspect the first 3 runs of each routine">
          <Stepper />
        </SettingsRow>
        <SettingsRow label="Automatically apply validated fixes">
          <Switch on={false} />
        </SettingsRow>
        <SettingsRow label="Keep inspection threads in Recent Threads">
          <Switch on />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        footer="Applies to main-routines only. Sub-routines follow their own Proceed rule (set via the routine's context menu or its Proceed: metadata), and end by default."
        header="Proceed at the End"
      >
        <SettingsRow style={{ paddingTop: 10, paddingBottom: 10 }}>
          <FormRadioPicker
            label="Proceed at the end"
            options={[{ label: "Yes, for all" }, { label: "Yes (individual settings override)" }, { label: "No" }]}
            selected={2}
          />
        </SettingsRow>
        <SettingsRow align="top" style={{ gap: 8, paddingTop: 12 }}>
          <Glyph color="var(--tu-label-2)" name="stop.circle" size={15} />
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)", paddingTop: 1 }}>
            Routines end when their turn ends — today&apos;s standard behavior. Individual routine Proceed rules are ignored.
          </span>
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
    "Settings, Routines page. Routine Inspector: Enable Routine Inspector is on, Inspect the first 3 runs of each routine has a stepper, Automatically apply validated fixes is off, and Keep inspection threads in Recent Threads is on. Below, Proceed at the End offers Yes for all, Yes with individual settings overriding, and No, which is selected: routines end when their turn ends.",
  caption: "Settings → Routines: inspect each routine's first runs, and choose whether main routines keep going.",
  Component: SettingsRoutineInspector,
};
