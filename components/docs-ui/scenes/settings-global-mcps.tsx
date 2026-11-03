import { Glyph, type GlyphName } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsSubheading, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → MCPs (Direct edition only): the "Global MCPs" scope banner,
 * then the catalogue grouped by type and subtype. GitHub needs an API key
 * ("API key…", switch off), Linear and Notion are on.
 *
 * CALIBRATE: switch and grouped Form geometry; the borderless "API key…"
 * button is drawn in the accent tint the Form sets.
 */

function McpRow({
  icon,
  name,
  description,
  apiKey,
  on,
}: {
  icon: GlyphName;
  name: string;
  description: string;
  apiKey?: boolean;
  on: boolean;
}) {
  return (
    <SettingsRow>
      <span style={{ display: "inline-flex", justifyContent: "center", width: 18, flex: "none", color: "var(--tu-label-2)" }}>
        <Glyph name={icon} size={15} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ color: "var(--tu-label-1)" }}>{name}</span>
        <span
          style={{
            fontSize: 10,
            lineHeight: "13px",
            color: "var(--tu-label-3)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {description}
        </span>
      </span>
      {apiKey ? <span style={{ flex: "none", fontSize: 10, color: "var(--tu-accent)" }}>API key…</span> : null}
      <Switch on={on} />
    </SettingsRow>
  );
}

function SettingsGlobalMcps() {
  return (
    <SettingsWindow selected="mcps">
      <SettingsSection header="Global MCPs">
        <SettingsRow align="top" style={{ gap: 8, paddingTop: 10, paddingBottom: 10 }}>
          <Glyph color="var(--tu-accent)" name="puzzlepiece.extension.fill" size={15} />
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)", paddingTop: 1 }}>
            Global MCP servers — available in every organization on this Mac. Per-organization servers are managed in the
            org panel.
          </span>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection header="Development">
        <SettingsSubheading>Version Control</SettingsSubheading>
        <McpRow
          apiKey
          description="Repositories, pull requests, issues, and code search via the GitHub MCP server."
          icon="chevron.left.forwardslash.chevron.right"
          name="GitHub"
          on={false}
        />
        <SettingsSubheading>Project Tracking</SettingsSubheading>
        <McpRow
          description="Issues, projects and cycles in Linear."
          icon="list.bullet.rectangle"
          name="Linear"
          on
        />
      </SettingsSection>

      <SettingsSection header="Business">
        <SettingsSubheading>Productivity</SettingsSubheading>
        <McpRow
          description="Search, read and update Notion pages and databases."
          icon="doc.text"
          name="Notion"
          on
        />
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-global-mcps",
  width: 640,
  radius: 24,
  label:
    "Settings, MCPs page. A banner explains that global MCP servers are available in every organization on this Mac and per-organization servers are managed in the org panel. Below, Development lists GitHub with an API key button and its switch off, and Linear switched on; Business lists Notion switched on.",
  caption: "Settings → MCPs: switch on servers for every project on this Mac.",
  Component: SettingsGlobalMcps,
};
