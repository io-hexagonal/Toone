import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Mode, scrolled to the bottom of the page: the end of the
 * Redaction Prompt section (Restore Default Prompt and its footer), then the
 * last section, "Audit Log", with "Reveal Audit Log" and its footer.
 *
 * CALIBRATE: grouped Form geometry and the push buttons.
 */

function SettingsSafeModeAudit() {
  return (
    <SettingsWindow formPaddingTop={0} selected="mode">
      <SettingsSection
        cutTop
        footer="Saves automatically as you type. The forbidden topics above are added automatically — you don't need to list them here."
      >
        <SettingsRow>
          <PushButton label="Restore Default Prompt" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        footer="One line per screened tool call, recording the outcome. Inspect it to confirm forbidden topics never reached the conversation."
        header="Audit Log"
      >
        <SettingsRow>
          <PushButton icon="doc.text.magnifyingglass" label="Reveal Audit Log" />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-safe-mode-audit",
  width: 640,
  radius: 24,
  label:
    "Settings, Mode page, scrolled to the end. Below the Redaction Prompt's Restore Default Prompt button, the Audit Log section has a Reveal Audit Log button. Its footer: one line per screened tool call, recording the outcome.",
  caption: "Settings → Mode → Audit Log: Reveal Audit Log shows the log file in Finder.",
  Component: SettingsSafeModeAudit,
};
