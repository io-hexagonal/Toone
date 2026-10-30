import { DEMO } from "../demo";
import { layoutLayers } from "./layout";
import type { GraphEdge, GraphNode, LaidOutGraph, RunState } from "./types";

/**
 * The demo routine "Produce a research brief" as the Routine Creator graph
 * builds it (Core/Services/RoutineCreator/RoutineDraftGraphBuilder.swift) with
 * the Steps chip on. Shared by every scene that shows this routine's graph.
 *
 * Node ids follow the app ("draft/routine", "draft/step/<id>", …) because the
 * app id-sorts nodes inside a column.
 *
 * Builder facts reproduced here:
 * - routine subtitle = owner name, plus the model only when the routine
 *   overrides it (no override → just "Research Assistant");
 * - step labels are numbered "N. Title";
 * - the entry step hangs off the routine with a stepChain edge; steps chain
 *   with stepChain edges (straight lines);
 * - an input consumed by a step links to that step (flow), not the routine;
 * - a step that invokes a sub-routine links to it with a parent edge;
 * - step stubs list the step's inputs/outputs (last path segment, first word).
 */

export const ID = {
  input: "draft/input/topic",
  routine: "draft/routine",
  step: (n: 1 | 2 | 3 | 4) => `draft/step/s${n}`,
  subRoutine: "draft/subroutine/investigate-a-topic",
  artefact: "draft/artefact/research-brief",
  /** Steps of the expanded sub-routine (RoutineDraftGraphBuilder.subRoutineStepNodeId). */
  subStep: (n: 1 | 2) => `draft/subroutine/investigate-a-topic/step/s${n}`,
};

type Options = {
  /** "Run setup" chip (inputs). */
  showInputs: boolean;
  /** "Artefacts" chip. When off the routine card shows "+1". */
  showArtefacts: boolean;
  runState?: Partial<Record<string, RunState>>;
  /** Sub-routine disclosed (its chevron, or selecting its card): its own
   * steps join the graph after it (appendExpandedSubRoutine). Default off. */
  expandSubRoutine?: boolean;
};

export function researchBriefGraph({
  showInputs,
  showArtefacts,
  runState = {},
  expandSubRoutine = false,
}: Options): LaidOutGraph {
  const [s1, s2, s3, s4] = DEMO.routine.steps;
  const nodes: GraphNode[] = [
    {
      id: ID.routine,
      kind: "routine",
      label: DEMO.routine.name,
      sublabel: DEMO.routine.owner,
      expanded: true,
      leafArtefactCount: showArtefacts ? 0 : 1,
    },
    { id: ID.step(1), kind: "step", label: `1. ${s1}`, stepIns: ["topic"] },
    { id: ID.step(2), kind: "step", label: `2. ${s2}`, stepOuts: ["findings"] },
    { id: ID.step(3), kind: "step", label: `3. ${s3}`, stepIns: ["findings"], stepOuts: ["brief draft"] },
    { id: ID.step(4), kind: "step", label: `4. ${s4}`, stepOuts: ["briefs/research-brief.md"] },
    {
      id: ID.subRoutine,
      kind: "subRoutine",
      label: DEMO.subRoutine.name,
      sublabel: DEMO.routine.owner,
      expanded: expandSubRoutine,
    },
  ];
  if (expandSubRoutine) {
    const [g1, g2] = DEMO.subRoutine.steps;
    nodes.push(
      { id: ID.subStep(1), kind: "step", label: `1. ${g1}`, stepIns: ["topic"], stepOuts: ["sources"] },
      { id: ID.subStep(2), kind: "step", label: `2. ${g2}`, stepIns: ["sources"], stepOuts: ["findings"] },
    );
  }
  if (showInputs) {
    nodes.push({ id: ID.input, kind: "input", label: "Topic", sublabel: "user · topic" });
  }
  if (showArtefacts) {
    nodes.push({
      id: ID.artefact,
      kind: "artefact",
      label: "Research brief",
      sublabel: "briefs/research-brief.md · markdown",
    });
  }
  for (const node of nodes) node.runState = runState[node.id] ?? "none";

  const edges: GraphEdge[] = [
    { from: ID.routine, to: ID.step(1), kind: "stepChain" },
    { from: ID.step(1), to: ID.step(2), kind: "stepChain" },
    { from: ID.step(2), to: ID.step(3), kind: "stepChain" },
    { from: ID.step(3), to: ID.step(4), kind: "stepChain" },
    { from: ID.step(2), to: ID.subRoutine, kind: "parent" },
  ];
  if (expandSubRoutine) {
    // The child's entry step hangs off its card; its steps chain (stepChain).
    edges.push(
      { from: ID.subRoutine, to: ID.subStep(1), kind: "stepChain" },
      { from: ID.subStep(1), to: ID.subStep(2), kind: "stepChain" },
    );
  }
  if (showInputs) edges.push({ from: ID.input, to: ID.step(1), kind: "flow" });
  if (showArtefacts) edges.push({ from: ID.step(4), to: ID.artefact, kind: "produces" });

  const layers = [
    showInputs ? [ID.input, ID.routine] : [ID.routine],
    [ID.step(1)],
    [ID.step(2)],
    [ID.step(3), ID.subRoutine],
    // id order: "draft/step/s4" < "draft/subroutine/…/step/s1"
    expandSubRoutine ? [ID.step(4), ID.subStep(1)] : [ID.step(4)],
    ...(expandSubRoutine
      ? [showArtefacts ? [ID.artefact, ID.subStep(2)] : [ID.subStep(2)]]
      : showArtefacts
        ? [[ID.artefact]]
        : []),
  ];
  return layoutLayers(nodes, edges, layers);
}
