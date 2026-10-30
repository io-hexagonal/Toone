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
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - edges: APP/Features/KnowledgeGraph/Views/RoutinePipelineGraphComponents.swift:54-55
 *   (handoff = department colour, resting 0.7), :89-113 (curve, dash [6, 4]);
 *   step chain = `.secondary` @0.55, straight;
 * - step stubs: same file :249-283 (8pt, ↓ input colour / ↑ artefact
 *   colour), :357-364 (first two values, last path segment); the executor
 *   only lives in the step's tooltip (:287-293), so nothing names an agent
 *   on a step card;
 * - graph: APP/Core/Services/RoutineCreator/RoutineDraftGraphBuilder.swift:96-127
 *   (an explicit transition is a stepChain edge, a structured agent handoff
 *   adds a `.handoff` edge between the same two steps);
 *   APP/Features/KnowledgeGraph/Layout/RoutinePipelineLayout.swift:91
 *   ("explicit execution boundary between workflow steps").
 *
 * Code vs plan: the plan draws two routine cards, "Launch Surface
 * Preparation" and "Launch Content Production", joined by a handoff edge.
 * The app has no such edge: handoffs only join two *steps of one routine*
 * (payload.handoffs), and the organization graph deliberately draws no
 * cross-routine edges (RoutinesGraphBuilder.swift:5-8). The two Explore
 * routines also declare no handoffs. So the figure shows the demo's
 * "Launch day" routine, whose steps mirror the two bundle routines.
 * A handoff always rides on a control-flow edge (RoutineRunBranching.swift:95-97),
 * so each dashed handoff curve runs alongside the straight step chain
 * between the same two steps, as in the app.
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
            summary={pipelineSummary({ steps: 3, subRoutines: 0, runValues: 1, resources: 0, artefacts: 3 })}
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
