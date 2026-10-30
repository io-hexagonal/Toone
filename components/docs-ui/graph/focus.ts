import type { LaidOutGraph } from "./types";

/**
 * Port of RoutineGraphFocus (Core/Services/RoutineCreator/RoutineGraphInteraction.swift)
 * and the hover neighbourhood in RoutineDraftPipelineView.focusedNodeIds.
 */

export function focusNodeIds(graph: LaidOutGraph, nodeId: string): Set<string> {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return new Set();
  if (node.kind === "input" || node.kind === "artefact") {
    const result = new Set([nodeId]);
    for (const e of graph.edges) {
      if (e.from === nodeId) result.add(e.to);
      if (e.to === nodeId) result.add(e.from);
    }
    return result;
  }
  const result = new Set([nodeId]);
  for (const downstream of [false, true]) {
    const visited = new Set([nodeId]);
    const frontier = [nodeId];
    while (frontier.length) {
      const current = frontier.pop()!;
      for (const e of graph.edges) {
        if ((downstream ? e.from : e.to) !== current) continue;
        const next = downstream ? e.to : e.from;
        if (!visited.has(next)) {
          visited.add(next);
          frontier.push(next);
        }
      }
    }
    visited.forEach((id) => result.add(id));
  }
  return result;
}

export function lineageEdgeIds(graph: LaidOutGraph, nodeId: string): Set<string> {
  const resource = graph.nodes.some(
    (n) => n.id === nodeId && (n.kind === "input" || n.kind === "artefact"),
  );
  const focused = focusNodeIds(graph, nodeId);
  return new Set(
    graph.edges
      .filter((e) =>
        resource ? e.from === nodeId || e.to === nodeId : focused.has(e.from) && focused.has(e.to),
      )
      .map((e) => e.id),
  );
}

export function hoverNeighbourhood(graph: LaidOutGraph, nodeId: string): Set<string> {
  const result = new Set([nodeId]);
  for (const e of graph.edges) {
    if (e.from === nodeId) result.add(e.to);
    if (e.to === nodeId) result.add(e.from);
  }
  return result;
}
