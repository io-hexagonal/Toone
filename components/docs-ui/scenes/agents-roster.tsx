import { AgentRow, AgentSectionHeader, AgentsDestination } from "../AgentRow";
import { DEMO } from "../demo";
import { NavRail } from "../NavRail";
import type { SceneDefinition } from "../scene";

/**
 * The left panel on Agents with three agents, each with its own department:
 * Research Assistant and Launch Planner talked to today (each with one open
 * thread), Growth Writer yesterday. The populated twin of `agents-empty`
 * (same rail, header and "Create agent" bar).
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/LeftOrchestratorView.swift:1089-1164 (agentsDestination),
 *   :4699-4764 (roster grouped by the day you last talked to each agent,
 *   newest first), :4453-4470 (section titles), :4521-4541 (section
 *   header), :4825-4990 (AgentRow + the "New Thread" plus);
 * - APP/UI/Components/AgentActivityIcon.swift:115-191 (card label), :55-104
 *   (avatar + status ring);
 * - rail: P3 NavRail (Agents selected). Pieces in AgentRow.tsx.
 *
 * Code vs plan:
 * - The plan writes each row as "Research Assistant · Growth". The card
 *   stacks the name, then the department on its own line, then the last
 *   message ("<author>: <first line>").
 * - The plan's "one activity dot": the roster has no dot. Activity lives on
 *   the avatar (an animated body; a ring for completed / attention /
 *   failed) and in the open-thread count. Research Assistant carries the
 *   green "completed" ring (a reply you have not opened yet).
 * - The plan puts all three under "Today". Sections follow the last human
 *   interaction per agent; Growth Writer is drawn under "Yesterday" to show
 *   the grouping. An agent with no open thread reads "No thread messages
 *   yet" even when you talked to it before (the preview comes from live
 *   threads only, :4993-5013).
 * - Avatars are one static blob with cut-out eyes in the theme accent
 *   (AgentBlobView is an animated mesh, plan §5.4).
 *
 * CALIBRATE: the borderedProminent bezel and the .ultraThinMaterial bar (as
 * in agents-empty). Drawn at MAGNIFY × the app's points (caption text stays
 * legible).
 */

const PANEL_W = 380;
const HEIGHT = 446;
const MAGNIFY = 1.15;

function AgentsRoster() {
  const { research, launch, writer } = DEMO.agents;
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, height: HEIGHT, display: "flex" }}>
      <NavRail selected="agents" />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <AgentsDestination>
          <AgentSectionHeader title="Today" />
          <AgentRow
            agent={{
              name: research.name,
              department: research.department,
              preview: `${research.name}: ${DEMO.spotlightChat.agent}`,
              activity: "completed",
              threads: 1,
            }}
          />
          <AgentRow
            agent={{
              name: launch.name,
              department: launch.department,
              preview: "You: Draft the launch week plan.",
              threads: 1,
            }}
          />
          <AgentSectionHeader title="Yesterday" />
          <AgentRow agent={{ name: writer.name, department: writer.department }} />
        </AgentsDestination>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "agents-roster",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The left panel on Agents. Under Today: ${DEMO.agents.research.name}, department ${DEMO.agents.research.department}, with one open thread and a green ring for an unread reply; ${DEMO.agents.launch.name}, department ${DEMO.agents.launch.department}, with one open thread. Under Yesterday: ${DEMO.agents.writer.name}, department ${DEMO.agents.writer.department}. A Create agent button sits at the bottom.`,
  caption: "Each agent has one role and one department. The roster lists them by when you last worked with them.",
  Component: AgentsRoster,
};
