import type { SceneDefinition } from "../scene";
import { McpRow, OrgBadge, OrgSectionHeader, OrgTypeHeader, PanelDisclosure } from "../OrgTree";

/**
 * The project panel's Organization tree scrolled to MCPs: the project's own
 * MCP servers. The built-in Toone tools are always on; GitHub is turned on
 * for this project but still needs its API key; Memory is ready and also
 * turned on for all projects; the rest of the catalog is off.
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/RightProjectPanelView.swift:159-200: "Organization"
 *   disclosure (building.2) over a ScrollView capped at 300pt, Divider,
 *   then the "Project" disclosure (folder).
 * - Features/Organization/Views/OrganizationOverviewView.swift:244-261:
 *   … Memory · Integrations (IntegrationsSectionView, "Your Site
 *   Integrations", globe) · MCPs; both only in the Direct edition
 *   (#if !TOONE_APP_STORE).
 * - Features/Organization/Views/MCPSectionView.swift:42-81 (section,
 *   count = enabled servers), :86-112 (type header, built-in row), :115-147
 *   (rows, badges "also global" accent / "needs API key" orange), :217-225
 *   (badge).
 * - _mcp-catalog.json (repo root): catalog order, names, icons and types
 *   (development: GitHub, Context7; knowledge: Memory, Sequential Thinking;
 *   business: Stripe, Notion; science: PubMed …). GitHub, Stripe and Notion
 *   have a required key; Context7's key is optional.
 *
 * Code vs plan: as planned. The right-click menu holds Enable/Disable, Set
 * API Key and "Make Available in All Organizations" (MCP servers can be
 * promoted to global; site maps cannot). The crop ends after Notion; the
 * catalog continues with the Science group (PubMed …) inside the 300pt
 * ScrollView, and the "Project" disclosure follows below it.
 *
 * Drawn at MAGNIFY × the app's points.
 */

const PANEL_W = 300;
const MAGNIFY = 1.15;

function OrgMcpSection() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, paddingTop: 4 }}>
      <PanelDisclosure icon="building.2" title="Organization" />
      <div style={{ paddingBottom: 8 }}>
        <OrgSectionHeader count={2} icon="globe" title="Your Site Integrations" />
        <OrgSectionHeader count={2} expanded icon="puzzlepiece.extension" title="MCPs" />
        <McpRow
          badges={<OrgBadge color="var(--tu-text-3)" label="built-in" />}
          icon="checkmark.seal.fill"
          name="Toone"
          state="ready"
        />
        <OrgTypeHeader title="Development" />
        <McpRow
          badges={<OrgBadge color="var(--tu-warning)" label="needs API key" />}
          icon="chevron.left.forwardslash.chevron.right"
          name="GitHub"
          state="needsKey"
        />
        <McpRow icon="book.closed" name="Context7" state="off" />
        <OrgTypeHeader title="Knowledge" />
        <McpRow badges={<OrgBadge color="var(--tu-accent)" label="also global" />} icon="brain" name="Memory" state="ready" />
        <McpRow icon="list.number" name="Sequential Thinking" state="off" />
        <OrgTypeHeader title="Business" />
        <McpRow icon="creditcard" name="Stripe" state="off" />
        <McpRow icon="doc.text" name="Notion" state="off" />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "org-mcp-section",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label:
    "The project panel's Organization tree scrolled to MCPs, which shows 2 enabled. Toone is built in and always on. Under Development, GitHub is on with an orange dot and a needs API key badge, and Context7 is off. Under Knowledge, Memory is on with a green dot and an also global badge, and Sequential Thinking is off. Stripe and Notion are off and greyed.",
  caption: "Turn MCP servers on per project from the Organization tree; an orange dot means the server still needs its API key.",
  Component: OrgMcpSection,
};
