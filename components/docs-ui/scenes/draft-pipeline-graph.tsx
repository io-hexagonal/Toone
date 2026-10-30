import { DEMO } from "../demo";
import { GraphCanvas } from "../graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { ID, researchBriefGraph } from "../graph/researchBrief";
import type { SceneDefinition } from "../scene";

/**
 * Routine Creator draft graph, Steps + Run setup chips on, nothing selected.
 * Sources: RoutineDraftPipelineView.swift:56-231 (container, toolbar),
 * RoutinePipelineGraphComponents.swift (cards, edges),
 * RoutineDraftGraphBuilder.swift (nodes/edges), RoutinePipelineLayoutEngine +
 * SugiyamaCore (layout).
 *
 * Crop: a pinch-zoomed state (zoom 1.12, so card text stays ≥11px at the
 * guide column's 0.99 scale) centred on step 2 → step 3 + the sub-routine
 * column. The whole pipeline is 1170pt wide; showing input + routine → steps 1-3 + sub-routine needs ≈930pt of
 * model space, i.e. zoom ≤ 0.66 (≈6.5px text) in a 640px figure. So the
 * input, routine and step 1 sit off-frame left (their edge enters from the
 * left), step 4 off-frame right; no card is cut.
 *
 * Toolbar: at 640px the app's horizontal ScrollView would clip "Focus
 * selection" mid-word; the figure ends on the fit button instead (it is
 * disabled with nothing selected anyway).
 */

const WIDTH = 640;
const INSET = 12; // panel padding around the graph container
const CANVAS_W = WIDTH - INSET * 2;
const CANVAS_H = 176;
const ZOOM = 1.12;

const graph = researchBriefGraph({ showInputs: true, showArtefacts: false });

const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
const step2 = node(ID.step(2));
const sub = node(ID.subRoutine);
// Centre the step 2 … sub-routine span horizontally and the graph vertically.
const PAN = {
  x: -(((step2.x - step2.w / 2) + (sub.x + sub.w / 2)) / 2) * ZOOM,
  y: 0,
};

function DraftPipelineGraph() {
  return (
    <div style={{ padding: INSET }}>
      <GraphContainer
        toolbar={
          <GraphToolbar
            chips={{ runSetup: true, artefacts: false, steps: true }}
            hasSelection={false}
            published={false}
            summary={pipelineSummary({ steps: 4, subRoutines: 1, runValues: 1, resources: 0, artefacts: 1 })}
            clipAfter="fit"
          />
        }
      >
        <GraphCanvas graph={graph} height={CANVAS_H} pan={PAN} width={CANVAS_W} zoom={ZOOM} />
      </GraphContainer>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "draft-pipeline-graph",
  width: WIDTH,
  radius: 16,
  label: `Draft pipeline graph for the routine ${DEMO.routine.name}, zoomed in on the middle: step 2, ${DEMO.subRoutine.name}, outputs findings and branches to its sub-routine card; step 3, ${DEMO.routine.steps[2]}, takes the findings and outputs a brief. Earlier and later steps continue off the edges.`,
  caption: "Part of the draft's graph: each step shows what it takes in (↓) and puts out (↑), and step 2 calls a sub-routine.",
  Component: DraftPipelineGraph,
};
