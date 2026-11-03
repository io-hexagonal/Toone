import { DEMO } from "../demo";
import { GraphCanvas } from "../graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { ID, researchBriefGraph } from "../graph/researchBrief";
import type { SceneDefinition } from "../scene";

/**
 * Draft graph of "Produce a research brief" with the
 * sub-routine "Investigate a topic" expanded into its own steps, nothing
 * selected (expanded with the card's chevron).
 *
 * Crop: zoom 1.12 (card text ≥11px in the guide column). The sub-routine
 * card and its first step need 420pt of model space; the whole expansion
 * (card + both steps) needs 660pt, i.e. zoom ≤ 0.93 in a 640px figure. So
 * step 2's parent edge enters from the left and the child's second step,
 * "2. Separate evidence from assumptions", sits off-frame right with its
 * chain edge leaving the frame. No card is cut. The parent's own step 3 →
 * step 4 row runs above.
 */

const WIDTH = 640;
const INSET = 12;
const CANVAS_W = WIDTH - INSET * 2;
const CANVAS_H = 196;
const ZOOM = 1.12;

const graph = researchBriefGraph({ showInputs: false, showArtefacts: false, expandSubRoutine: true });

const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
const sub = node(ID.subRoutine);
const child1 = node(ID.subStep(1));
const step3 = node(ID.step(3));
// Centre sub-routine card … child step 1 horizontally; step 3 row + sub row vertically.
const PAN = {
  x: -(((sub.x - sub.w / 2) + (child1.x + child1.w / 2)) / 2) * ZOOM,
  y: -((step3.y + sub.y) / 2) * ZOOM,
};

function SubroutineExpandedGraph() {
  return (
    <div style={{ padding: INSET }}>
      <GraphContainer
        toolbar={
          <GraphToolbar
            chips={{ runSetup: false, artefacts: false, steps: true }}
            clipAfter="fit"
            hasSelection={false}
            published={false}
            summary={pipelineSummary({ steps: 4, subRoutines: 1 })}
          />
        }
      >
        <GraphCanvas graph={graph} height={CANVAS_H} pan={PAN} width={CANVAS_W} zoom={ZOOM} />
      </GraphContainer>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "subroutine-expanded-graph",
  width: WIDTH,
  radius: 16,
  label: `Draft pipeline graph of ${DEMO.routine.name} with its sub-routine expanded: step 2 links to the ${DEMO.subRoutine.name} card, whose chevron is open, and the card continues into the sub-routine's own step 1, ${DEMO.subRoutine.steps[0]}, which leads on to step 2 off the right edge. The parent's steps 3 and 4 run above.`,
  caption: "Open a sub-routine's card and its own steps join the graph, right after the step that calls it.",
  Component: SubroutineExpandedGraph,
};
