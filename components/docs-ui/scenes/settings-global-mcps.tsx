import { Glyph, type GlyphName } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsSubheading, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → MCPs (Direct edition only): the "Global MCPs" scope banner,
 * then the catalogue grouped by type and subtype. GitHub needs an API key
 * ("API key…", switch off), Context7 and Memory are on, Sequential Thinking
 * is off.
 *
 * Sources:
 * - apps/toone-desktop/Toone/Toone/Features/Settings/Views/
 *   MCPIntegrationsSettingsView.swift:24-53 (Section "Global MCPs" with the
 *   scope banner; one Section per type, a caption-medium tertiary subtype
 *   heading row before its entries); :86-126 (mcpRow: icon frame 18
 *   .secondary; name .primary; description .caption .tertiary lineLimit 1;
 *   "API key…" .borderless .caption when the entry has required env keys;
 *   labels-hidden switch); :161-170 (scopeBanner: HStack top spacing 8,
 *   accent icon, caption .secondary, padding v2).
 * - Core/Services/MCPRegistry/MCPCatalog.swift:88-95, :144-176 (grouping keeps
 *   catalogue order; "version-control" → "Version Control").
 * - _mcp-catalog.json (repo root): Development = GitHub (version-control,
 *   GITHUB_PERSONAL_ACCESS_TOKEN required) and Context7 (documentation);
 *   Knowledge = Memory (memory) and Sequential Thinking (reasoning). Names,
 *   icons and descriptions are the catalogue's.
 * - SettingsView.swift:271 (the MCPs page is hidden in the App Store edition).
 *
 * Code vs plan: the plan says "three rows"; the catalogue groups them under
 * type sections with subtype headings, so the crop shows the first two type
 * sections (four rows). The page continues with Business, Science and
 * "Global Integrations" below the crop. Which servers are on is demo state.
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
        <SettingsSubheading>Documentation</SettingsSubheading>
        <McpRow
          description="Up-to-date documentation and code examples for any library, injected on demand."
          icon="book.closed"
          name="Context7"
          on
        />
      </SettingsSection>

      <SettingsSection header="Knowledge">
        <SettingsSubheading>Memory</SettingsSubheading>
        <McpRow
          description="Persistent knowledge-graph memory across sessions (entities, relations, observations)."
          icon="brain"
          name="Memory"
          on
        />
        <SettingsSubheading>Reasoning</SettingsSubheading>
        <McpRow
          description="Structured step-by-step reasoning scratchpad for complex, multi-stage problems."
          icon="list.number"
          name="Sequential Thinking"
          on={false}
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
    "Settings, MCPs page. A banner explains that global MCP servers are available in every organization on this Mac and per-organization servers are managed in the org panel. Below, Development lists GitHub with an API key button and its switch off, and Context7 switched on; Knowledge lists Memory switched on and Sequential Thinking off.",
  caption: "Settings → MCPs: switch on servers for every project on this Mac.",
  Component: SettingsGlobalMcps,
};
