"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { LogoKey } from "@/components/RoutineChain";

/**
 * The routine graph inside "How it works": the request from step 1 as Toone
 * parsed it. A schedule trigger fans out to four parallel Haiku research
 * agents, a merge, an Opus review, then Find leads (with its contracts),
 * Design and Publish on the user's own accounts.
 *
 * Same visual language as RoutineChain (ink on cream, the app's 10px-radius
 * cards, dashed "consumes" links to dashed account capsules; running = the
 * app's white treatment, paused = the app's caution orange), laid out around
 * a centred spine: rules (fallback, contracts) on the left, accounts on the
 * right, the model inside each agent card.
 *
 * The edges are drawn in one SVG measured from the laid-out cards (offset
 * geometry, so the pop-in transforms don't skew them), which keeps the curves
 * right in every language and at every width. Under 640px the four research
 * agents collapse into one "×4" card.
 *
 * Presentational: the caller owns every state. Decorative (aria-hidden); the
 * surrounding copy carries the meaning.
 */

export type NodeState = "draft" | "idle" | "running" | "done" | "paused";
export type ContractState = "draft" | "open" | "met" | "unmet";
export type NodeKey =
  | "trigger"
  | "r1"
  | "r2"
  | "r3"
  | "r4"
  | "merge"
  | "review"
  | "leads"
  | "design"
  | "publish";

export type GraphLabels = {
  schedule: string;
  fallback: string;
  research: string;
  merge: string;
  review: string;
  findLeads: string;
  design: string;
  publish: string;
  min: string;
  unique: string;
  running: string;
  paused: string;
};

type Props = {
  nodes: Record<NodeKey, NodeState>;
  /** Leads found so far; null hides the counter. */
  leads: number | null;
  contracts: { min: ContractState; unique: ContractState };
  /** How long each research agent runs, for its progress bar (ms). */
  researchMs: readonly number[];
  labels: GraphLabels;
  motion: boolean;
};

const RESEARCH = ["r1", "r2", "r3", "r4"] as const;
/** Edges, top to bottom. "rx" is the collapsed research card on phones. */
const EDGES: readonly (readonly [string, string])[] = [
  ...RESEARCH.map((r) => ["trigger", r] as const),
  ["trigger", "rx"],
  ...RESEARCH.map((r) => [r, "merge"] as const),
  ["rx", "merge"],
  ["merge", "review"],
  ["review", "leads"],
  ["leads", "design"],
  ["design", "publish"],
];
const LEADS_TARGET = 20;

const CSS = `
.hg {
  --ink: 29,28,25; --spine: 182px;
  position: relative; display: flex; flex-direction: column; gap: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
}
.hg-svg { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; z-index: 0; }
.hg-edge { fill: none; stroke: rgba(var(--ink),0.2); stroke-width: 1.2; transition: stroke .4s ease; }
.hg-edge[data-s="draft"] { stroke: rgba(var(--ink),0.26); stroke-dasharray: 4 4; }
.hg-edge[data-s="done"], .hg-edge[data-s="paused"] { stroke: rgba(var(--ink),0.42); }
.hg-edge[data-s="running"] { stroke: rgba(var(--ink),0.58); }
.hg-port { fill: #f6f4ef; stroke: rgba(var(--ink),0.32); stroke-width: 1; }
.hg-dot { fill: rgba(var(--ink),0.5); }

.hg-row {
  position: relative; z-index: 1; display: grid; align-items: center;
  grid-template-columns: minmax(0,1fr) var(--spine) minmax(0,1fr);
}
.hg-l { grid-column: 1; justify-self: end; display: flex; align-items: center; min-width: 0; }
.hg-c { grid-column: 2; justify-self: center; display: flex; }
.hg-r { grid-column: 3; justify-self: start; display: flex; align-items: center; }
.hg-fan {
  position: relative; z-index: 1; display: grid; gap: 10px; margin: 10px 0;
  grid-template-columns: repeat(4, minmax(0,1fr));
}
.hg-row--rx { display: none; }

/* --- cards: the app's routine card, light-ground translation --- */
.hg-card {
  position: relative; display: flex; align-items: center; gap: 7px;
  width: var(--spine); height: 40px; padding: 0 11px; border-radius: 10px;
  border: 1.5px solid rgba(var(--ink),0.11); background: rgba(255,255,255,0.62);
  color: rgba(var(--ink),0.9); font-size: 12.5px; font-weight: 500;
  letter-spacing: -0.005em; white-space: nowrap;
  transition: border-color .4s ease, background-color .4s ease, color .4s ease;
}
.hg-card::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(to bottom, rgba(var(--ink),0.07), transparent 60%);
  opacity: 0; transition: opacity .4s ease;
}
.hg-card--agent {
  width: 100%; height: 54px; flex-direction: column; align-items: flex-start;
  justify-content: center; gap: 3px; padding: 0 10px 2px;
}
.hg-card--step {
  width: auto; min-width: 104px; height: 32px; border-width: 1px; border-radius: 8px;
  justify-content: center; font-size: 12px;
}
.hg-title { display: flex; align-items: center; gap: 6px; min-width: 0; }
.hg-title span { overflow: hidden; text-overflow: ellipsis; }
.hg-card--agent .hg-title { max-width: calc(100% - 14px); }
.hg-glyph { width: 12px; height: 12px; flex-shrink: 0; color: #9a8573; }
.hg-end {
  margin-left: auto; display: flex; align-items: center; gap: 5px;
  color: rgba(var(--ink),0.58); font-size: 11px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.hg-end svg { width: 12px; height: 12px; }
.hg-model {
  display: inline-flex; align-items: center; gap: 3px;
  color: rgba(var(--ink),0.6); font-size: 10.5px; font-weight: 600; letter-spacing: 0.01em;
}
.hg-model svg { width: 10px; height: 10px; color: rgba(var(--ink),0.55); }
.hg-check { display: none; width: 12px; height: 12px; color: rgba(var(--ink),0.5); }
.hg-node[data-s="done"] .hg-check { display: block; animation: hg-pop .35s cubic-bezier(0.34,1.56,0.64,1) both; }
.hg-card--agent .hg-check { position: absolute; top: 8px; right: 9px; }

.hg-badge {
  position: absolute; top: -7px; right: 9px; z-index: 2; display: none;
  border-radius: 999px; padding: 2px 6px 1.5px;
  font-family: ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif;
  font-size: 8.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; line-height: 1.2;
}
.hg-node[data-s="running"] .hg-badge--run {
  display: block; color: rgba(var(--ink),0.86);
  background: #fff; box-shadow: inset 0 0 0 .75px rgba(var(--ink),0.45);
}
.hg-node[data-s="paused"] .hg-badge--pause {
  display: block; color: #b25a00;
  background: #fff7ec; box-shadow: inset 0 0 0 .75px rgba(255,149,0,0.7);
}
.hg-card--agent .hg-badge { right: auto; left: 9px; }

/* draft: proposed, not yet real */
.hg-node[data-s="draft"] .hg-card {
  border-style: dashed; border-color: rgba(var(--ink),0.3);
  background: rgba(255,255,255,0.22); color: rgba(var(--ink),0.5);
}
.hg-node[data-s="draft"] .hg-glyph,
.hg-node[data-s="draft"] .hg-model { opacity: .55; }
/* running: white card, ink rim (top strong, bottom soft), breathing wash */
.hg-node[data-s="running"] .hg-card {
  border-color: transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(to bottom, rgba(var(--ink),0.85), rgba(var(--ink),0.3)) border-box;
}
.hg-node[data-s="running"] .hg-card::after { opacity: 1; animation: hg-breath 1.9s ease-in-out infinite alternate; }
.hg-node[data-s="done"] .hg-card { background: rgba(255,255,255,0.8); }
/* paused: the app's caution orange, only ever for the paused state */
.hg-node[data-s="paused"] .hg-card {
  border-color: rgba(255,149,0,0.85);
  background: linear-gradient(to bottom, rgba(255,149,0,0.1), rgba(255,255,255,0.95) 70%), #fff;
}
.hg-node[data-s="paused"] .hg-end { color: #b25a00; }

/* each parallel agent's own progress, with a shimmer */
.hg-prog {
  position: absolute; left: 10px; right: 10px; bottom: 6px; height: 2px;
  border-radius: 2px; overflow: hidden; background: rgba(var(--ink),0.08); display: none;
}
.hg-node[data-s="running"] .hg-prog { display: block; }
.hg-prog i {
  position: absolute; inset: 0; background: rgba(var(--ink),0.62); transform-origin: left;
  animation: hg-fill var(--d, 1.6s) cubic-bezier(.4,.1,.6,1) forwards;
}
.hg-prog::after {
  content: ''; position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
  animation: hg-shim 1.1s linear infinite;
}

/* --- chips: schedule, fallback, contracts --- */
.hg-chip {
  display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px 0 7px;
  border-radius: 999px; background: rgba(255,255,255,0.72);
  box-shadow: inset 0 0 0 1px rgba(var(--ink),0.13);
  color: rgba(var(--ink),0.74); font-size: 10.5px; font-weight: 600; white-space: nowrap;
  transition: box-shadow .3s ease, color .3s ease, background-color .3s ease;
}
.hg-chip svg { width: 11px; height: 11px; flex-shrink: 0; color: rgba(var(--ink),0.55); }
.hg-chip[data-s="draft"] {
  background: transparent; color: rgba(var(--ink),0.5);
  box-shadow: none; outline: 1px dashed rgba(var(--ink),0.28); outline-offset: -1px;
}
.hg-chip[data-s="met"] { box-shadow: inset 0 0 0 1px rgba(var(--ink),0.42); color: rgba(var(--ink),0.9); }
.hg-chip[data-s="met"] svg { color: rgba(var(--ink),0.8); animation: hg-pop .35s cubic-bezier(0.34,1.56,0.64,1) both; }
.hg-chip[data-s="unmet"] { box-shadow: inset 0 0 0 1px rgba(255,149,0,0.75); color: #b25a00; background: #fff7ec; }
.hg-chip[data-s="unmet"] svg { color: #c46a00; }
.hg-trigger { height: 26px; padding: 0 11px 0 9px; font-size: 11.5px; }
.hg-trigger svg { width: 12px; height: 12px; }
.hg-node[data-s="running"] .hg-trigger {
  background: #fff; box-shadow: inset 0 0 0 1.25px rgba(var(--ink),0.7); color: rgba(var(--ink),0.92);
}
.hg-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }

/* dashed "consumes" link, with a hollow port on the card side */
.hg-conn {
  position: relative; width: 16px; height: 1.2px; flex-shrink: 0; color: rgba(var(--ink),0.3);
  background: repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 7px);
  transition: color .4s ease;
}
.hg-conn::before {
  content: ''; position: absolute; top: -2.4px; width: 6px; height: 6px; border-radius: 50%;
  background: #f6f4ef; box-shadow: inset 0 0 0 1px rgba(var(--ink),0.32);
}
.hg-l .hg-conn::before { right: -3px; }
.hg-r .hg-conn::before { left: -3px; }
.hg-node[data-s="running"] .hg-r .hg-conn { color: rgba(var(--ink),0.62); animation: hg-flow .7s linear infinite; }

/* account capsule: dashed 2/6 ring of logo tiles */
.hg-cap { position: relative; display: flex; gap: 6px; padding: 5px; transition: opacity .4s ease; }
.hg-cap-ring { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.hg-cap-ring rect {
  fill: rgba(255,255,255,0.18); stroke: rgba(var(--ink),0.3);
  stroke-width: 1.25; stroke-dasharray: 2 6;
}
.hg-tile {
  position: relative; display: grid; place-items: center;
  width: 34px; height: 34px; border-radius: 10px; background: #fff;
  box-shadow: inset 0 0 0 .7px rgba(var(--ink),0.12), 0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06);
  transition: box-shadow .35s ease;
}
.hg-tile img { width: 19px; height: 19px; object-fit: contain; display: block; }
.hg-node[data-s="draft"] .hg-cap { opacity: .42; }
.hg-node[data-s="draft"] .hg-tile { box-shadow: inset 0 0 0 .7px rgba(var(--ink),0.16); }
.hg-node[data-s="running"] .hg-tile {
  box-shadow: inset 0 0 0 1px rgba(var(--ink),0.55), 0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06);
}
.hg-node[data-s="running"] .hg-tile::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  box-shadow: 0 0 0 1px rgba(var(--ink),0.4); animation: hg-ping 1.4s ease-out infinite;
}

@keyframes hg-breath { from { opacity: .45; } to { opacity: 1; } }
@keyframes hg-flow { to { background-position: 7px 0; } }
@keyframes hg-ping { from { transform: scale(1); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
@keyframes hg-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes hg-shim { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes hg-pop { from { transform: scale(.4); opacity: 0; } }

@media (max-width: 640px) {
  .hg { --spine: 156px; gap: 14px; }
  .hg-fan { display: none; }
  .hg-row { grid-template-columns: var(--spine) minmax(0,1fr); }
  .hg-row--rx { display: grid; }
  .hg-c { grid-column: 1; grid-row: 1; }
  .hg-r { grid-column: 2; grid-row: 1; }
  .hg-l { grid-column: 2; grid-row: 1; justify-self: start; flex-direction: row-reverse; }
  .hg-l .hg-conn::before { right: auto; left: -3px; }
  .hg-row--leads .hg-l { grid-row: 2; margin: 7px 0 0 16px; }
  .hg-row--leads .hg-l .hg-conn { display: none; }
  .hg-stack { flex-direction: row; flex-wrap: wrap; align-items: flex-start; }
  .hg-card { padding: 0 10px; font-size: 12px; gap: 6px; }
  .hg-card--agent { width: var(--spine); height: 50px; }
  .hg-conn { width: 11px; }
  .hg-l .hg-conn { width: 8px; }
  .hg-cap { gap: 5px; padding: 4px; }
  .hg-tile { width: 30px; height: 30px; border-radius: 9px; }
  .hg-tile img { width: 17px; height: 17px; }
  .hg-chip { font-size: 10px; }
  /* long fallback rules wrap rather than run past the panel */
  .hg-l { max-width: 100%; }
  .hg-l .hg-chip { white-space: normal; height: auto; min-height: 22px; padding: 4px 8px 4px 7px; line-height: 1.25; }
  /* the lead counter drops under the title, so long titles keep their room */
  .hg-card--leads { height: 50px; flex-wrap: wrap; align-content: center; row-gap: 1px; }
  .hg-card--leads .hg-end { margin-left: 18px; flex-basis: 100%; font-size: 10.5px; }
  .hg-card--leads .hg-end:empty { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hg-card, .hg-card::after, .hg-conn, .hg-cap, .hg-tile, .hg-chip, .hg-edge { transition: none; }
  .hg-node[data-s="running"] .hg-card::after { animation: none; opacity: .8; }
  .hg-node[data-s="running"] .hg-r .hg-conn { animation: none; }
  .hg-node[data-s="running"] .hg-tile::after { display: none; }
  .hg-prog i { animation: none; transform: scaleX(.6); }
  .hg-prog::after { display: none; }
  .hg-chip svg, .hg-check { animation: none !important; }
}
`;

/** Small line icons for the panel: 16px grid, 1.5px stroke, currentColor. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export type IconName =
  | "clock"
  | "retry"
  | "shield"
  | "check"
  | "spark"
  | "pencil"
  | "play"
  | "pause"
  | "chat"
  | "key"
  | "fan"
  | "pulse"
  | "graph"
  | "ledger";

const ICONS: Record<IconName, ReactNode> = {
  clock: (
    <>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 5v3.2l2.1 1.3" />
    </>
  ),
  retry: (
    <>
      <path d="M3.6 8.6a4.5 4.5 0 1 0 1.3-3.8" />
      <path d="M4.6 2.4v2.6h2.6" />
    </>
  ),
  shield: (
    <>
      <path d="M8 2.2 3.4 3.9v3.5c0 3 2 5.1 4.6 6.2 2.6-1.1 4.6-3.2 4.6-6.2V3.9L8 2.2Z" />
      <path d="m6 7.9 1.4 1.4 2.7-2.9" />
    </>
  ),
  check: <path d="m3.4 8.4 2.9 2.9 6.3-6.6" />,
  spark: <path d="M8 2.3c.5 2.9 2 4.5 5 5-3 .6-4.5 2.1-5 5.2-.5-3.1-2-4.6-5-5.2 3-.5 4.5-2.1 5-5Z" />,
  pencil: (
    <>
      <path d="M10.4 3.1 12.9 5.6 5.8 12.7l-3 .5.5-3 7.1-7.1Z" />
      <path d="m9.1 4.4 2.5 2.5" />
    </>
  ),
  play: <path d="M5.2 3.6v8.8a.4.4 0 0 0 .6.35l7-4.4a.4.4 0 0 0 0-.7l-7-4.4a.4.4 0 0 0-.6.35Z" />,
  pause: <path d="M5.8 4v8M10.2 4v8" />,
  chat: <path d="M3 4.8C3 3.8 3.8 3 4.8 3h6.4c1 0 1.8.8 1.8 1.8v4.4c0 1-.8 1.8-1.8 1.8H7.2L4.3 13v-2H4.8C3.8 11 3 10.2 3 9.2V4.8Z" />,
  key: (
    <>
      <circle cx="5.6" cy="10.4" r="2.6" />
      <path d="m7.5 8.5 5-5M10.6 5.4l1.5 1.5" />
    </>
  ),
  fan: (
    <>
      <path d="M8 2.6v2.6M8 5.2C8 7.4 3.6 7 3.6 9.6M8 5.2v4.4M8 5.2c0 2.2 4.4 1.8 4.4 4.4" />
      <circle cx="3.6" cy="11.6" r="1.4" />
      <circle cx="8" cy="11.6" r="1.4" />
      <circle cx="12.4" cy="11.6" r="1.4" />
    </>
  ),
  pulse: <path d="M1.8 8.6h2.6l1.6-4.2 2.6 7.2 1.8-4.4.8 1.4h2.8" />,
  graph: (
    <>
      <rect x="2.4" y="2.2" width="5.6" height="3.2" rx="1" />
      <rect x="8" y="10.6" width="5.6" height="3.2" rx="1" />
      <path d="M5.2 5.4v2.2c0 1 .8 1.8 1.8 1.8h3c.6 0 .8.4.8.8v.4" />
    </>
  ),
  ledger: (
    <>
      <path d="M3.6 3.4c0-.7.5-1.2 1.2-1.2h7.6v9.6H4.8c-.7 0-1.2.5-1.2 1.2V3.4Z" />
      <path d="M3.6 13c0 .7.5 1.2 1.2 1.2h7.6v-2.4" />
      <path d="M6.2 5.2h3.8M6.2 7.6h2.6" />
    </>
  ),
};

/** list.bullet.rectangle, the app's routine-kind glyph. */
function RoutineGlyph() {
  return (
    <svg className="hg-glyph" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
      <rect x=".6" y="1.4" width="8.8" height="7.2" rx="1.6" fill="none" stroke="currentColor" strokeWidth=".9" />
      <circle cx="2.9" cy="3.9" r=".6" />
      <circle cx="2.9" cy="6.1" r=".6" />
      <path d="M4.4 3.9h3M4.4 6.1h3" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
    </svg>
  );
}

function Badges({ labels }: { labels: GraphLabels }) {
  return (
    <>
      <span className="hg-badge hg-badge--run">{labels.running}</span>
      <span className="hg-badge hg-badge--pause">{labels.paused}</span>
    </>
  );
}

function Check() {
  return (
    <svg className="hg-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3.4 8.4 2.9 2.9 6.3-6.6" />
    </svg>
  );
}

function Capsule({ logos }: { logos: readonly LogoKey[] }) {
  return (
    <div className="hg-cap">
      <svg className="hg-cap-ring">
        <rect width="100%" height="100%" rx="15" />
      </svg>
      {logos.map((logo) => (
        <span className="hg-tile" key={logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/assets/logos/${logo}.svg`} alt="" width={19} height={19} />
        </span>
      ))}
    </div>
  );
}

function Model({ name }: { name: string }) {
  return (
    <span className="hg-model">
      <Icon name="spark" />
      {name}
    </span>
  );
}

type Edge = { id: string; d: string; to: string; x0: number; y0: number; x1: number; y1: number };

/** Sum offsets up to the graph root: layout geometry, untouched by transforms. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return n === root ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
}

export default function HowItWorksGraph({ nodes, leads, contracts, researchMs, labels, motion }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const box = (key: string) => {
        const el = root.querySelector<HTMLElement>(`[data-n="${key}"]`);
        if (!el || !el.offsetParent || !el.offsetWidth) return null;
        return offsetIn(el, root);
      };
      const out: Edge[] = [];
      for (const [a, b] of EDGES) {
        const ra = box(a);
        const rb = box(b);
        if (!ra || !rb) continue;
        const x0 = ra.x + ra.w / 2;
        const y0 = ra.y + ra.h;
        const x1 = rb.x + rb.w / 2;
        const y1 = rb.y;
        const k = (y1 - y0) * 0.55;
        const d = Math.abs(x1 - x0) < 0.5
          ? `M${x0} ${y0}V${y1}`
          : `M${x0} ${y0}C${x0} ${y0 + k} ${x1} ${y1 - k} ${x1} ${y1}`;
        out.push({ id: `${a}-${b}`, d, to: b, x0, y0, x1, y1 });
      }
      setEdges(out);
      setSize({ w: root.offsetWidth, h: root.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, []);

  const research: NodeState = RESEARCH.some((r) => nodes[r] === "running")
    ? "running"
    : RESEARCH.every((r) => nodes[r] === "done")
      ? "done"
      : nodes.r1;
  const stateOf = (key: string): NodeState =>
    key === "rx" ? research : nodes[key as NodeKey];
  const longest = Math.max(...researchMs);

  const counter = leads === null ? null : `${leads} / ${LEADS_TARGET}`;

  return (
    <div className="hg" ref={rootRef} aria-hidden="true">
      <style href="hiw-graph" precedence="default">{CSS}</style>
      <svg className="hg-svg" width={size.w} height={size.h}>
        {edges.map((e) => (
          <path key={e.id} className="hg-edge" data-s={stateOf(e.to)} d={e.d} />
        ))}
        {edges.map((e) => (
          <g key={`${e.id}-p`}>
            <circle className="hg-port" cx={e.x0} cy={e.y0} r="2.6" />
            <circle className="hg-port" cx={e.x1} cy={e.y1} r="2.6" />
          </g>
        ))}
        {motion &&
          edges
            .filter((e) => stateOf(e.to) === "running")
            .map((e) => (
              <circle key={`${e.id}-dot`} className="hg-dot" r="2.2">
                <animateMotion dur="1.2s" repeatCount="indefinite" path={e.d} />
              </circle>
            ))}
      </svg>

      {/* schedule trigger, with the routine's fallback rule on the left */}
      <div className="hg-row hg-node" data-s={nodes.trigger} style={{ "--row": 0 } as CSSProperties}>
        <div className="hg-l">
          <span className="hg-chip" data-s={nodes.trigger === "draft" ? "draft" : "open"}>
            <Icon name="retry" />
            {labels.fallback}
          </span>
          <span className="hg-conn" />
        </div>
        <div className="hg-c">
          <span className="hg-chip hg-trigger" data-n="trigger" data-s={nodes.trigger === "draft" ? "draft" : "open"}>
            <Icon name="clock" />
            {labels.schedule}
          </span>
        </div>
      </div>

      {/* four research agents in parallel (one "×4" card on phones) */}
      <div className="hg-fan">
        {RESEARCH.map((r, i) => (
          <div className="hg-node" data-s={nodes[r]} key={r} style={{ "--i": i } as CSSProperties}>
            <div className="hg-card hg-card--agent" data-n={r}>
              <Badges labels={labels} />
              <span className="hg-title">
                <RoutineGlyph />
                <span>{labels.research}</span>
              </span>
              <Model name="Haiku" />
              <Check />
              <span className="hg-prog">
                <i style={{ "--d": `${researchMs[i]}ms` } as CSSProperties} />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="hg-row hg-row--rx hg-node" data-s={research} style={{ "--row": 1 } as CSSProperties}>
        <div className="hg-c">
          <div className="hg-card hg-card--agent" data-n="rx">
            <Badges labels={labels} />
            <span className="hg-title">
              <RoutineGlyph />
              <span>{labels.research} ×4</span>
            </span>
            <Model name="Haiku" />
            <Check />
            <span className="hg-prog">
              <i style={{ "--d": `${longest}ms` } as CSSProperties} />
            </span>
          </div>
        </div>
      </div>

      <div className="hg-row hg-node" data-s={nodes.merge} style={{ "--row": 2 } as CSSProperties}>
        <div className="hg-c">
          <div className="hg-card hg-card--step" data-n="merge">
            <Badges labels={labels} />
            <span>{labels.merge}</span>
          </div>
        </div>
      </div>

      <div className="hg-row hg-node" data-s={nodes.review} style={{ "--row": 3 } as CSSProperties}>
        <div className="hg-c">
          <div className="hg-card" data-n="review">
            <Badges labels={labels} />
            <RoutineGlyph />
            <span>{labels.review}</span>
            <span className="hg-end">
              <Model name="Opus" />
              <Check />
            </span>
          </div>
        </div>
      </div>

      <div className="hg-row hg-row--leads hg-node" data-s={nodes.leads} style={{ "--row": 4 } as CSSProperties}>
        <div className="hg-l">
          <span className="hg-stack">
            <span className="hg-chip" data-s={contracts.min}>
              <Icon name={contracts.min === "met" ? "check" : "shield"} />
              {labels.min}
            </span>
            <span className="hg-chip" data-s={contracts.unique}>
              <Icon name={contracts.unique === "met" ? "check" : "shield"} />
              {labels.unique}
            </span>
          </span>
          <span className="hg-conn" />
        </div>
        <div className="hg-c">
          <div className="hg-card hg-card--leads" data-n="leads">
            <Badges labels={labels} />
            <RoutineGlyph />
            <span>{labels.findLeads}</span>
            <span className="hg-end">{counter}</span>
          </div>
        </div>
        <div className="hg-r">
          <span className="hg-conn" />
          <Capsule logos={["linkedin"]} />
        </div>
      </div>

      <div className="hg-row hg-node" data-s={nodes.design} style={{ "--row": 5 } as CSSProperties}>
        <div className="hg-c">
          <div className="hg-card" data-n="design">
            <Badges labels={labels} />
            <RoutineGlyph />
            <span>{labels.design}</span>
            <span className="hg-end">
              <Check />
            </span>
          </div>
        </div>
        <div className="hg-r">
          <span className="hg-conn" />
          <Capsule logos={["figma", "higgsfield"]} />
        </div>
      </div>

      <div className="hg-row hg-node" data-s={nodes.publish} style={{ "--row": 6 } as CSSProperties}>
        <div className="hg-c">
          <div className="hg-card" data-n="publish">
            <Badges labels={labels} />
            <RoutineGlyph />
            <span>{labels.publish}</span>
            <span className="hg-end">
              <Check />
            </span>
          </div>
        </div>
        <div className="hg-r">
          <span className="hg-conn" />
          <Capsule logos={["threads", "facebook", "instagram"]} />
        </div>
      </div>
    </div>
  );
}
