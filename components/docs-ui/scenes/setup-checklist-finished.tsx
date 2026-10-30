import { ChecklistDock, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The setup checklist once setup is finished and the person chose "Run it
 * now": every row done, the green seal instead of the gauge.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - dock: P11 ChecklistDock (ConversationalSession/ConversationChecklist.swift:64-145;
 *   finished → `checkmark.seal.fill` in success, :125-127);
 * - headline "Set up — first run started" (runChoice .now) and rows:
 *   APP/Core/Services/AgentSession/AgentSessionManager+Setup.swift:192-235;
 * - contract (every item ready once finished, "finish" included):
 *   APP/Features/WorkflowCatalog/ConversationalSetup/SetupSession.swift:233-253.
 *
 * Code vs plan (coverage audit C3), the code wins:
 * - Rows match the page's earlier setup-checklist-connect: "Goes into
 *   Growth" and "Connect notion" (a connection row is named by its MCP
 *   catalog id; Figma is not in the catalog), not "Launch" / "Connect Figma".
 * - No action: "Check connections again" only shows while a connection is
 *   not ready (AgentSessionManager+Setup.swift:226-231).
 * - Expanded by choice: once finished nothing waits for the person
 *   (`needsPerson` false), so the dock folds itself unless it was opened by
 *   clicking its header (ConversationChecklist.swift:70-71). It is drawn
 *   open so the finished rows show.
 * - The catalog entry has no cover, so the header keeps the `photo`
 *   placeholder (as in setup-checklist-connect).
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
