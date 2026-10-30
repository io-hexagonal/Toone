import type { GraphEdge, GraphNode, LaidOutGraph, PlacedEdge, PlacedNode } from "./types";

/**
 * Port of the coordinate phase of the app's layered layout
 * (Features/KnowledgeGraph/Layout/SugiyamaCore.swift `assignCoordinates`,
 * `relaxLayer`) with the Routine Creator config from
 * RoutinePipelineLayoutEngine.swift:42-47 (layer gap 90, row gap 28).
 *
 * The scene author supplies the layers (columns, left → right) and the order
 * inside each column (top → bottom). Work them out the way the app does:
 * - layer = longest path from a source; a source with slack moves next to its
 *   earliest consumer (pull-right);
 * - ties inside a column break by node id (the app id-sorts everything:
 *   "draft/input/…" < "draft/routine" < "draft/step/…" < "draft/subroutine/…").
 * Edges must join adjacent columns (the app inserts virtual bend nodes for
 * longer edges; this port does not).
 *
 * Output is centred on (0, 0) like the app's model space.
 */

export const NODE_SIZE = { width: 180, height: 48 };
export const STEP_SIZE = { width: 150, height: 36 };
export const DEPARTMENT_SIZE = { width: 210, height: 64 };

export function sizeFor(kind: GraphNode["kind"]) {
  if (kind === "step") return STEP_SIZE;
  if (kind === "department") return DEPARTMENT_SIZE;
  return NODE_SIZE;
}

type Config = { layerGapX: number; nodeGapY: number; relaxationSweeps: number };

const INNER: Config = { layerGapX: 90, nodeGapY: 28, relaxationSweeps: 3 };

export function layoutLayers(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layers: string[][],
  config: Partial<Config> = {},
): LaidOutGraph {
  const cfg = { ...INNER, ...config };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const layerOf = new Map<string, number>();
  layers.forEach((ids, i) => ids.forEach((id) => layerOf.set(id, i)));

  const size = (id: string) => sizeFor(byId.get(id)!.kind);
  const center = new Map<string, { x: number; y: number }>();

  // x: cumulative layer widths
  const layerXs: number[] = [];
  let cursorX = 0;
  for (const ids of layers) {
    const width = Math.max(20, ...ids.map((id) => size(id).width));
    const cx = cursorX + width / 2;
    layerXs.push(cx);
    ids.forEach((id) => center.set(id, { x: cx, y: 0 }));
    cursorX += width + cfg.layerGapX;
  }

  // y: initial stacking in order
  for (const ids of layers) {
    let cursorY = 0;
    for (const id of ids) {
      center.get(id)!.y = cursorY + size(id).height / 2;
      cursorY += size(id).height + cfg.nodeGapY;
    }
  }

  const above = new Map<string, string[]>();
  const below = new Map<string, string[]>();
  for (const e of edges) {
    const lf = layerOf.get(e.from);
    const lt = layerOf.get(e.to);
    if (lf === undefined || lt === undefined || lf === lt) continue;
    const [a, b] = lf < lt ? [e.from, e.to] : [e.to, e.from];
    above.set(b, [...(above.get(b) ?? []), a]);
    below.set(a, [...(below.get(a) ?? []), b]);
  }

  const relax = (ids: string[], fixed: Map<string, string[]>) => {
    if (ids.length === 0) return;
    const targets = ids.map((id) => {
      const ys = (fixed.get(id) ?? []).map((n) => center.get(n)!.y).sort((p, q) => p - q);
      if (ys.length === 0) return center.get(id)!.y;
      const mid = Math.floor(ys.length / 2);
      return ys.length % 2 === 0 ? (ys[mid - 1] + ys[mid]) / 2 : ys[mid];
    });
    const down = [...targets];
    for (let i = 1; i < ids.length; i++) {
      const minY = down[i - 1] + size(ids[i - 1]).height / 2 + cfg.nodeGapY + size(ids[i]).height / 2;
      down[i] = Math.max(targets[i], minY);
    }
    const up = [...targets];
    for (let i = ids.length - 2; i >= 0; i--) {
      const maxY = up[i + 1] - size(ids[i + 1]).height / 2 - cfg.nodeGapY - size(ids[i]).height / 2;
      up[i] = Math.min(targets[i], maxY);
    }
    ids.forEach((id, i) => (center.get(id)!.y = (down[i] + up[i]) / 2));
    for (let i = 1; i < ids.length; i++) {
      const minY =
        center.get(ids[i - 1])!.y + size(ids[i - 1]).height / 2 + cfg.nodeGapY + size(ids[i]).height / 2;
      if (center.get(ids[i])!.y < minY) center.get(ids[i])!.y = minY;
    }
  };

  for (let sweep = 0; sweep < cfg.relaxationSweeps; sweep++) {
    const downward = sweep % 2 === 0;
    const range = downward
      ? layers.map((_, i) => i).slice(1)
      : layers.map((_, i) => i).slice(0, -1).reverse();
    for (const i of range) relax(layers[i], downward ? above : below);
  }

  // Normalise to top = 0, then centre on the origin.
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [id, c] of center) {
    minY = Math.min(minY, c.y - size(id).height / 2);
    maxY = Math.max(maxY, c.y + size(id).height / 2);
  }
  const width = cursorX - cfg.layerGapX;
  const height = maxY - minY;
  const dx = -width / 2;
  const dy = -minY - height / 2;

  const placed: PlacedNode[] = layers.flat().map((id) => {
    const node = byId.get(id)!;
    const c = center.get(id)!;
    const s = size(id);
    return { ...node, x: c.x + dx, y: c.y + dy, w: s.width, h: s.height };
  });
  const placedById = new Map(placed.map((n) => [n.id, n]));

  // Routes: source right-centre → target left-centre (SugiyamaCore phase 7).
  const placedEdges: PlacedEdge[] = edges.flatMap((e) => {
    const a = placedById.get(e.from);
    const b = placedById.get(e.to);
    if (!a || !b) return [];
    return [
      {
        ...e,
        id: `${e.from}~${e.to}`,
        points: [
          { x: a.x + a.w / 2, y: a.y },
          { x: b.x - b.w / 2, y: b.y },
        ],
      },
    ];
  });

  return {
    nodes: placed,
    edges: placedEdges,
    layerXs: layerXs.map((x) => x + dx),
    contentSize: { width, height },
  };
}
