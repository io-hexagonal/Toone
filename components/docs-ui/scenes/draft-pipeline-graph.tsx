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
 */

const WIDTH = 640;
const INSET = 12; // panel padding around the graph container
const CANVAS_W = WIDTH - INSET * 2;
const CANVAS_H = 128;

const graph = researchBriefGraph({ showInputs: true, showArtefacts: false });

/*
 * The whole pipeline is 1170pt wide, so fit-to-view would drop the cards to
 * ~5px text. Instead this is a pinch-zoomed crop (a real state): zoom 0.63,
 * routine column 14px from the left edge, which keeps the input, the routine,
 * steps 1-3 and the sub-routine in view; the edge to step 4 leaves the frame.
 */
const ZOOM = 0.63;
const routine = graph.nodes.find((n) => n.id === ID.routine)!;
const PAN = { x: 14 - CANVAS_W / 2 - (routine.x - routine.w / 2) * ZOOM, y: 4 };

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
  label: `Draft pipeline graph for the routine ${DEMO.routine.name}: a Topic input and the routine card lead into the numbered steps 1 to 3, with step 4 continuing off to the right; step 2, ${DEMO.subRoutine.name}, branches to its sub-routine card.`,
  caption: "The draft's graph: the routine and its input lead into the steps, and step 2 calls a sub-routine.",
  Component: DraftPipelineGraph,
};
