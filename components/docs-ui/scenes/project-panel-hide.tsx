import { Button } from "../Button";
import { PanelHeader } from "../PanelHeader";
import { DisclosureHeader } from "../ProjectExplorer";
import type { SceneDefinition } from "../scene";
import { Tooltip } from "../Tooltip";

/**
 * Top of the right panel (Project Explorer) with the pointer on the
 * `sidebar.right` button at the end of its header: the button takes the
 * icon-button hover fill and its help tag reads "Hide Project Panel".
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/RightProjectPanelView.swift:35-91 (PanelHeader "Project
 *   Explorer", `folder`; `folder.badge.plus` "Change Project Directory";
 *   `sidebar.right` posting .toggleProjectPanel, help "Hide Project Panel"
 *   :84), :156-200 (Organization and Project disclosures below);
 * - UI/Styles/ButtonStyles.swift:15-69 (icon button hover white .10);
 * - the left panel's counterpart: LeftOrchestratorView.swift:1391-1403
 *   (`sidebar.right` "Toggle Project Panel" in every destination header).
 * - Same header as project-explorer-tree.
 *
 * Code vs plan: the plan also lists `square.and.arrow.up` (Export
 * Project…). That button exists only in the App Store build, and only for
 * projects Toone keeps its own copy of (:53-72); the Direct build the
 * guides describe shows `folder.badge.plus` and `sidebar.right`, drawn here.
 *
 * calibrate: the help tag is a native NSToolTip (Tooltip.tsx); AppKit keeps
 * it on screen, so near the panel's right edge it sits right-aligned under
 * the button. Drawn at MAGNIFY × the app's points.
 */

const PANEL_W = 346; // project panel = 24% of a 1440pt screen (FloatingPanel.swift:47)
const MAGNIFY = 1.2;

function ProjectPanelHide() {
  return (
    <div style={{ zoom: MAGNIFY, position: "relative", width: PANEL_W, paddingBottom: 6 }}>
      <PanelHeader
        icon="folder"
        title="Project Explorer"
        trailing={
          <>
            <Button icon="folder.badge.plus" iconSize={15} variant="icon" />
            <Button icon="sidebar.right" iconSize={15} state="hover" variant="icon" />
          </>
        }
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <DisclosureHeader expanded={false} icon="building.2" title="Organization" />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <DisclosureHeader expanded={false} icon="folder" title="Project" />
      <Tooltip style={{ top: 40, right: 8 }} text="Hide Project Panel" />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "project-panel-hide",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label:
    "The Project Explorer header with two buttons on the right: Change Project Directory and a sidebar button. The pointer rests on the sidebar button, whose tooltip reads Hide Project Panel.",
  caption: "The sidebar button at the end of the Project Explorer header hides the panel.",
  Component: ProjectPanelHide,
};
