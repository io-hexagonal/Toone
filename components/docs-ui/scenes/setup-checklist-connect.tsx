import { ChecklistDock, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The setup checklist of an Explore routine, docked above the message box,
 * expanded, with one tool still to connect.
 */

const WIDTH = 480;

const ROWS: ChecklistRow[] = [
  { label: `Goes into ${DEMO.agents.research.department}`, state: "done" },
  { label: "Added to your organization", state: "done" },
  { label: "Website address", state: "done" },
  { label: "Connect notion", state: "waiting", detail: "notion needs to be connected in Settings." },
  { label: "Save and choose when to run", state: "waiting" },
];

function SetupChecklistConnect() {
  return (
    <div style={{ padding: "16px 16px" }}>
      <ChecklistDock
        actions={[{ label: "Check connections again" }]}
        expanded
        headline="Setting it up"
        rows={ROWS}
        title={DEMO.explore.routines[0]}
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-checklist-connect",
  width: WIDTH,
  radius: 16,
  label: `Setup checklist for ${DEMO.explore.routines[0]}, expanded, 3 of 5 done: Goes into ${DEMO.agents.research.department}, Added to your organization and Website address are done; Connect notion is waiting, with the note "notion needs to be connected in Settings."; Save and choose when to run is waiting. A Check connections again button is at the bottom.`,
  caption: "The setup checklist lists what is left. Connect the tool in Settings, then check the connections again.",
  Component: SetupChecklistConnect,
};
