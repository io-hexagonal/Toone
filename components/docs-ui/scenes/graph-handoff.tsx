import { DEMO } from "../demo";
import { GraphCanvas } from "../graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { layoutLayers } from "../graph/layout";
import type { GraphEdge, GraphNode } from "../graph/types";
import type { SceneDefinition } from "../scene";

/**
 * The "Launch day" routine's graph (Steps chip on, nothing selected): step 1,
 * "Write the launch brief" (run by Research Assistant), hands its brief to
 * the two steps that run in parallel on other agents, "Prepare launch sites"
 * (Launch Planner, the routine's owner) and "Draft launch posts" (Growth
 * Writer). Same run as the system-threads-parallel figure.
 *
 * Crop: zoom 1.12 (card text ≥11px in the guide column). Routine card +
 * three columns need 660pt of model space (zoom ≤ 0.93), so the routine
 * card "Launch day · Launch Planner" sits off-frame left; its chain edge
 * enters from the left. No card is cut.
 */

const WIDTH = 640;
const INSET = 12;
const CANVAS_W = WIDTH - INSET * 2;
const CANVAS_H = 196;
const ZOOM = 1.12;

const L = DEMO.launchRoutine;
const ID = {
  routine: "draft/routine",
  step: (n: 1 | 2 | 3) => `draft/step/s${n}`,
};

const nodes: GraphNode[] = [
  {
    id: ID.routine,
    kind: "routine",
    label: L.name,
    sublabel: DEMO.agents.launch.name,
    expanded: true,
    leafArtefactCount: 3,
  },
  { id: ID.step(1), kind: "step", label: `1. ${L.steps[0]}`, stepOuts: ["launch/brief.md"] },
  {
    id: ID.step(2),
    kind: "step",
    label: `2. ${L.steps[1]}`,
    stepIns: ["launch/brief.md"],
    stepOuts: ["launch/site-plans.md"],
  },
  {
    id: ID.step(3),
    kind: "step",
    label: `3. ${L.steps[2]}`,
    stepIns: ["launch/brief.md"],
    stepOuts: ["launch/posts.md"],
  },
];

const edges: GraphEdge[] = [
  { from: ID.routine, to: ID.step(1), kind: "stepChain" },
  { from: ID.step(1), to: ID.step(2), kind: "stepChain" },
  { from: ID.step(1), to: ID.step(3), kind: "stepChain" },
  { from: ID.step(1), to: ID.step(2), kind: "handoff" },
  { from: ID.step(1), to: ID.step(3), kind: "handoff" },
];

const laidOut = layoutLayers(nodes, edges, [[ID.routine], [ID.step(1)], [ID.step(2), ID.step(3)]]);
// The app keys both edges "from~to"; give the handoffs their own React key.
const graph = {
  ...laidOut,
  edges: laidOut.edges.map((e) => (e.kind === "handoff" ? { ...e, id: `${e.id}#handoff` } : e)),
};

const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
const s1 = node(ID.step(1));
const s2 = node(ID.step(2));
// Centre step 1 … steps 2/3 horizontally, the graph vertically.
const PAN = {
  x: -(((s1.x - s1.w / 2) + (s2.x + s2.w / 2)) / 2) * ZOOM,
  y: -s1.y * ZOOM,
};

function GraphHandoff() {
  return (
    <div style={{ padding: INSET }}>
      <GraphContainer
        toolbar={
          <GraphToolbar
            chips={{ runSetup: false, artefacts: false, steps: true }}
            clipAfter="fit"
            hasSelection={false}
            published
            summary={pipelineSummary({ steps: 3, subRoutines: 0 })}
          />
        }
      >
        <GraphCanvas graph={graph} height={CANVAS_H} pan={PAN} width={CANVAS_W} zoom={ZOOM} />
      </GraphContainer>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "graph-handoff",
  width: WIDTH,
  radius: 16,
  label: `Routine pipeline graph of ${L.name}. Step 1, ${L.steps[0]}, outputs brief.md and branches to two steps, ${L.steps[1]} and ${L.steps[2]}, each taking brief.md in. Each branch has a solid step line and a dashed handoff line beside it. Step 2 outputs site-plans.md, step 3 outputs posts.md.`,
  caption: "Dashed lines are handoffs: the brief from step 1 goes to the two steps that other agents run, each with its own input and output.",
  Component: GraphHandoff,
};
