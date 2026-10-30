import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { Tooltip } from "../Tooltip";
import { WorkspaceStrip } from "../WorkspaceStrip";

/**
 * Top-left corner of the left panel: the workspace (project) strip with
 * "acme.com growth" active, "acme.com" inactive, and the "+" hovered with its
 * help tag "Add Workspace (2/9)". Below the strip's separator the panel body
 * is left empty (the crop is about the strip).
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/WorkspaceStripView.swift:26-70 (strip: HStack 6, padding
 *   16/7, height 44), :74-86 ("+": plus 13 medium tertiary, .icon style,
 *   help "Add Workspace (count/max)"), :197-279 (pill);
 * - UI/Styles/ButtonStyles.swift:15-69 (IconButtonStyle hover fill);
 * - UI/Layout/LeftOrchestratorView.swift:727-734 (strip, then a separator,
 *   at the top of the left panel);
 * - maxWorkspaces = 9 (the help text's denominator).
 *
 * calibrate: the help tag is a native NSToolTip (drawn by components/docs-ui/
 * Tooltip.tsx) and AppKit puts it under the pointer; with no cursor in the
 * figure it sits just below the "+".
 */

const WIDTH = 440;
const HEIGHT = 84;

function WorkspaceStripAdd() {
  return (
    <div style={{ position: "relative", height: HEIGHT }}>
      <WorkspaceStrip
        add={{ hover: true }}
        addOverlay={<Tooltip style={{ top: 34, left: 10 }} text={`Add Workspace (2/9)`} />}
        pills={[
          { index: 1, name: DEMO.projects[0], active: true },
          { index: 2, name: DEMO.projects[1] },
        ]}
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "workspace-strip-add",
  width: WIDTH,
  radius: 24,
  label: `The project strip at the top of the left panel: project 1, ${DEMO.projects[0]}, is active, project 2, ${DEMO.projects[1]}, is next to it, and the pointer rests on the plus button, whose tooltip reads Add Workspace (2/9).`,
  caption: "The project strip at the top of the window. The + adds a project, up to nine.",
  Component: WorkspaceStripAdd,
};
