import { Glyph } from "../glyphs";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { FormPopUp, FormTextField, SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → Mode, scrolled past Project Directory and Access Level to the
 * Safe Mode sections: Safe Mode on with Sonnet 4.6 picked, two demo forbidden
 * topics and the empty "Type a topic to forbid…" field, and the prompt
 * editor, shown empty with a neutral placeholder. The crop ends before the last section, "Audit
 * Log", which is its own figure (settings-safe-mode-audit, placed where the
 * guide talks about the audit trail).
 *
 * CALIBRATE: switch, pop-up, text field, push buttons (including the
 * disabled prominent Add) and grouped Form geometry.
 */

const PROMPT_PLACEHOLDER = "Describe how strictly to redact…";

function Topic({ name }: { name: string }) {
  return (
    <SettingsRow label={name}>
      <Glyph
        color="var(--tu-label-2)"
        name="xmark.circle.fill"
        size={15}
        style={{ ["--tu-glyph-knockout" as string]: "#2c2c2e" }}
      />
    </SettingsRow>
  );
}

function SettingsSafeMode() {
  return (
    <SettingsWindow formPaddingTop={16} selected="mode">
      <SettingsSection
        footer="When enabled on the Claude provider, every tool result (commands, file reads, web content) is screened and forbidden content is removed before it reaches the conversation. If screening fails, the output is withheld entirely."
        header="Safe Mode"
      >
        <SettingsRow label="Enable Safe Mode">
          <Switch on />
        </SettingsRow>
        <SettingsRow label="Redaction Model">
          <FormPopUp value="Sonnet 4.6 — balanced" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        footer="Type a topic and press Add (or Enter) — each one is saved immediately. With no topics, Safe Mode redacts nothing."
        header="Forbidden Topics"
      >
        <Topic name="Client names" />
        <Topic name="Unreleased pricing" />
        <SettingsRow>
          <FormTextField placeholder="Type a topic to forbid…" />
          <PushButton icon="plus" label="Add" prominent style={{ height: 22, padding: "0 9px", opacity: 0.45 }} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        footer="Saves automatically as you type. The forbidden topics above are added automatically — you don't need to list them here."
        header="Redaction Prompt"
      >
        <SettingsRow style={{ display: "block" }}>
          <div
            style={{
              height: 52,
              overflow: "hidden",
              fontFamily: "var(--tu-font-mono)",
              fontSize: 10,
              lineHeight: "13.33px",
              color: "var(--tu-label-3)",
            }}
          >
            {PROMPT_PLACEHOLDER}
          </div>
        </SettingsRow>
        <SettingsRow>
          <PushButton label="Restore Default Prompt" />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-safe-mode",
  width: 640,
  radius: 24,
  label:
    "Settings, Mode page, Safe Mode sections. Enable Safe Mode is switched on and the Redaction Model is Sonnet 4.6, balanced. Forbidden Topics lists Client names and Unreleased pricing above an empty field, Type a topic to forbid, and a disabled Add button. Below is the Redaction Prompt editor, empty with the placeholder Describe how strictly to redact, and Restore Default Prompt.",
  caption: "Settings → Mode: switch on Safe Mode and list the forbidden topics.",
  Component: SettingsSafeMode,
};
