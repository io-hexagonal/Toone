import type { ReactNode } from "react";
import { Glyph } from "../glyphs";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";
import { Tooltip } from "../Tooltip";

/**
 * Settings → AI Provider, scrolled down to "Automatic Updates" (off) and
 * "Versions": Claude Code on a Toone-managed copy, up to date with the green
 * check, OpenAI Codex on the user's own installation and too old (the orange
 * triangle, with its help tag showing), and "Check for Updates". Version
 * numbers are left out on purpose.
 *
 * CALIBRATE: switch, push button, help tag and grouped Form geometry.
 */

function VersionRow({ name, detail, children }: { name: string; detail: string; children: ReactNode }) {
  return (
    <SettingsRow label={name}>
      <span style={{ fontSize: 10, color: "var(--tu-label-2)" }}>{detail}</span>
      {children}
    </SettingsRow>
  );
}

function SettingsProviderVersions() {
  return (
    <SettingsWindow formPaddingTop={16} selected="aiProvider">
      <SettingsSection
        footer={[
          "Toone keeps Claude Code and Codex up to date without interrupting running sessions. Your own installations are never modified.",
          "Automatic updates are off. Use Check for Updates below to update manually.",
        ]}
        header="Automatic Updates"
      >
        <SettingsRow label="Keep Claude Code and Codex up to date">
          <Switch on={false} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection footer="Last checked: 2 minutes ago" header="Versions">
        <VersionRow detail="Up to date · Toone-managed" name="Claude Code">
          <Glyph
            color="var(--tu-success)"
            name="checkmark.circle.fill"
            size={12}
            style={{ ["--tu-glyph-knockout" as string]: "#2c2c2e" }}
          />
        </VersionRow>
        <VersionRow detail="Update needed · your installation" name="OpenAI Codex">
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Glyph
              color="var(--tu-warning)"
              name="exclamationmark.triangle.fill"
              size={15}
              style={{ ["--tu-glyph-knockout" as string]: "#2c2c2e" }}
            />
            <Tooltip style={{ top: 22, right: -6 }} text="Below minimum required version." />
          </span>
        </VersionRow>
        <SettingsRow>
          <PushButton icon="arrow.clockwise" label="Check for Updates" />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-provider-versions",
  width: 640,
  radius: 24,
  label:
    "Settings, AI Provider page, Automatic Updates and Versions sections. Keep Claude Code and Codex up to date is switched off. Claude Code shows Up to date, Toone-managed, with a green check; OpenAI Codex shows Update needed, your installation, with an orange warning triangle whose help tag reads Below minimum required version. A Check for Updates button and Last checked: 2 minutes ago follow.",
  caption: "Settings → AI Provider → Versions: an outdated CLI gets a warning.",
  Component: SettingsProviderVersions,
};
