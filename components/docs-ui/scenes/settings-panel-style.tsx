import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { FormRadioPicker, SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Layout, scrolled to the "Panel Style" section: the Style radio
 * group with Smoky Quartz selected, the theme's icon and description line,
 * and the section footer.
 *
 * CALIBRATE: native radio group and grouped Form geometry (SettingsForm.tsx,
 * NativeControls.tsx).
 */

const STYLES = ["Smoky Quartz", "Deep Ocean", "Labradorite", "Matrix", "Rose Gold"];

function SettingsPanelStyle() {
  return (
    <SettingsWindow formPaddingTop={16} selected="layout">
      <SettingsSection
        footer="Controls the visual appearance and transparency of the panels."
        header="Panel Style"
      >
        <SettingsRow style={{ paddingTop: 10, paddingBottom: 10 }}>
          <FormRadioPicker label="Style" options={STYLES.map((label) => ({ label }))} selected={0} />
        </SettingsRow>
        <SettingsRow align="top" style={{ gap: 8, paddingTop: 12 }}>
          <Glyph color="#b8b8b8" name="rectangle.on.rectangle" size={15} style={{ marginTop: 0 }} />
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)", paddingTop: 1 }}>
            Maximum transparency with neutral tones. Almost invisible — pure glass.
          </span>
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-panel-style",
  width: 640,
  radius: 24,
  label:
    "Settings, Layout page, Panel Style section. The Style radio group lists Smoky Quartz (selected), Deep Ocean, Labradorite, Matrix and Rose Gold; below it the Smoky Quartz description reads: Maximum transparency with neutral tones. Almost invisible, pure glass.",
  caption: "Settings → Layout → Panel Style: pick a theme for every panel.",
  Component: SettingsPanelStyle,
};
