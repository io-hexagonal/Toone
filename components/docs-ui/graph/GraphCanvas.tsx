import type { CSSProperties } from "react";
import styles from "../docs-ui.module.css";
import { EdgeLayer } from "./Edges";
import { focusNodeIds, hoverNeighbourhood, lineageEdgeIds } from "./focus";
import { NodeCard } from "./NodeCard";
import { StepCard } from "./StepCard";
import type { LaidOutGraph } from "./types";

/**
 * The graph viewport (RoutineDraftPipelineView.pipelineCanvas). Model space is
 * centred on the viewport, then scaled by `zoom` about the centre and shifted
 * by `pan`, exactly like the app's `.scaleEffect(zoom).offset(pan)`:
 *
 *   screen = viewportCentre + modelPoint × zoom + pan
 *
 * Real states to reproduce:
 * - fit to view on open: zoom = min(1, w / (contentW + 160), h / (contentH + 160)), pan 0;
 * - "Focus selection": zoom = 1, pan = −node.position;
 * - anything in between is a user pinch/drag, so any crop is a real state.
 *
 * Focus: a selected node lights its lineage; everything else dims to 0.15
 * (running nodes stay at 1). A hovered node (no selection) lights its neighbours.
 */
type Props = {
  graph: LaidOutGraph;
  width: number;
  height: number;
  zoom?: number;
  pan?: { x: number; y: number };
  selectedId?: string;
  hoveredId?: string;
  presentsLiveActivity?: boolean;
  showLayerGuides?: boolean;
  style?: CSSProperties;
};

export function GraphCanvas({
  graph,
  width,
  height,
  zoom = 1,
  pan = { x: 0, y: 0 },
  selectedId,
  hoveredId,
  presentsLiveActivity = true,
  showLayerGuides = true,
  style,
}: Props) {
  const focusId = selectedId ?? hoveredId;
  const focusNodes = selectedId
    ? focusNodeIds(graph, selectedId)
    : hoveredId
      ? hoverNeighbourhood(graph, hoveredId)
      : undefined;
  const lineage = selectedId ? lineageEdgeIds(graph, selectedId) : undefined;

  return (
    <div className={styles.graphCanvas} style={{ width, height, ...style }}>
      <div
        className={styles.graphWorld}
        style={{ transform: `translate(${width / 2 + pan.x}px, ${height / 2 + pan.y}px) scale(${zoom})` }}
      >
        <EdgeLayer
          focusId={focusId}
          graph={graph}
          lineage={lineage}
          selectedId={selectedId}
          showLayerGuides={showLayerGuides}
        />
        {graph.nodes.map((node) => {
          const opacity =
            node.runState === "running" ? 1 : focusNodes ? (focusNodes.has(node.id) ? 1 : 0.15) : 1;
          const hovered = hoveredId === node.id;
          const scale = hovered ? (node.kind === "step" ? 1.05 : 1.08) : 1;
          return (
            <div
              className={styles.graphNode}
              key={node.id}
              style={{
                left: node.x,
                top: node.y,
                opacity,
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            >
              {node.kind === "step" ? (
                <StepCard node={node} presentsLiveActivity={presentsLiveActivity} selected={selectedId === node.id} />
              ) : (
                <NodeCard node={node} presentsLiveActivity={presentsLiveActivity} selected={selectedId === node.id} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Zoom the app picks on open (fitToView, 80px air on each side). */
export function fitZoom(graph: LaidOutGraph, width: number, height: number, pad = 80): number {
  const { width: cw, height: ch } = graph.contentSize;
  return Math.min(1, width / (cw + pad * 2), height / (ch + pad * 2));
}

/** Pan that "Focus selection" applies (zoom 1, node centred). */
export function focusPan(graph: LaidOutGraph, nodeId: string): { x: number; y: number } {
  const node = graph.nodes.find((n) => n.id === nodeId);
  return node ? { x: -node.x, y: -node.y } : { x: 0, y: 0 };
}
