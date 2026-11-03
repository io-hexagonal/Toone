import { ChecklistDock, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The setup checklist once setup is finished and the person chose "Run it
 * now": every row done, the green seal instead of the gauge.
 */

const WIDTH = 480;

const ROWS: ChecklistRow[] = [
  { label: `Goes into ${DEMO.agents.research.department}`, state: "done" },
  { label: "Added to your organization", state: "done" },
  { label: "Website address", state: "done" },
  { label: "Connect notion", state: "done" },
  { label: "Save and choose when to run", state: "done" },
];

function SetupChecklistFinished() {
  return (
    <div style={{ padding: 16 }}>
      <ChecklistDock expanded finished headline="Set up — first run started" rows={ROWS} title={DEMO.explore.routines[0]} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-checklist-finished",
  width: WIDTH,
  radius: 16,
  label: `The setup checklist for ${DEMO.explore.routines[0]}, headed "Set up — first run started", with a green seal. All five rows are done: Goes into ${DEMO.agents.research.department}, Added to your organization, Website address, Connect notion, Save and choose when to run.`,
  caption: "Setup is finished: every row is done and the first run has started.",
  Component: SetupChecklistFinished,
};
