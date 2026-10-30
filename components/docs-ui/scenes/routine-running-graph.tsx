import { DEMO } from "../demo";
import { GraphCanvas } from "../graph/GraphCanvas";
import { FocusStrip, GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { ID, researchBriefGraph } from "../graph/researchBrief";
import type { SceneDefinition } from "../scene";

/**
 * Published routine graph during Run #3, step 2 selected (zoom 1, as after
 * "Focus selection", panned a little so the sub-routine fits).
 *
 * Runtime state as RoutineDraftRuntimePresentation builds it: the routine
 * node, the running step and the live sub-routine are `running` (it never
 * marks anything completed, so step 1 has no green rim). The selected step's
 * border and wash use the accent (selection wins over the live colour,
 * RoutinePipelineGraphComponents.swift:402-405); its RUNNING badge keeps the
 * running colour. Sources: RoutineDraftPipelineView.swift:78-97 (focus strip),
 * :240-282 (status chip); RoutinePipelineGraphComponents.swift:318-347, 461-542.
 */

const WIDTH = 640;
const INSET = 12;
const CANVAS_W = WIDTH - INSET * 2;
const CANVAS_H = 196;

const graph = researchBriefGraph({
  showInputs: false,
  showArtefacts: false,
  runState: { [ID.routine]: "running", [ID.step(2)]: "running", [ID.subRoutine]: "running" },
});

const sub = graph.nodes.find((n) => n.id === ID.subRoutine)!;
const step3 = graph.nodes.find((n) => n.id === ID.step(3))!;
// Keep the step-3 / sub-routine column fully in view (14px air on the right).
const PAN = {
  x: CANVAS_W / 2 - (sub.x + sub.w / 2) - 14,
  y: -(step3.y + sub.y) / 2,
};

function RoutineRunningGraph() {
  return (
    <div style={{ padding: INSET }}>
      <GraphContainer
        footer={<FocusStrip label={`2. ${DEMO.subRoutine.name}`} />}
        toolbar={
          <GraphToolbar
            chips={{ runSetup: false, artefacts: false, steps: true }}
            hasSelection
            published
            status={{ summary: `Running · ${DEMO.subRoutine.name}` }}
            summary={pipelineSummary({ steps: 4, subRoutines: 1, runValues: 1, resources: 0, artefacts: 1 })}
          />
        }
      >
        <GraphCanvas
          graph={graph}
          height={CANVAS_H}
          pan={PAN}
          selectedId={ID.step(2)}
          width={CANVAS_W}
          zoom={1}
        />
      </GraphContainer>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "routine-running-graph",
  width: WIDTH,
  radius: 16,
  label: `Routine pipeline graph during run ${DEMO.run.number} of ${DEMO.routine.name}. The status chip reads Running, ${DEMO.subRoutine.name}. Step 2 is selected and lit with a RUNNING badge, its sub-routine card is running too, and a Focus thread button sits under the graph.`,
  caption: "A run in progress: the running step and its sub-routine light up; select a step and choose Focus thread to open its agent's conversation.",
  Component: RoutineRunningGraph,
};
