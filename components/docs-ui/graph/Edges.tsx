import type { EdgeKind, LaidOutGraph, PlacedEdge } from "./types";

/**
 * Edge layer: port of RoutinePipelineEdgeLayer
 * (RoutinePipelineGraphComponents.swift:6-147). Drawn in model space inside
 * the canvas world, so stroke widths scale with zoom like the app's Canvas.
 */

const EDGE_STYLE: Record<EdgeKind, { color: string; rest: number; dashed: boolean }> = {
  flow: { color: "var(--tu-pipe-input)", rest: 0.15, dashed: false },
  parent: { color: "var(--tu-pipe-routine)", rest: 0.5, dashed: false },
  produces: { color: "var(--tu-pipe-artefact)", rest: 0.28, dashed: false },
  broken: { color: "var(--tu-error)", rest: 0.7, dashed: true },
  consumes: { color: "var(--tu-pipe-input)", rest: 0.12, dashed: true },
  handoff: { color: "var(--tu-pipe-department)", rest: 0.7, dashed: true },
  stepChain: { color: "var(--tu-label-2)", rest: 0.55, dashed: false },
  feedback: { color: "var(--tu-warning)", rest: 0.75, dashed: true },
};

function edgePath(edge: PlacedEdge): string {
  const [first, ...rest] = edge.points;
  let d = `M${first.x} ${first.y}`;
  if (edge.kind === "stepChain") {
    for (const p of rest) d += ` L${p.x} ${p.y}`;
    return d;
  }
  let start = first;
  for (const end of rest) {
    const bend = (end.x - start.x) * 0.4;
    d += ` C${start.x + bend} ${start.y} ${end.x - bend} ${end.y} ${end.x} ${end.y}`;
    start = end;
  }
  return d;
}

/** Midpoint of the first segment (symmetric cubic, so t = 0.5 is the arc midpoint). */
function midpoint(edge: PlacedEdge) {
  const [a, b] = edge.points;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

type Props = {
  graph: LaidOutGraph;
  selectedId?: string;
  focusId?: string;
  lineage?: Set<string>;
  showLayerGuides?: boolean;
};

export function EdgeLayer({ graph, selectedId, focusId, lineage, showLayerGuides = true }: Props) {
  const halfH = graph.contentSize.height / 2;
  return (
    <svg aria-hidden="true" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width="1">
      {showLayerGuides && graph.contentSize.height > 0
        ? graph.layerXs.map((x) => (
            <line
              key={`guide-${x}`}
              style={{ stroke: "var(--tu-text-3)" }}
              strokeDasharray="2 6"
              strokeOpacity={0.12}
              strokeWidth={1}
              x1={x}
              x2={x}
              y1={-halfH - 60}
              y2={halfH + 60}
            />
          ))
        : null}
      {graph.edges.map((edge) => {
        const style = EDGE_STYLE[edge.kind];
        let opacity: number;
        let width: number;
        if (selectedId) {
          if (edge.from === selectedId || edge.to === selectedId) {
            opacity = 0.95;
            width = 2.2;
          } else if (lineage?.has(edge.id)) {
            opacity = 0.7;
            width = 1.8;
          } else {
            opacity = 0.04;
            width = 1.2;
          }
        } else if (focusId) {
          const touches = edge.from === focusId || edge.to === focusId;
          opacity = touches ? 0.95 : 0.04;
          width = touches ? 2.2 : 1.2;
        } else {
          opacity = style.rest;
          width = edge.kind === "parent" ? 2 : 1.2;
        }
        const count = edge.count ?? 1;
        if (count > 1) width += Math.min(3, Math.log2(count));
        const mid = midpoint(edge);
        const capsuleLabel = `×${count}`;
        const capsuleWidth = 14 + capsuleLabel.length * 6;
        return (
          <g key={edge.id}>
            <path
              d={edgePath(edge)}
              fill="none"
              strokeDasharray={style.dashed ? "6 4" : undefined}
              strokeOpacity={opacity}
              strokeWidth={width}
              style={{ stroke: style.color }}
            />
            {edge.label && opacity > 0.12 ? (
              <text
                dominantBaseline="central"
                fillOpacity={opacity}
                fontSize={8}
                fontWeight={500}
                style={{ fill: style.color }}
                textAnchor="middle"
                x={mid.x}
                y={mid.y - 10}
              >
                {edge.label}
              </text>
            ) : null}
            {count > 1 && opacity > 0.1 ? (
              <g>
                <rect
                  fillOpacity={Math.min(0.9, opacity + 0.2)}
                  height={18}
                  rx={9}
                  style={{ fill: style.color }}
                  width={capsuleWidth}
                  x={mid.x - capsuleWidth / 2}
                  y={mid.y - 9}
                />
                <text
                  dominantBaseline="central"
                  fill="rgba(0,0,0,0.85)"
                  fontSize={10}
                  fontWeight={700}
                  textAnchor="middle"
                  x={mid.x}
                  y={mid.y}
                >
                  {capsuleLabel}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
