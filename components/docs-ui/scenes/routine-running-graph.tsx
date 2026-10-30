import { DEMO } from "../demo";
import { GraphCanvas } from "../graph/GraphCanvas";
import { FocusStrip, GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { ID, researchBriefGraph } from "../graph/researchBrief";
import type { SceneDefinition } from "../scene";

/**
 * Published routine graph during Run #3, step 2 selected. Viewport: pinch
 * zoom 1.12 (card text ≥11px in the guide column), centred on step 2 … the
 * sub-routine column so step 1 and step 4 sit wholly off-frame (at zoom 1
 * the 616px canvas is 16px too wide to hide both, so one would be sliced). Toolbar ends on
 * "Run setup": at 640px the app's ScrollView would clip "Artefacts" mid-word.
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
const CANVAS_H = 184;
const ZOOM = 1.12;

const graph = researchBriefGraph({
  showInputs: false,
  showArtefacts: false,
  runState: { [ID.routine]: "running", [ID.step(2)]: "running", [ID.subRoutine]: "running" },
});

const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
const step2 = node(ID.step(2));
const sub = node(ID.subRoutine);
const step3 = node(ID.step(3));
// Centre step 2 … sub-routine horizontally, step 3 / sub-routine vertically.
const PAN = {
  x: -(((step2.x - step2.w / 2) + (sub.x + sub.w / 2)) / 2) * ZOOM,
  y: -((step3.y + sub.y) / 2) * ZOOM,
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
            clipAfter="runSetup"
          />
        }
      >
        <GraphCanvas
          graph={graph}
          height={CANVAS_H}
          pan={PAN}
          selectedId={ID.step(2)}
          width={CANVAS_W}
          zoom={ZOOM}
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
