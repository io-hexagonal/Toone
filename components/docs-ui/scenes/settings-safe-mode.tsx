import { Glyph } from "../glyphs";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { FormPopUp, FormTextField, SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → Mode, scrolled past Project Directory and Access Level to the
 * Safe Mode sections: Safe Mode on with the Sonnet 4.6 redaction model, two
 * demo forbidden topics and the empty "Type a topic to forbid…" field, and
 * the Redaction Prompt editor. The crop ends before the last section, "Audit
 * Log", which is its own figure (settings-safe-mode-audit, placed where the
 * guide talks about the audit trail).
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:1408-1497 (safeModeSection:
 *   Toggle "Enable Safe Mode"; Picker "Redaction Model" titled
 *   "<model> — <tier caption>"; topic rows = Text + xmark.circle.fill
 *   .secondary plain button; TextField .roundedBorder + Label("Add", plus)
 *   .borderedProminent, disabled while the field is empty; TextEditor
 *   caption monospaced minHeight 120 + "Restore Default Prompt"; every header and
 *   footer string); :1520-1527 (tier captions: medium → "balanced").
 * - Core/Services/AIService/SafeMode/SafeModeService.swift:314
 *   (redactionModelOptions Opus 5, Opus 4.8, Sonnet 4.6, Haiku 4.5);
 *   :321-329 (defaultRedactionPrompt, shown in the editor).
 * - Core/Services/AIService/Models/AISessionOptions.swift:99,122 (Sonnet 4.6,
 *   tier medium).
 *
 * Code vs plan: none. The default redaction model is Opus 4.8 ("most
 * accurate", SafeModeService.swift:36); the figure shows a user who picked
 * Sonnet 4.6 ("balanced") as the plan asks. There is no in-app audit log view:
 * "Reveal Audit Log" opens the JSONL file in Finder (verification item 6).
 * Topics are demo data.
 *
 * CALIBRATE: switch, pop-up, text field, push buttons (including the
 * disabled prominent Add) and grouped Form geometry.
 */

const PROMPT = [
  "You are a content-safety redaction filter operating between an automated agent's tools and the user's conversation. You will receive a JSON array of strings — raw tool outputs (command output, file contents, web content).",
  "Rewrite each string, replacing any content that relates to the forbidden topics with the exact marker [REDACTED]. Redact the minimal span that covers the forbidden content (a line, sentence, or value — not the whole string unless it is entirely about a forbidden topic). Everything unrelated must be preserved byte-for-byte: do not reformat, summarize, translate, or fix anything.",
];

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
        footer="When enabled on the Claude provider, every tool result (commands, file reads, web content) is screened by the selected redaction model and forbidden content is replaced with [REDACTED] before it reaches the conversation. If screening fails, the output is withheld entirely — a faster model never weakens the guarantee, it just withholds more and redacts less precisely."
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
        footer="Instructions given to the redaction model. Saves automatically as you type. The forbidden topics above are added automatically — you don't need to list them here."
        header="Redaction Prompt"
      >
        <SettingsRow style={{ display: "block" }}>
          <div
            style={{
              height: 120,
              overflow: "hidden",
              fontFamily: "var(--tu-font-mono)",
              fontSize: 10,
              lineHeight: "13.33px",
              color: "var(--tu-label-1)",
            }}
          >
            {PROMPT.map((p, i) => (
              <div key={i} style={{ marginTop: i ? "13.33px" : 0 }}>
                {p}
              </div>
            ))}
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
    "Settings, Mode page, Safe Mode sections. Enable Safe Mode is switched on and the Redaction Model is Sonnet 4.6, balanced. Forbidden Topics lists Client names and Unreleased pricing above an empty field, Type a topic to forbid, and a disabled Add button. Below is the Redaction Prompt editor with Restore Default Prompt.",
  caption: "Settings → Mode: switch on Safe Mode and list the forbidden topics.",
  Component: SettingsSafeMode,
};
