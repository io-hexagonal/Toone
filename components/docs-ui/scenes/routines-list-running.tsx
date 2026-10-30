import { DEMO } from "../demo";
import {
  RoutineControlsRow,
  RoutineFamilyCard,
  RoutineHistoryHeader,
  RoutineList,
  RoutineRow,
  RoutineScrollArea,
  RoutineSectionHeading,
  RoutineSidebar,
  RoutineSidebarSwitcher,
  RunRow,
} from "../RoutineSidebar";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel's sidebar, Routines tab, while Run #3 of the demo
 * routine runs: the "Running" section holds its family card, expanded (the
 * sub-routine, then the execution history), with Run #3's row expanded too
 * (its step list). Two idle routines follow under "Routines".
 *
 * Sources: RoutineCreatorPanelView.swift:482-561 (column + switcher);
 * OrganizationOverviewView.swift:666-771 (sections, controls row),
 * :1010-1150 (family card, history, run row inputs), :1255-1270 (no run
 * button in the Routines panel), :1304-1360 (row model: Running pill = accent,
 * dot on while running, sub count, history count); RoutineSidebarComponents.swift;
 * RoutineRunHistoryRowView.swift:57-304; RoutineRunHistoryRow.swift:207-330
 * (summary, age and meta strings); RoutineRunControlsView.swift:205-250.
 *
 * Code vs plan:
 * - The run row's second line is the run's boundary label without the phase
 *   its pill restates: the checkpoint label is "<step title> · running"
 *   (AgentSessionManager.swift:4876), so it reads "Investigate a topic", not
 *   "Investigating: <topic>".
 * - The routine row shows the stage nowhere; the stage is on the run row
 *   (summary) and in the expanded run's step list (plan verification item 10).
 * - Expanding the routine also lists its sub-routine inside the card, and the
 *   history lists every recent run (up to 5 sealed), so Runs #2 and #1 appear
 *   under Run #3. A sub-routine never appears as its own row under
 *   "Routines" (ROV visibleMainRoutines), so the plan's idle "Investigate a
 *   topic" row is replaced by another main routine.
 * - The routine is not selected, so Run #3 keeps its compact run controls
 *   (Pause, empty Continue slot, Cancel) on its meta line (ROV:1048-1050).
 * - No sub-routine count ("⑂ 1") on the running row: the row's trailing info
 *   is a ViewThatFits (RSC:500-515) that drops the count before the name
 *   truncates, and "Produce a research brief" + the Running pill + the
 *   history count already overflow the sidebar's max width (320, used here).
 *
 * Drawn at MAGNIFY × the app's points so the 10pt caption text stays ≥11px
 * at the guide column; everything inside keeps the app's proportions.
 * Calibrate: column width (320 = max; 285 is the ideal), the stop.fill tint (a destructive
 * borderless button may draw red), glyph weights.
 */

const SIDEBAR_W = 320;
const MAGNIFY = 1.15;

function RoutinesListRunning() {
  const steps = DEMO.routine.steps;
  return (
    <div style={{ zoom: MAGNIFY, width: SIDEBAR_W }}>
      <RoutineSidebar width={SIDEBAR_W}>
        <RoutineSidebarSwitcher selected="Routines" />
        <RoutineScrollArea>
          <RoutineControlsRow placeholder="Search routines" />
          <RoutineList>
            <RoutineSectionHeading count={1} kind="running" title="Running" />
            <RoutineFamilyCard>
              <RoutineRow
                expanded
                historyCount={DEMO.run.number}
                isOn
                name={DEMO.routine.name}
                pill={{ label: "Running", tone: "accent" }}
              />
              <RoutineRow isSub level={1} name={DEMO.subRoutine.name} />
              <RoutineHistoryHeader />
              <RunRow
                age={DEMO.run.started}
                controls={{ canPause: true, canContinue: false, canCancel: true }}
                expanded
                meta="Manual · running 2 min"
                number={DEMO.run.number}
                pill={{ label: "Running", tone: "accent" }}
                stages={[
                  { title: steps[0], phase: "succeeded" },
                  { title: steps[1], phase: "running" },
                  { title: steps[2], phase: "pending" },
                  { title: steps[3], phase: "pending" },
                ]}
                summary={steps[1]}
              />
              <RunRow
                age="1 d ago"
                meta="Manual · ran 6 min 40 s"
                number={2}
                pill={{ label: "Completed", tone: "success" }}
              />
              <RunRow
                age="2 d ago"
                meta="Manual · ran 7 min 12 s"
                number={1}
                pill={{ label: "Completed", tone: "success" }}
              />
            </RoutineFamilyCard>
            <RoutineSectionHeading count={2} style={{ marginTop: 8 }} title="Routines" />
            <RoutineFamilyCard>
              <RoutineRow
                expanded={false}
                historyCount={6}
                isOn
                name={DEMO.otherRoutines.digest.name}
                pill={{ label: DEMO.otherRoutines.digest.cadence, tone: "neutral" }}
              />
            </RoutineFamilyCard>
            <RoutineFamilyCard>
              <RoutineRow
                expanded={false}
                historyCount={0}
                name={DEMO.otherRoutines.launchSites.name}
                pill={{ label: DEMO.otherRoutines.launchSites.cadence, tone: "neutral" }}
              />
            </RoutineFamilyCard>
          </RoutineList>
        </RoutineScrollArea>
      </RoutineSidebar>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "routines-list-running",
  width: Math.round(SIDEBAR_W * MAGNIFY),
  radius: 16,
  label: `Routines sidebar with the Routines tab selected. Under Running, ${DEMO.routine.name} shows a green dot, a Running pill and a history count of ${DEMO.run.number}. Expanded, it lists its sub-routine ${DEMO.subRoutine.name} and its execution history: Run ${DEMO.run.number}, Running, started ${DEMO.run.started}, now on ${DEMO.routine.steps[1]}, with step 1 succeeded, step 2 running and steps 3 and 4 pending; Runs 2 and 1 completed. Two idle routines follow under Routines.`,
  caption: "Running routines sit at the top of the list. Expand one to see its run and the step it is on.",
  Component: RoutinesListRunning,
};
