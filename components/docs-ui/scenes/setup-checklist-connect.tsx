import { ChecklistDock, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The setup checklist of an Explore routine, docked above the message box,
 * expanded, with one tool still to connect.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - dock: P11 ChecklistDock (ConversationalSession/ConversationChecklist.swift:64-283);
 *   placement APP/Features/Chat/Views/ChatPanelView.swift:1343-1352 (padding 16 / top 8);
 * - rows, headline, action: APP/Core/Services/AgentSession/AgentSessionManager+Setup.swift:190-237;
 * - contract + copy: APP/Features/WorkflowCatalog/ConversationalSetup/SetupSession.swift:111,233-253.
 *
 * Code vs plan (§1, setup-checklist-connect), the code wins:
 * - A missing connection is contract state `.missing` with source "person",
 *   so its row is WAITING (accent `questionmark.circle.fill`), not attention.
 *   Only `.blocked` items are attention, and connections are never blocked.
 * - With no attention row the headline is "Setting it up", not "Needs your
 *   attention".
 * - "Save and choose when to run" is also person-sourced → waiting, not pending.
 * - The checklist title is `session.title` (the routine's display title);
 *   "Set up · …" is the thread name, not the dock's title.
 * - A connection's name is its MCP catalog id (`name: id`), so the row reads
 *   "Connect notion" in lower case. Figma is not in the MCP catalog; Notion is.
 * - The real Launch Surface Preparation needs no extra connection (only the
 *   built-in browser MCPs, which are skipped); the connection row is
 *   illustrative, as the plan intends.
 * - The catalog entry has no `cover_image_data_url`, so the header shows the
 *   app's `photo` placeholder (CALIBRATE against a capture).
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
