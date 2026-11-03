import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { WorkspaceStrip } from "../WorkspaceStrip";

/**
 * Top of the left panel with three projects open: project 1 active, project
 * 2 inactive, and the pointer resting on project 3, which shows its small
 * close button.
 *
 * Slimmed per the coverage audit (D6/D7 de-dup note): the help tag now
 * lives in `workspace-strip-shortcut` and the unread pulse in
 * `workspace-strip-unread`, which sit further down the same page; this
 * figure keeps the plain strip with the hover close button.
 */

const WIDTH = 440;
const HEIGHT = 56;

function WorkspaceStripStates() {
  const [growth, acme, launch] = DEMO.projects;
  return (
    <div style={{ position: "relative", height: HEIGHT }}>
      <WorkspaceStrip
        pills={[
          { index: 1, name: growth, active: true },
          { index: 2, name: acme },
          { index: 3, name: launch, hover: true },
        ]}
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "workspace-strip-states",
  width: WIDTH,
  radius: 24,
  label: `The project strip with three numbered projects: 1, ${DEMO.projects[0]}, is active; 2 is ${DEMO.projects[1]}; the pointer rests on 3, ${DEMO.projects[2]}, which shows a small close button. A plus button follows.`,
  caption: "Each open project gets a numbered pill in the strip at the top of the window.",
  Component: WorkspaceStripStates,
};
