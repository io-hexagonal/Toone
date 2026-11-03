import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { FormPopUp, FormRadioPicker, SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → AI Provider, top of the page: "Provider Selection" (both CLIs
 * installed, OpenAI Codex selected, the Selected / Binary info row)
 * and the "Model" section with Default Model on "CLI default" and its footer.
 *
 * CALIBRATE: radio group, pop-up and grouped Form geometry.
 */

function Installed() {
  return (
    <Glyph
      color="var(--tu-success)"
      name="checkmark.circle.fill"
      size={14}
      style={{ ["--tu-glyph-knockout" as string]: "#2c2c2e" }}
    />
  );
}

function SettingsDefaultModel() {
  return (
    <SettingsWindow selected="aiProvider">
      <SettingsSection
        footer="Select which AI CLI to use. Changing the provider will restart the AI connection."
        header="Provider Selection"
      >
        <SettingsRow style={{ paddingTop: 10, paddingBottom: 10 }}>
          <FormRadioPicker
            label="AI Provider"
            options={[
              { label: "Claude Code", trailing: <Installed /> },
              { label: "OpenAI Codex", trailing: <Installed /> },
            ]}
            selected={1}
          />
        </SettingsRow>
        <SettingsRow align="top" style={{ gap: 8, paddingTop: 16 }}>
          <Glyph
            color="var(--tu-accent)"
            name="info.circle.fill"
            size={15}
            style={{ ["--tu-glyph-knockout" as string]: "#2c2c2e" }}
          />
          <span style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, lineHeight: "13px", paddingTop: 1 }}>
            <span style={{ fontWeight: 500, color: "var(--tu-label-1)" }}>Selected: OpenAI Codex</span>
            <span style={{ color: "var(--tu-label-2)" }}>Binary: codex</span>
          </span>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        footer={
          '"CLI default" defers to the model configured in the CLI itself. Applies to new sessions and routine runs — use /model in chat to switch the active thread.'
        }
        header="Model"
      >
        <SettingsRow label="Default Model">
          <FormPopUp value="CLI default" />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-default-model",
  width: 640,
  radius: 24,
  label:
    "Settings, AI Provider page. Provider Selection lists Claude Code and OpenAI Codex, both with a green installed check, with OpenAI Codex selected and its binary below. The Model section shows Default Model set to CLI default, with a footer explaining the CLI default.",
  caption: "Settings → AI Provider: the provider and the default model.",
  Component: SettingsDefaultModel,
};
