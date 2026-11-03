import type { SceneDefinition } from "../scene";
import { McpRow, OrgBadge, OrgSectionHeader, OrgTypeHeader, PanelDisclosure } from "../OrgTree";

/**
 * The project panel's Organization tree scrolled to MCPs: the project's own
 * MCP servers. GitHub is turned on for this project but still needs its API
 * key; Figma is ready and also turned on for all projects; the rest of the
 * catalog is off.
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
        <OrgTypeHeader title="Development" />
        <McpRow
          badges={<OrgBadge color="var(--tu-warning)" label="needs API key" />}
          icon="chevron.left.forwardslash.chevron.right"
          name="GitHub"
          state="needsKey"
        />
        <OrgTypeHeader title="Design" />
        <McpRow badges={<OrgBadge color="var(--tu-accent)" label="also global" />} icon="pencil.circle" name="Figma" state="ready" />
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
    "The project panel's Organization tree scrolled to MCPs, which shows 2 enabled. Under Development, GitHub is on with an orange dot and a needs API key badge. Under Design, Figma is on with a green dot and an also global badge. Under Business, Stripe and Notion are off and greyed.",
  caption: "Turn MCP servers on per project from the Organization tree; an orange dot means the server still needs its API key.",
  Component: OrgMcpSection,
};
