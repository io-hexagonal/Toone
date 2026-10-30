import type { ReactNode } from "react";
import { Glyph } from "../glyphs";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";
import { Tooltip } from "../Tooltip";

/**
 * Settings → AI Provider, scrolled down to "Automatic Updates" (off) and
 * "Versions": Claude Code on a Toone-managed copy with the green check,
 * OpenAI Codex on the user's own installation below the minimum version (the
 * orange triangle, with its help tag showing), and "Check for Updates".
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:918-942 (Automatic Updates:
 *   Toggle "Keep Claude Code and Codex up to date"; footer VStack spacing 4,
 *   the "off" line); :944-975 (Versions: one providerVersionRow per provider,
 *   then the "Check for Updates" button with arrow.clockwise; footer
 *   "Last checked: …" relative/named); :1037-1090 (providerVersionRow:
 *   name, Spacer, caption .secondary "v<version> · Toone-managed | your
 *   installation"; blocked → red triangle, below minimum → orange triangle
 *   with .help("Below minimum required version."), update → Update button,
 *   else checkmark.circle.fill green .imageScale(.small)).
 * - Resources/cli-versions.json (minimum / blocked guardrails, fetched
 *   remotely; the bundled copy sets none).
 *
 * Code vs plan: "Below minimum required version" is the triangle's help tag
 * (tooltip), not a visible label; the figure shows the help tag as on hover.
 * Automatic Updates is off so the outdated Codex is not silently replaced by
 * a managed copy (the newest working copy wins when it is on). Version numbers
 * are demo values.
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
          "Toone checks daily and installs newer releases into ~/.toone/bin without interrupting running sessions. Your own installations are never modified; the newest working copy is used.",
          "Automatic updates are off. Use Check for Updates below to update manually.",
        ]}
        header="Automatic Updates"
      >
        <SettingsRow label="Keep Claude Code and Codex up to date">
          <Switch on={false} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection footer="Last checked: 2 minutes ago" header="Versions">
        <VersionRow detail="v2.1.310 · Toone-managed" name="Claude Code">
          <Glyph
            color="var(--tu-success)"
            name="checkmark.circle.fill"
            size={12}
            style={{ ["--tu-glyph-knockout" as string]: "#2c2c2e" }}
          />
        </VersionRow>
        <VersionRow detail="v0.150.0 · your installation" name="OpenAI Codex">
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
    "Settings, AI Provider page, Automatic Updates and Versions sections. Keep Claude Code and Codex up to date is switched off. Claude Code shows version 2.1.310, Toone-managed, with a green check; OpenAI Codex shows version 0.150.0, your installation, with an orange warning triangle whose help tag reads Below minimum required version. A Check for Updates button and Last checked: 2 minutes ago follow.",
  caption: "Settings → AI Provider → Versions: an outdated CLI gets a warning.",
  Component: SettingsProviderVersions,
};
