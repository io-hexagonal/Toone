import type { ComponentType } from "react";
import { Miniature } from "../Miniature";
import type { SceneDefinition } from "../scene";
import { scene as agentNameField } from "./agent-name-field";
import { scene as draftPipelineGraph } from "./draft-pipeline-graph";
import { scene as projectExplorerTree } from "./project-explorer-tree";
import { scene as routineRunningGraph } from "./routine-running-graph";

/**
 * The operating loop from the overview as four numbered tiles joined into a
 * loop (1 → 2 → 3 → 4 → 1), each a crop of the figure that shows that step
 * elsewhere in the guides:
 *   1 Define your agents   agent-name-field (naming Research Assistant)
 *   2 Shape the process    draft-pipeline-graph (the draft's graph)
 *   3 Run and observe      routine-running-graph (Run #3 lit up)
 *   4 Keep the result      project-explorer-tree (the brief, marked fresh)
 * The scenes are reused as-is (prop-less server components) inside a
 * <Miniature> crop, so their sources are theirs; see each scene file.
 *
 * Layout: a 2 × 2 grid read clockwise (top row 1, 2; bottom row 4, 3) so
 * the arrows close the loop. Titles are the guide's four bold leads.
 */

const PAD = 16;
const GUTTER = 32;
const TILE_W = (640 - PAD * 2 - GUTTER) / 2; // 288
const PREVIEW_H = 132;
const HEAD_H = 26;
const TILE_H = HEAD_H + PREVIEW_H;

type Tile = {
  n: number;
  title: string;
  Component: ComponentType;
  contentWidth: number;
  scale: number;
  origin: { x: number; y: number };
};

const TILES: Record<1 | 2 | 3 | 4, Tile> = {
  1: {
    n: 1,
    title: "Define your agents",
    Component: agentNameField.Component,
    contentWidth: agentNameField.width,
    scale: 0.75,
    // the header with the name field, centred vertically (scene is 76 tall)
    origin: { x: 0, y: -(PREVIEW_H / 0.75 - 76) / 2 },
  },
  2: {
    n: 2,
    title: "Shape the process",
    Component: draftPipelineGraph.Component,
    contentWidth: draftPipelineGraph.width,
    scale: 0.5,
    origin: { x: 0, y: -(PREVIEW_H / 0.5 - 234) / 2 },
  },
  3: {
    n: 3,
    title: "Run and observe",
    Component: routineRunningGraph.Component,
    contentWidth: routineRunningGraph.width,
    scale: 0.5,
    origin: { x: 0, y: (285 - PREVIEW_H / 0.5) / 2 },
  },
  4: {
    n: 4,
    title: "Keep the result",
    Component: projectExplorerTree.Component,
    contentWidth: projectExplorerTree.width,
    scale: 0.6,
    origin: { x: 0, y: 222 },
  },
};

function NumberBadge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 4,
        background: "var(--tu-control-tint)",
        color: "#1c1c1e",
        fontFamily: "var(--tu-font-mono)",
        fontSize: 11,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  );
}

function LoopTile({ tile, left, top }: { tile: Tile; left: number; top: number }) {
  const { Component } = tile;
  return (
    <div style={{ position: "absolute", left, top, width: TILE_W }}>
      <div style={{ height: HEAD_H, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <NumberBadge n={tile.n} />
        <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--tu-text-1)" }}>{tile.title}</span>
      </div>
      <div
        style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--tu-panel)",
          boxShadow: "0 0 0 1px var(--tu-border-subtle)",
        }}
      >
        <Miniature
          contentWidth={tile.contentWidth}
          height={PREVIEW_H / tile.scale}
          origin={tile.origin}
          scale={tile.scale}
          width={TILE_W / tile.scale}
        >
          <Component />
        </Miniature>
      </div>
    </div>
  );
}

const COL = [PAD, PAD + TILE_W + GUTTER];
const ROW = [PAD, PAD + TILE_H + GUTTER];
const HEIGHT = PAD * 2 + TILE_H * 2 + GUTTER;

/** Loop arrows in the gutters: 1 → 2, 2 → 3 (down), 3 → 4 (left), 4 → 1 (up). */
function LoopArrows() {
  const midX = PAD + TILE_W + GUTTER / 2;
  const midY = PAD + TILE_H + GUTTER / 2;
  const previewMid = (row: number) => ROW[row] + HEAD_H + PREVIEW_H / 2;
  const colMid = (col: number) => COL[col] + TILE_W / 2;
  const h = 7; // arrowhead
  const stroke = { fill: "none", stroke: "var(--tu-text-2)", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const right = (x: number, y: number) => `M${x - 10} ${y}h20M${x + 10 - h} ${y - h}l${h} ${h}-${h} ${h}`;
  const left = (x: number, y: number) => `M${x + 10} ${y}h-20M${x - 10 + h} ${y - h}l-${h} ${h} ${h} ${h}`;
  const down = (x: number, y: number) => `M${x} ${y - 10}v20M${x - h} ${y + 10 - h}l${h} ${h} ${h}-${h}`;
  const up = (x: number, y: number) => `M${x} ${y + 10}v-20M${x - h} ${y - 10 + h}l${h}-${h} ${h} ${h}`;
  return (
    <svg aria-hidden="true" height={HEIGHT} style={{ position: "absolute", inset: 0 }} width={640}>
      <path d={right(midX, previewMid(0))} {...stroke} />
      <path d={down(colMid(1), midY)} {...stroke} />
      <path d={left(midX, previewMid(1))} {...stroke} />
      <path d={up(colMid(0), midY)} {...stroke} />
    </svg>
  );
}

function OperatingLoop() {
  return (
    <div style={{ position: "relative", height: HEIGHT }}>
      <LoopTile left={COL[0]} tile={TILES[1]} top={ROW[0]} />
      <LoopTile left={COL[1]} tile={TILES[2]} top={ROW[0]} />
      <LoopTile left={COL[1]} tile={TILES[3]} top={ROW[1]} />
      <LoopTile left={COL[0]} tile={TILES[4]} top={ROW[1]} />
      <LoopArrows />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "operating-loop",
  width: 640,
  radius: 16,
  label:
    "The operating loop as four numbered tiles joined by arrows into a cycle. 1, Define your agents: an agent being named Research Assistant. 2, Shape the process: the draft routine's graph of steps. 3, Run and observe: the same graph during a run, with the running step lit. 4, Keep the result: Project Explorer with the new brief marked in the briefs folder. An arrow leads from 4 back to 1.",
  caption: "Define agents, shape a routine with them, run and observe it, and keep the result for the next run.",
  Component: OperatingLoop,
};
