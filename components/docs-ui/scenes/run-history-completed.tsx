import { DEMO } from "../demo";
import {
  RoutineControlsRow,
  RoutineFamilyCard,
  RoutineHistoryHeader,
  RoutineList,
  RoutineRow,
  RoutineScrollArea,
  RoutineSidebar,
  RoutineSidebarSwitcher,
  RunRow,
} from "../RoutineSidebar";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel's sidebar, Routines tab, after Run #3 finished: the
 * demo routine's family card is expanded (its sub-routine, then "Execution
 * history"), and Run #3's row is expanded: Completed, every step
 * succeeded, then "Restart from a step…" and "Edit routine". Runs #2 and #1
 * stay collapsed. The scheduled digest sits first, the launch routine last.
 *
 * Drawn at MAGNIFY × the app's points (10pt captions ≥11px at the guide
 * column), like routines-list-running. Calibrate: as routines-list-running.
 */

const SIDEBAR_W = 320;
const MAGNIFY = 1.15;

function RunHistoryCompleted() {
  const steps = DEMO.routine.steps;
  return (
    <div style={{ zoom: MAGNIFY, width: SIDEBAR_W }}>
      <RoutineSidebar width={SIDEBAR_W}>
        <RoutineSidebarSwitcher selected="Routines" />
        <RoutineScrollArea>
          <RoutineControlsRow placeholder="Search routines" />
          <RoutineList>
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
                expanded
                historyCount={DEMO.run.number}
                name={DEMO.routine.name}
                pill={{ label: "On demand", tone: "neutral" }}
              />
              <RoutineRow isSub level={1} name={DEMO.subRoutine.name} />
              <RoutineHistoryHeader />
              <RunRow
                actions
                age="9 min ago"
                expanded
                meta="Manual · ran 6 min 52 s"
                number={DEMO.run.number}
                pill={{ label: "Completed", tone: "success" }}
                stages={steps.map((title) => ({ title, phase: "succeeded" as const }))}
              />
              <RunRow age="1 d ago" meta="Manual · ran 6 min 40 s" number={2} pill={{ label: "Completed", tone: "success" }} />
              <RunRow age="2 d ago" meta="Manual · ran 7 min 12 s" number={1} pill={{ label: "Completed", tone: "success" }} />
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
  id: "run-history-completed",
  width: Math.round(SIDEBAR_W * MAGNIFY),
  radius: 16,
  label: `Routines sidebar, Routines tab. ${DEMO.routine.name} is expanded to its execution history: Run ${DEMO.run.number}, Completed 9 minutes ago after 6 min 52 s, with all four steps succeeded and the actions Restart from a step and Edit routine. Runs 2 and 1 also completed.`,
  caption: "Every run stays in the routine's execution history. Expand one to see how each step ended.",
  Component: RunHistoryCompleted,
};
