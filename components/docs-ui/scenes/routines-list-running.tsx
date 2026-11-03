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
