import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → Layout, scrolled to the "Other Applications" section: "Resize
 * other app windows when Toone is shown" on, "Preserve previous layouts when
 * hidden" off, and the section footer.
 *
 * CALIBRATE: switches and grouped Form geometry (SettingsForm.tsx).
 */

function SettingsOtherApplications() {
  return (
    <SettingsWindow formPaddingTop={10} selected="layout" showClose={false} sidebarOffset={150}>
      <div style={{ padding: "0 4px", fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)", marginBottom: -8 }}>
        Controls the height and positioning of the chat and project panels.
      </div>
      <SettingsSection
        footer="Fits ordinary onscreen windows into the space around Toone. By default their previous frames are restored when Toone is hidden; enable preservation to keep the fitted layout across hide/show cycles. Fullscreen and minimized windows are skipped, and windows you reposition afterward are not overwritten on restore."
        header="Other Applications"
      >
        <SettingsRow label="Resize other app windows when Toone is shown">
          <Switch on />
        </SettingsRow>
        <SettingsRow label="Preserve previous layouts when hidden">
          <Switch on={false} />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-other-applications",
  width: 640,
  radius: 16,
  label:
    "Settings, Layout page, Other Applications section. Resize other app windows when Toone is shown is switched on; Preserve previous layouts when hidden is off. The footer explains that windows are fitted around Toone and restored when it hides, unless preservation is on.",
  caption: "Settings → Layout → Other Applications: fit your other windows around Toone.",
  Component: SettingsOtherApplications,
};
