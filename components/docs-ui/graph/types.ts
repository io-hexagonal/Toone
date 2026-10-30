/**
 * Graph model, mirroring PipelineNode / PipelineEdge in the app
 * (Features/KnowledgeGraph). Scenes describe nodes and edges with these
 * types, place them with `layoutLayers`, and render with <GraphCanvas>.
 */

export type NodeKind = "input" | "routine" | "subRoutine" | "artefact" | "step" | "department";

/** Only `running` is ever produced by the Routine Creator graph at runtime
 * (RoutineDraftRuntimePresentation.runStateByNodeId); `completed`/`failed`
 * exist for the production Routines graph and only colour *standard* cards. */
export type RunState = "none" | "running" | "completed" | "failed";

export type Health = "ok" | "broken" | "missing";

export type EdgeKind =
  | "flow"
  | "parent"
  | "produces"
  | "broken"
  | "consumes"
  | "handoff"
  | "stepChain"
  | "feedback";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  /** Steps carry their number: "2. Investigate a topic". */
  label: string;
  /** Standard cards only (steps keep theirs in a tooltip, never drawn). */
  sublabel?: string;
  runState?: RunState;
  health?: Health;
  /** Badge text while running: RUNNING | WAITING | PAUSED | RETRYING | STALLED | NEEDS FIX. */
  liveLabel?: string;
  /** Disclosure chevron on standard cards: undefined = none,
   * false = chevron.down.circle, true = chevron.up.circle.fill. */
  expanded?: boolean;
  /** "+N" hidden artefacts (routine card while the Artefacts chip is off). */
  leafArtefactCount?: number;
  /** Step stubs, shown as "↓ a · b" / "↑ x" (last path segment, max 2 + "+N"). */
  stepIns?: string[];
  stepOuts?: string[];
};

export type GraphEdge = {
  from: string;
  to: string;
  kind: EdgeKind;
  label?: string;
  /** Aggregated edge count (adds width and a ×N capsule). */
  count?: number;
};

export type Point = { x: number; y: number };

export type PlacedNode = GraphNode & { x: number; y: number; w: number; h: number };

export type PlacedEdge = GraphEdge & { id: string; points: Point[] };

export type LaidOutGraph = {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  /** Column centre lines (model space), used for the dashed layer guides. */
  layerXs: number[];
  contentSize: { width: number; height: number };
};
