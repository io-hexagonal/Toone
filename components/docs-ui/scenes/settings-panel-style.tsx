import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { FormRadioPicker, SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Layout, scrolled to the "Panel Style" section: the Style radio
 * group with Smoky Quartz selected, the theme's icon and description line,
 * and the section footer.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:1694-1724 (Section "Panel
 *   Style": Picker "Style" .radioGroup over LayoutStyle.visibleCases; HStack
 *   top spacing 8 with the style icon in iconColor and the caption .secondary
 *   description, .padding(.top, 4); footer for the standard build).
 * - UI/Windows/LayoutStyle.swift:50-57 (order: Smoky Quartz, Deep Ocean,
 *   Labradorite, Matrix, Rose Gold); :84-132 (names, descriptions, icon
 *   "rectangle.on.rectangle", iconColor white 0.72 for Smoky Quartz).
 * - P17 SettingsForm (sidebar, grouped Form): see SettingsForm.tsx.
 *
 * Code vs plan: none for the standard build. The macOS 26 ("Liquid Glass")
 * build adds a sixth option "System", swaps the footer for "Every theme uses
 * native macOS 26 materials while preserving its own color and contrast." and
 * adds a "macOS 26 Glass Lab" section below (SettingsView.swift:1714-1770);
 * this figure shows the standard build.
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
