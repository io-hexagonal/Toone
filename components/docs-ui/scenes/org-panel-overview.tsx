import { Button } from "../Button";
import { OrgSectionHeader, PanelDisclosure } from "../OrgTree";
import { PanelHeader } from "../PanelHeader";
import type { SceneDefinition } from "../scene";

/**
 * The right panel of a project with its organization open: the
 * "Organization" section lists Skills (3), Departments (2) opened to Growth
 * (2 agents) and Launch (1), Your Site Integrations and MCPs. The "Project" (files) section sits collapsed below.
 *
 * Drawn at MAGNIFY × the app's points (same scale as project-explorer-tree).
 */

const PANEL_W = 346;
const MAGNIFY = 1.2;

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
    "The right panel of a project. The Organization section is open: Skills (3); Departments (2), opened to Growth (2) and Launch (1); Your Site Integrations (2); MCPs (2). Below it the Project files section is collapsed.",
  caption: "A project keeps its organization beside its files: skills, departments and connections.",
  Component: OrgPanelOverview,
};
