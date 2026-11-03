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
