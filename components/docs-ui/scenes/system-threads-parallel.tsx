import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { SystemThreadRow, SystemThreadsDestination } from "../ThreadRow";

/**
 * System Threads while one run of "Launch day" has two steps working at the
 * same time on two agents (Launch Planner, Growth Writer), after Research
 * Assistant finished the brief both build on.
 *
 * Sources: LeftOrchestratorView.swift:1259-1277 (destination), :1364-1444
 * (header), :3484-3560 (search + list); SystemThreadRow.swift:39-249;
 * ThreadsHoverButton.swift:187-330 (title "<routine> #N · <step>", status,
 * time); RoutineExecution.swift:1360-1371 (a step thread's title is
 * "<routine> · <step>"); ThreadActivityState.swift:35-47, 218-224, 252-295;
 * Message.swift:947-975 (live activity labels).
 *
 * Code vs plan:
 * - A working thread's status is its live activity (the current tool label,
 *   e.g. "Fetching webpage", ThreadActivityState.workSummary), never the word
 *   "Working": SystemThreadRowText.status shows the lifecycle label only for
 *   finished threads ("Completed").
 * - The plan's third row ("routine #3 · Organize the findings", Completed)
 *   would contradict Run #3 being on step 2 elsewhere in the guides; here the
 *   completed row is the step that fed both parallel steps.
 * - A finished thread's time is RelativeDateTimeFormatter .full ("4 minutes
 *   ago"); a running one reads "Running 1m 12s" (elapsedLabel).
 *
 * Drawn at MAGNIFY × the app's points so caption2 text stays ≥11px at the
 * guide column. Calibrate: the left panel's width (360 here) and the
 * Color.secondary @0.06 row fill.
 */

const PANEL_W = 360;
const MAGNIFY = 1.15;
const L = DEMO.launchRoutine;

function SystemThreadsParallel() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <SystemThreadsDestination>
        <SystemThreadRow
          agent={DEMO.agents.launch.name}
          canStop
          dot="processing"
          preview="Checking each launch site's listing requirements."
          routine={L.name}
          runNumber={L.run}
          status="Fetching webpage"
          step={L.steps[1]}
          time="Running 1m 12s"
        />
        <SystemThreadRow
          agent={DEMO.agents.writer.name}
          canStop
          dot="processing"
          preview="Drafting the launch thread from the brief."
          routine={L.name}
          runNumber={L.run}
          status="Writing file"
          step={L.steps[2]}
          time="Running 48s"
        />
        <SystemThreadRow
          agent={DEMO.agents.research.name}
          dot="seen"
          preview="The launch brief is ready for the next steps."
          routine={L.name}
          runNumber={L.run}
          status="Completed"
          step={L.steps[0]}
          time="4 minutes ago"
        />
      </SystemThreadsDestination>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "system-threads-parallel",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `System Threads list during run ${L.run} of ${L.name}. ${DEMO.agents.launch.name} is fetching a webpage for ${L.steps[1]}, running 1 minute 12 seconds, while ${DEMO.agents.writer.name} writes a file for ${L.steps[2]}, running 48 seconds; both rows have a stop control. Below, ${DEMO.agents.research.name}'s ${L.steps[0]} is completed.`,
  caption: "Two agents work on the same run at once, each in its own system thread, after a third finished the brief they share.",
  Component: SystemThreadsParallel,
};
