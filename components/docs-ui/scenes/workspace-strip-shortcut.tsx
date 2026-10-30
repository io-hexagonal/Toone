import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { Tooltip } from "../Tooltip";
import { WorkspaceStrip } from "../WorkspaceStrip";

/**
 * The project strip with three projects and the pointer resting on project
 * 2: its help tag names the shortcut that opens it, "⌥2 — acme.com". Every
 * pill carries its number in the small square badge.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/WorkspaceStripView.swift:197-249 (pill: index badge 18² r4,
 *   10pt black monospaced; hover fill hoverBackground × .5; close button
 *   while hovered when more than one project is open, :230-240), :277
 *   (help "⌥<index> — <name>");
 * - :26-86 (strip; "+" while fewer than nine projects),
 *   LeftOrchestratorView.swift:727-734 (strip, then a separator).
 *
 * Code vs plan: the plan asks for "no close" on the hovered pill. The app
 * shows the small close button on any hovered pill while more than one
 * project is open (:230), so it is drawn.
 *
 * calibrate: the help tag is a native NSToolTip (Tooltip.tsx) that AppKit
 * places under the pointer; with no cursor it sits just below the pill.
 */

const WIDTH = 440;
const HEIGHT = 84;

function WorkspaceStripShortcut() {
  const [growth, acme, launch] = DEMO.projects;
  return (
    <div style={{ position: "relative", height: HEIGHT }}>
      <WorkspaceStrip
        pills={[
          { index: 1, name: growth, active: true },
          {
            index: 2,
            name: acme,
            hover: true,
            overlay: <Tooltip style={{ top: 34, left: 4 }} text={`⌥2 — ${acme}`} />,
          },
          { index: 3, name: launch },
        ]}
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "workspace-strip-shortcut",
  width: WIDTH,
  radius: 24,
  label: `The project strip with three numbered projects: 1, ${DEMO.projects[0]}, is active; the pointer rests on 2, ${DEMO.projects[1]}, whose tooltip reads ⌥2 — ${DEMO.projects[1]}; 3 is ${DEMO.projects[2]}.`,
  caption: "Each project's number is its shortcut: Option and the number switches to it.",
  Component: WorkspaceStripShortcut,
};
