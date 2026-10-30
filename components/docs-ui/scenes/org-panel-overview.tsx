import { Button } from "../Button";
import { Glyph, type GlyphName } from "../glyphs";
import { OrgSectionHeader, PanelDisclosure } from "../OrgTree";
import { PanelHeader } from "../PanelHeader";
import type { SceneDefinition } from "../scene";

/**
 * The right panel of a project with its organization open: the
 * "Organization" section lists Skills (3), Departments (2) opened to Growth
 * (2 agents) and Launch (1), Memory opened to its two graph links, Your Site
 * Integrations and MCPs. The "Project" (files) section sits collapsed below.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/RightProjectPanelView.swift:35-91 (header), :156-200
 *   (localProjectContent: Organization disclosure over a ScrollView capped
 *   at 300pt, Divider, Project disclosure);
 * - APP/Features/Organization/Views/OrganizationOverviewView.swift:229-261
 *   (section order in overview mode: Skills, Departments, Memory, then
 *   Integrations and MCPs, both Direct-only), :402-450 (Memory: "Open Org
 *   Knowledge Graph" `arrow.up.right.square` and "Open Routines Graph"
 *   `arrow.triangle.2.circlepath`, body, accent, leading 16 + 14), :455-469
 *   (Skills, `wand.and.stars`, count), :489-515 (Departments, `building.2`;
 *   each department a `folder` row at level 1, count = its agents);
 * - OrgSectionHeaderView.swift:11-60 (row), IntegrationsSectionView.swift:
 *   23-36 ("Your Site Integrations", `globe`), MCPSectionView.swift:42-60
 *   (MCPs, `puzzlepiece.extension`, count = enabled servers);
 * - row pieces in OrgTree.tsx; counts match org-mcp-section.
 *
 * Code vs plan:
 * - Memory opens to two links, not one: "Open Org Knowledge Graph" and
 *   "Open Routines Graph".
 * - As the plan notes, this panel lists no routines and no agents (agents
 *   only appear as a department's count). Routines live in the Routines
 *   panel (`ROV:229-233`, `.currentRoutines` mode only).
 *
 * Drawn at MAGNIFY × the app's points (same scale as project-explorer-tree).
 */

const PANEL_W = 346;
const MAGNIFY = 1.2;

function MemoryLink({ icon, label }: { icon: GlyphName; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--tu-accent)", fontSize: 13, lineHeight: "16px" }}>
      <Glyph name={icon} size={15} />
      {label}
    </span>
  );
}

function OrgPanelOverview() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, paddingBottom: 4 }}>
      <PanelHeader
        icon="folder"
        title="Project Explorer"
        trailing={
          <>
            <Button icon="folder.badge.plus" iconSize={15} variant="icon" />
            <Button icon="sidebar.right" iconSize={15} variant="icon" />
          </>
        }
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <PanelDisclosure icon="building.2" title="Organization" />
      <OrgSectionHeader count={3} icon="wand.and.stars" title="Skills" />
      <OrgSectionHeader count={2} expanded icon="building.2" title="Departments" />
      <OrgSectionHeader count={2} icon="folder" level={1} title="Growth" />
      <OrgSectionHeader count={1} icon="folder" level={1} title="Launch" />
      <OrgSectionHeader expanded icon="brain" title="Memory" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 8px 4px 30px" }}>
        <MemoryLink icon="arrow.up.forward.square" label="Open Org Knowledge Graph" />
        <MemoryLink icon="arrow.triangle.2.circlepath" label="Open Routines Graph" />
      </div>
      <OrgSectionHeader count={2} icon="globe" title="Your Site Integrations" />
      <OrgSectionHeader count={2} icon="puzzlepiece.extension" title="MCPs" />
      <div style={{ height: 1, background: "var(--tu-sep)", marginTop: 4 }} />
      <PanelDisclosure expanded={false} icon="folder" title="Project" />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "org-panel-overview",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label:
    "The right panel of a project. The Organization section is open: Skills (3); Departments (2), opened to Growth (2) and Launch (1); Memory, opened to Open Org Knowledge Graph and Open Routines Graph; Your Site Integrations (2); MCPs (2). Below it the Project files section is collapsed.",
  caption: "A project keeps its organization beside its files: skills, departments, memory and connections.",
  Component: OrgPanelOverview,
};
