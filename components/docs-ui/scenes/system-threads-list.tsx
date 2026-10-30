import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { SystemThreadRow, SystemThreadsDestination } from "../ThreadRow";

/**
 * System Threads during Run #3 of the demo routine: the sub-routine's step
 * working, the parent step that started it waiting on it, and the finished
 * first step. The pointer rests on the first row's stop control, which turns
 * red (the row takes the hover fill).
 *
 * Sources: as system-threads-parallel (LeftOrchestratorView.swift:1259-1277,
 * 1364-1444, 3484-3560; SystemThreadRow.swift:39-249, stop :223-236;
 * ThreadsHoverButton.swift:187-330; ThreadActivityState.swift:252-295).
 *
 * Code vs plan:
 * - "Waiting for agents" is the lifecycle label; an active row shows its
 *   work summary instead, which for a thread waiting on one child reads
 *   "Waiting for 1 child agent" (ThreadActivityState.swift:280-283).
 *   Calibrate: that a step invoking a sub-routine reports its child this way.
 * - A step thread's title names the routine that owns the step: the
 *   sub-routine's own step reads "Investigate a topic #3 · Gather sources".
 *
 * Drawn at MAGNIFY × the app's points (caption2 ≥11px at the guide column).
 */

const PANEL_W = 360;
const MAGNIFY = 1.15;

function SystemThreadsList() {
  const research = DEMO.agents.research.name;
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <SystemThreadsDestination>
        <SystemThreadRow
          agent={research}
          canStop
          dot="processing"
          preview="Comparing the pricing pages of acme.com and two competitors."
          routine={DEMO.subRoutine.name}
          runNumber={DEMO.run.number}
          state="hover"
          status="Searching web"
          step={DEMO.subRoutine.steps[0]}
          stopHovered
          time="Running 1m 12s"
        />
        <SystemThreadRow
          agent={research}
          canStop
          dot="processing"
          preview={`Started ${DEMO.subRoutine.name} for the topic.`}
          routine={DEMO.routine.name}
          runNumber={DEMO.run.number}
          status="Waiting for 1 child agent"
          step={DEMO.routine.steps[1]}
          time="Running 1m 40s"
        />
        <SystemThreadRow
          agent={research}
          dot="seen"
          preview={`Topic: ${DEMO.run.topic}.`}
          routine={DEMO.routine.name}
          runNumber={DEMO.run.number}
          status="Completed"
          step={DEMO.routine.steps[0]}
          time="2 minutes ago"
        />
      </SystemThreadsDestination>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "system-threads-list",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `System Threads list with a search field and three threads of run ${DEMO.run.number}: ${DEMO.subRoutine.steps[0]} is searching the web, with the pointer on its stop control, shown red; ${DEMO.routine.steps[1]} is waiting for 1 child agent; ${DEMO.routine.steps[0]} is completed. Each row names ${DEMO.agents.research.name}.`,
  caption: "System Threads lists automated work by agent and state; every active thread keeps a stop control.",
  Component: SystemThreadsList,
};
