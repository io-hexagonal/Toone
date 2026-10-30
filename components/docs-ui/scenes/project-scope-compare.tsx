import { AgentRow, AgentSectionHeader, AgentsDestination, type AgentRowSpec } from "../AgentRow";
import { DEMO } from "../demo";
import { NavRail } from "../NavRail";
import type { SceneDefinition } from "../scene";
import { WorkspaceStrip } from "../WorkspaceStrip";

/**
 * Two ways to scope a project, side by side: two crops of the top of the
 * left panel, each labelled. Left, a focused project ("acme.com growth")
 * whose Agents list holds only Growth agents; right, a general project
 * ("acme.com") whose agents span Growth, Launch and Support.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/LeftOrchestratorView.swift:727-734 (WorkspaceStripView +
 *   separator, shown whenever multi-project is on, even with one project:
 *   WorkspaceManager.isMultiOrgEnabled is a setting), :891-929 (rail + 1pt
 *   divider + destination), :1089-1164 (Agents destination: header, search,
 *   roster), :4699-4764 / :4521-4541 / :4825-4990 (roster sections and rows).
 * - APP/UI/Layout/WorkspaceStripView.swift:13-113, :197-279 (strip, pill).
 * - Kit: WorkspaceStrip.tsx (P4), NavRail.tsx (P3), AgentRow.tsx (P8).
 *
 * Code vs spec:
 * - Each crop shows one project in the strip (pill 1, active): the two
 *   shapes are alternatives, not two projects open at once.
 * - The roster groups agents by the day you last talked to them, never by
 *   department, so the department shows on each card's second line. With
 *   no open threads every card reads "No thread messages yet".
 * - "Support Assistant" (Support) is not in plan §0.4; it was added to
 *   demo.ts as DEMO.supportAgent for this figure's general project.
 * - The crops end above the "Create agent" bar at the bottom of the panel.
 *
 * Each crop is drawn at ZOOM × the app's points so the 10pt department
 * line stays legible in a half-width column.
 */

const PAD = 12;
const GAP = 12;
const FIGURE_W = 640;
const COLUMN_W = (FIGURE_W - PAD * 2 - GAP) / 2; // 302
const CROP_INNER_W = COLUMN_W - 2; // inside the 1px stroke
const PANEL_W = 272;
const PANEL_H = 392;
const ZOOM = CROP_INNER_W / PANEL_W;

function PanelCrop({ project, agents }: { project: string; agents: AgentRowSpec[] }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          zoom: ZOOM,
          width: PANEL_W,
          height: PANEL_H,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <WorkspaceStrip pills={[{ index: 1, name: project, active: true }]} />
        <div style={{ height: 1, flex: "none", background: "var(--tu-sep)" }} />
        <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex" }}>
          <NavRail selected="agents" style={{ overflow: "hidden" }} />
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <AgentsDestination bottomBar={false}>
              <AgentSectionHeader title="Today" />
              {agents.map((agent) => (
                <AgentRow agent={agent} key={agent.name} />
              ))}
            </AgentsDestination>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ shape, project, agents }: { shape: string; project: string; agents: AgentRowSpec[] }) {
  return (
    <div style={{ width: COLUMN_W, display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ padding: "0 4px", fontSize: 12, lineHeight: "15px", whiteSpace: "nowrap" }}>
        <span style={{ color: "var(--tu-text-2)" }}>{shape}: </span>
        <span style={{ color: "var(--tu-text-1)", fontWeight: 600 }}>{project}</span>
      </span>
      <PanelCrop agents={agents} project={project} />
    </div>
  );
}

function ProjectScopeCompare() {
  const [focused, general] = DEMO.projects;
  const { research, launch, writer } = DEMO.agents;
  return (
    <div style={{ display: "flex", gap: GAP, padding: PAD }}>
      <Column
        agents={[
          { name: research.name, department: research.department },
          { name: writer.name, department: writer.department },
        ]}
        project={focused}
        shape="Focused"
      />
      <Column
        agents={[
          { name: research.name, department: research.department },
          { name: launch.name, department: launch.department },
          { name: DEMO.supportAgent.name, department: DEMO.supportAgent.department },
        ]}
        project={general}
        shape="General"
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "project-scope-compare",
  width: FIGURE_W,
  radius: 16,
  label: `Two crops of the left panel side by side. Left, labelled Focused: ${DEMO.projects[0]}. The project strip shows ${DEMO.projects[0]} active, and the Agents list holds ${DEMO.agents.research.name} and ${DEMO.agents.writer.name}, both in ${DEMO.agents.research.department}. Right, labelled General: ${DEMO.projects[1]}. The strip shows ${DEMO.projects[1]} active, and the Agents list holds ${DEMO.agents.research.name} (${DEMO.agents.research.department}), ${DEMO.agents.launch.name} (${DEMO.agents.launch.department}) and ${DEMO.supportAgent.name} (${DEMO.supportAgent.department}).`,
  caption: "A focused project keeps one area's agents together; a general one holds agents from several areas.",
  Component: ProjectScopeCompare,
};
