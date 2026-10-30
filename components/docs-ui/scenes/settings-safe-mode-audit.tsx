import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Mode, scrolled to the bottom of the page: the end of the
 * Redaction Prompt section (Restore Default Prompt and its footer), then the
 * last section, "Audit Log", with "Reveal Audit Log" and its footer.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:1480-1497 (Redaction Prompt:
 *   "Restore Default Prompt" button and footer); :1499-1518 (Section "Audit
 *   Log": Button Label("Reveal Audit Log", doc.text.magnifyingglass), which
 *   selects the JSONL file in Finder, or opens the logs folder when nothing
 *   has been written yet; footer copy). Audit Log is the last section of
 *   the Mode page.
 * - Core/Services/AIService/SafeMode/SafeModeService.swift:103-112 (the log
 *   is ~/.toone/logs/safe-mode-audit.jsonl).
 *
 * Code vs plan: none. There is no in-app log viewer (plan "Verification
 * results" item 6): the button reveals the file in Finder. The window top
 * (close button) and the Mode row are in the crop because the page is
 * scrolled to its end in a short window.
 *
 * CALIBRATE: grouped Form geometry and the push buttons.
 */

function SettingsSafeModeAudit() {
  return (
    <SettingsWindow formPaddingTop={0} selected="mode">
      <SettingsSection
        cutTop
        footer="Instructions given to the redaction model. Saves automatically as you type. The forbidden topics above are added automatically — you don't need to list them here."
      >
        <SettingsRow>
          <PushButton label="Restore Default Prompt" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        footer="One line per screened tool call, recording the outcome and the post-redaction text the model received. Inspect it to confirm forbidden topics never reached the conversation."
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
    "Settings, Mode page, scrolled to the end. Below the Redaction Prompt's Restore Default Prompt button, the Audit Log section has a Reveal Audit Log button. Its footer: one line per screened tool call, recording the outcome and the post-redaction text the model received.",
  caption: "Settings → Mode → Audit Log: Reveal Audit Log shows the log file in Finder.",
  Component: SettingsSafeModeAudit,
};
