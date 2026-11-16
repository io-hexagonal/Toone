"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { LogoKey } from "@/components/RoutineChain";

/**
 * The routine graph inside "How it works": the request from step 1 as Toone
 * parsed it. It draws whatever workflow the caller describes (`GraphSpec`):
 * rows of steps top to bottom, a row of several steps being agents that run in
 * parallel. Each step can carry its model, the accounts it uses, a counter,
 * rules (contracts, a fallback, "ask me first") and a review loop back to an
 * earlier step. The first step carries the schedule.
 *
 * Same visual language as RoutineChain (ink on cream, the app's 10px-radius
 * cards, dashed "consumes" links to dashed account capsules; running = the
 * app's white treatment, paused = the app's caution orange), laid out around
 * a centred spine: rules on the left, accounts on the right, the model inside
 * each card. Rules on a parallel agent sit on its outgoing edge.
 *
 * The edges are drawn in one SVG measured from the laid-out cards (offset
 * geometry, so the pop-in transforms don't skew them), which keeps the curves
 * right in every language and at every width. Under 640px a parallel row
 * collapses into one card.
 *
 * Presentational: the caller owns every state. Decorative (aria-hidden); the
 * surrounding copy carries the meaning.
 */

export type NodeState = "draft" | "idle" | "running" | "done" | "paused";
export type ContractState = "draft" | "open" | "met" | "unmet";

export type ChipSpec = { key: string; icon: IconName };
export type NodeSpec = {
  id: string;
  /** Who runs the step: a key into `labels.agents`. */
  agent: string;
  model?: string;
  logos?: readonly LogoKey[];
  /** Rules on this step: contracts, a fallback, "ask me first". */
  chips?: readonly ChipSpec[];
  /** Shows the scenario's counter. */
  counter?: boolean;
  /** One agent per item: drawn as a stack with "×N". */
  each?: number;
};
export type GraphSpec = {
  /**
   * Top to bottom. An array is a row of parallel lanes; a lane is one step or
   * a short chain of steps (an array again).
   */
  rows: readonly (NodeSpec | readonly (NodeSpec | readonly NodeSpec[])[])[];
  /** A review loop: `from` sends work back to `to`. `chip` labels it. */
  loop?: { from: string; to: string; chip: string };
};

export type GraphLabels = {
  schedule: string;
  fallback: string;
  /** Title of the single card that replaces the parallel row on phones. */
  parallelShort: string;
  nodes: Record<string, string>;
  agents: Record<string, string>;
  chips: Record<string, string>;
  running: string;
  paused: string;
};

type Props = {
  spec: GraphSpec;
  nodes: Record<string, NodeState>;
  chips: Record<string, ContractState>;
  /** The counter's text; null hides it. */
  counter: string | null;
  /** The review loop is sending work back right now. */
  looping: boolean;
  /** How long each parallel agent runs, for its progress bar (ms). */
  durations: Record<string, number>;
  /** Steps on their second pass: shown as "×2". */
  again: readonly string[];
  labels: GraphLabels;
  motion: boolean;
};

const CSS = `
.hg {
  --ink: 29,28,25; --spine: min(190px, calc((100cqw - 20px) / 3));
  container-type: inline-size;
  position: relative; display: flex; flex-direction: column; gap: 16px; padding-top: 12px;
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
  grid-template-columns: repeat(var(--n, 4), minmax(0, var(--spine))); justify-content: center; align-items: stretch;
}
.hg-row--rx { display: none; }
.hg-col { display: flex; flex-direction: column; align-items: center; min-width: 0; }
.hg-col .hg-card--agent { width: 100%; }
.hg-step { margin-right: 1px; color: rgba(var(--ink),0.66); font-size: 10.5px; font-weight: 600; white-space: nowrap; }
/* rules on a parallel agent's output sit on its outgoing edge */
.hg-thread { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; margin: 10px 0; }
.hg-thread:last-child { margin-bottom: 0; }
.hg-thread .hg-chip { background: #fbfaf7; }
.hg-thread .hg-chip[data-s="draft"] { background: #f4f2ed; }

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
  width: var(--spine); height: 54px; flex-direction: column; align-items: flex-start;
  justify-content: center; gap: 3px; padding: 0 10px 2px;
}
.hg-card--each {
  box-shadow: 0 4px 0 -2px #f8f7f3, 0 4px 0 -0.75px rgba(var(--ink),0.16),
    0 8px 0 -4px #f8f7f3, 0 8px 0 -2.75px rgba(var(--ink),0.12);
}
/* when the routine runs: a tag on its first step */
.hg-when {
  position: absolute; top: -11px; left: 10px; z-index: 2;
  display: inline-flex; align-items: center; gap: 3px; height: 17px; white-space: nowrap; padding: 0 7px 0 5px;
  border-radius: 999px; background: #f8f7f3; box-shadow: inset 0 0 0 .75px rgba(var(--ink),0.28);
  color: rgba(var(--ink),0.72); font-size: 9.5px; font-weight: 700; letter-spacing: .01em;
}
.hg-when svg { width: 10px; height: 10px; }
.hg-node[data-s="draft"] .hg-when { box-shadow: none; outline: 1px dashed rgba(var(--ink),0.3); outline-offset: -1px; color: rgba(var(--ink),0.5); }
.hg-sub { display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0; }
.hg-mini { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; }
.hg-n + .hg-mini { margin-left: 8px; }
.hg-mini span {
  display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; background: #fff;
  box-shadow: inset 0 0 0 .7px rgba(var(--ink),0.14), 0 1px 2px rgba(0,0,0,0.05);
}
.hg-mini img { width: 12px; height: 12px; display: block; object-fit: contain; }
.hg-node[data-s="running"] .hg-mini span { box-shadow: inset 0 0 0 1px rgba(var(--ink),0.5), 0 1px 2px rgba(0,0,0,0.05); }
.hg-card--agent { padding-bottom: 0; }
/* the first step carries the schedule tag on its top edge: its text sits a little lower */
.hg-card--first { padding-top: 8px; }
.hg-sub { min-height: 20px; }
.hg-node[data-s="draft"] .hg-mini { opacity: .5; }
.hg-n { margin-left: auto; color: rgba(var(--ink),0.58); font-size: 10.5px; font-weight: 600; font-variant-numeric: tabular-nums; }
.hg-node[data-s="paused"] .hg-n { color: #b25a00; }
.hg-loop { fill: none; stroke: rgba(var(--ink),0.3); stroke-width: 1.2; stroke-dasharray: 3 4; transition: stroke .3s ease; }
.hg-loop[data-on] { stroke: rgba(var(--ink),0.7); }
.hg-loop-head { fill: rgba(var(--ink),0.42); transition: fill .3s ease; }
.hg-loop-head[data-on] { fill: rgba(var(--ink),0.8); }
.hg-title { display: flex; align-items: center; gap: 6px; min-width: 0; }
.hg-title span { overflow: hidden; text-overflow: ellipsis; }
.hg-card--agent .hg-title { max-width: calc(100% - 14px); }
.hg-ring { width: 13px; height: 13px; flex-shrink: 0; color: rgba(var(--ink),0.42); }
.hg-ring .hg-ring-c { fill: none; stroke: currentColor; stroke-width: 1.2; stroke-dasharray: 2.2 2.2; }
.hg-ring .hg-ring-t { display: none; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.hg-node[data-s="running"] .hg-ring { color: rgba(var(--ink),0.85); animation: hg-spin 1.6s linear infinite; }
.hg-node[data-s="running"] .hg-ring-c { stroke-dasharray: 20 14; }
.hg-node[data-s="done"] .hg-ring { color: #4d8a63; }
.hg-node[data-s="done"] .hg-ring-c { stroke-dasharray: none; }
.hg-node[data-s="done"] .hg-ring-t { display: block; animation: hg-pop .35s cubic-bezier(0.34,1.56,0.64,1) both; transform-origin: center; }
.hg-node[data-s="paused"] .hg-ring { color: #c46a00; }
.hg-node[data-s="paused"] .hg-ring-c { stroke-dasharray: none; }
.hg-times { color: rgba(var(--ink),0.6); font-size: 10.5px; font-weight: 600; }
.hg-arrow { fill: rgba(var(--ink),0.38); }
.hg-lane-gap { height: 18px; }
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
.hg-card--agent .hg-badge { right: 9px; }

/* draft: proposed, not yet real */
.hg-node[data-s="draft"] .hg-card {
  border-style: dashed; border-color: rgba(var(--ink),0.3);
  background: rgba(255,255,255,0.22); color: rgba(var(--ink),0.5);
}
.hg-node[data-s="draft"] .hg-ring,
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
  position: absolute; left: 10px; right: 10px; bottom: 3px; height: 2px;
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
@keyframes hg-spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .hg { --spine: 156px; gap: 14px; }
  .hg-fan { display: none; }
  .hg-when { left: 8px; }
  .hg-row { grid-template-columns: var(--spine) minmax(0,1fr); }
  .hg-row--rx { display: grid; }
  .hg-c { grid-column: 1; grid-row: 1; }
  .hg-r { grid-column: 2; grid-row: 1; }
  .hg-l { grid-column: 2; grid-row: 1; justify-self: start; flex-direction: row-reverse; }
  .hg-l .hg-conn::before { right: auto; left: -3px; }
  .hg-row--chips .hg-l { grid-row: 2; margin: 7px 0 0 16px; }
  .hg-row--chips .hg-l .hg-conn { display: none; }
  .hg-stack { flex-direction: row; flex-wrap: wrap; align-items: flex-start; }
  .hg-card { padding: 0 10px; font-size: 12px; gap: 6px; }
  .hg-card--agent { width: var(--spine); height: 54px; }
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
  .hg-card--count { height: 50px; flex-wrap: wrap; align-content: center; row-gap: 1px; }
  .hg-card--count .hg-end { margin-left: 18px; flex-basis: 100%; font-size: 10.5px; }
  .hg-card--count .hg-end:empty { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hg-card, .hg-card::after, .hg-conn, .hg-cap, .hg-tile, .hg-chip, .hg-edge { transition: none; }
  .hg-node[data-s="running"] .hg-card::after { animation: none; opacity: .8; }
  .hg-node[data-s="running"] .hg-r .hg-conn { animation: none; }
  .hg-node[data-s="running"] .hg-tile::after { display: none; }
  .hg-prog i { animation: none; transform: scaleX(.6); }
  .hg-prog::after { display: none; }
  .hg-chip svg, .hg-check, .hg-ring, .hg-ring-t { animation: none !important; }
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

/** The app's step status: dashed ring (waiting), turning (running), check (done). */
function RoutineGlyph() {
  return (
    <svg className="hg-ring" viewBox="0 0 14 14" aria-hidden="true">
      <circle className="hg-ring-c" cx="7" cy="7" r="5.6" />
      <path className="hg-ring-t" d="m4.5 7.2 1.7 1.7 3.3-3.6" />
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
  return null;
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

function Mini({ logos }: { logos: readonly LogoKey[] }) {
  return (
    <span className="hg-mini">
      {logos.map((logo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <span key={logo}><img src={`/assets/logos/${logo}.svg`} alt="" width={12} height={12} /></span>
      ))}
    </span>
  );
}

type Edge = { id: string; d: string; to: string; ax: number; ay: number };
type Port = { id: string; x: number; y: number };
type Lane = readonly NodeSpec[];

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

/** A row as lanes: a single step is one lane of one. */
function lanesOf(row: GraphSpec["rows"][number]): Lane[] {
  if (!Array.isArray(row)) return [[row as NodeSpec]];
  return (row as readonly (NodeSpec | Lane)[]).map((cell) => (Array.isArray(cell) ? (cell as Lane) : [cell as NodeSpec]));
}

export default function HowItWorksGraph({ spec, nodes, chips, counter, looping, durations, again, labels, motion }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loop, setLoop] = useState<{ d: string; head: string } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Row by row: every lane's last step links to every first step of the next
  // row, and a lane's own steps link in order. "rx" stands for a parallel
  // row's single card on phones.
  const rows = spec.rows.map(lanesOf);
  const pairs: string[] = [];
  rows.forEach((lanes, i) => {
    for (const lane of lanes) lane.slice(1).forEach((n, j) => pairs.push(`${lane[j].id}>${n.id}`));
    const next = rows[i + 1];
    if (!next) return;
    const outs = lanes.map((lane) => lane[lane.length - 1].id);
    const ins = next.map((lane) => lane[0].id);
    for (const a of outs) for (const b of ins) pairs.push(`${a}>${b}`);
    if (outs.length > 1) for (const b of ins) pairs.push(`rx>${b}`);
    if (ins.length > 1) for (const a of outs) pairs.push(`${a}>rx`);
  });
  const pairKey = pairs.join("|");
  const loopTo = spec.loop?.to ?? "";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const box = (selector: string) => {
        const el = root.querySelector<HTMLElement>(selector);
        if (!el || !el.offsetParent || !el.offsetWidth) return null;
        return offsetIn(el, root);
      };
      const out: Edge[] = [];
      const dots: Port[] = [];
      for (const pair of pairKey.split("|")) {
        const [a, b] = pair.split(">");
        const card = box(`[data-n="${a}"]`);
        // A lane's edge leaves from under its last rules, if it has any.
        const ra = box(`[data-o="${a}"]`) ?? card;
        const rb = box(`[data-n="${b}"]`);
        if (!card || !ra || !rb) continue;
        const x0 = ra.x + ra.w / 2;
        const y0 = ra.y + ra.h;
        const x1 = rb.x + rb.w / 2;
        const y1 = rb.y - 4;
        const k = (y1 - y0) * 0.55;
        const top = card.y + card.h;
        const d = Math.abs(x1 - x0) < 0.5
          ? `M${x0} ${top}V${y1}`
          : `${y0 - top > 1 ? `M${x0} ${top}V${y0}` : ""}M${x0} ${y0}C${x0} ${y0 + k} ${x1} ${y1 - k} ${x1} ${y1}`;
        out.push({ id: `${a}-${b}`, d, to: b, ax: x1, ay: y1 + 4 });
        dots.push({ id: `${a}-${b}`, x: x0, y: top });
      }
      setEdges(out);
      setPorts(dots);
      const chip = loopTo ? box('[data-n="loop"]') : null;
      const back = loopTo ? box(`[data-n="${loopTo}"]`) : null;
      if (chip && back) {
        const x0 = chip.x + chip.w / 2;
        const y0 = chip.y;
        const x1 = back.x + back.w + 6;
        const y1 = back.y + back.h / 2;
        const r = Math.min(10, (y0 - y1) / 2);
        setLoop({
          d: `M${x0} ${y0}V${y1 + r}Q${x0} ${y1} ${x0 - r} ${y1}H${x1}`,
          head: `M${x1 - 6} ${y1}l7 -3.6v7.2Z`,
        });
      } else setLoop(null);
      setSize({ w: root.offsetWidth, h: root.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [pairKey, loopTo]);

  const fan = (rows.find((lanes) => lanes.length > 1) ?? []).flat().map((n) => n.id);
  const fanState: NodeState = fan.some((id) => nodes[id] === "paused")
    ? "paused"
    : fan.some((id) => nodes[id] === "running")
      ? "running"
      : fan.length && fan.every((id) => nodes[id] === "done")
        ? "done"
        : nodes[fan[0]] ?? "idle";
  const stateOf = (key: string): NodeState => (key === "rx" ? fanState : nodes[key]);
  const first = rows[0]?.[0]?.[0]?.id;

  const chip = (c: ChipSpec) => {
    const state = chips[c.key] ?? "open";
    return (
      <span className="hg-chip" data-s={state} key={c.key}>
        <Icon name={state === "met" && c.icon === "shield" ? "check" : c.icon} />
        {labels.chips[c.key]}
      </span>
    );
  };
  /** Every step is the same card: title, then its number, model and details. */
  const card = (n: NodeSpec, extra?: ReactNode) => (
    <div className={`hg-card hg-card--agent${n.each ? " hg-card--each" : ""}${extra ? " hg-card--first" : ""}`} data-n={n.id}>
      {extra}
      <Badges labels={labels} />
      <span className="hg-title">
        <RoutineGlyph />
        <span>{labels.nodes[n.id]}</span>
      </span>
      <span className="hg-sub">
        <span className="hg-step">{labels.agents[n.agent]}</span>
        {n.model && <Model name={n.model} />}
        {n.each && <span className="hg-times">×{n.each}</span>}
        {again.includes(n.id) && <span className="hg-times">×2</span>}
        {n.counter && counter !== null && <span className="hg-n">{counter}</span>}
        {n.logos && <Mini logos={n.logos} />}
      </span>
      <span className="hg-prog">
        <i style={{ "--d": `${durations[n.id] ?? 1600}ms` } as CSSProperties} />
      </span>
    </div>
  );

  return (
    <div className="hg" ref={rootRef} aria-hidden="true">
      <style href="hiw-graph" precedence="default">{CSS}</style>
      <svg className="hg-svg" width={size.w} height={size.h}>
        {edges.map((e) => (
          <path key={e.id} className="hg-edge" data-s={stateOf(e.to)} d={e.d} />
        ))}
        {edges.map((e) => (
          <path key={`${e.id}-a`} className="hg-arrow" d={`M${e.ax} ${e.ay}l-3.4 -6.4h6.8Z`} />
        ))}
        {loop && (
          <>
            <path className="hg-loop" data-on={looping ? "" : undefined} d={loop.d} />
            <path className="hg-loop-head" data-on={looping ? "" : undefined} d={loop.head} />
          </>
        )}
        {ports.map((p) => (
          <circle key={p.id} className="hg-port" cx={p.x} cy={p.y} r="2.6" />
        ))}
        {motion &&
          edges
            .filter((e) => stateOf(e.to) === "running")
            .map((e) => (
              <circle key={`${e.id}-dot`} className="hg-dot" r="2.2">
                <animateMotion dur="1.2s" repeatCount="indefinite" path={e.d} />
              </circle>
            ))}
        {motion && looping && loop && (
          <circle className="hg-dot" r="2.2">
            <animateMotion dur="1s" repeatCount="indefinite" path={loop.d} />
          </circle>
        )}
      </svg>

      {rows.map((lanes, r) => {
        if (lanes.length > 1) {
          const all = lanes.flat();
          const longest = Math.max(...all.map((n) => durations[n.id] ?? 0));
          const most = Math.max(0, ...lanes.flatMap((lane) => lane.slice(0, -1).map((n) => n.chips?.length ?? 0)));
          const between = most ? most * 26 - 4 : 0;
          return (
            <div key={`fan-${r}`} style={{ display: "contents" }}>
              <div className="hg-fan" style={{ "--n": lanes.length } as CSSProperties}>
                {lanes.map((lane, i) => (
                  <div className="hg-col" data-o={lane[lane.length - 1].id} key={lane[0].id} style={{ "--i": i } as CSSProperties}>
                    {lane.map((n, j) => (
                      <div className="hg-node" data-s={nodes[n.id]} key={n.id} style={{ display: "contents" }}>
                        {card(n)}
                        {j < lane.length - 1 ? (
                          <div className="hg-thread" style={{ minHeight: between }}>{(n.chips ?? []).map(chip)}</div>
                        ) : (
                          n.chips && <div className="hg-thread">{n.chips.map(chip)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="hg-row hg-row--rx hg-node" data-s={fanState} style={{ "--row": r } as CSSProperties}>
                <div className="hg-c">
                  <div className="hg-card hg-card--agent" data-n="rx">
                    <Badges labels={labels} />
                    <span className="hg-title">
                      <RoutineGlyph />
                      <span>{labels.parallelShort}</span>
                    </span>
                    <span className="hg-sub">
                      <span className="hg-step">{labels.agents[all[0].agent]}</span>
                      {all[0].model && <Model name={all[0].model} />}
                      {all.some((n) => n.counter) && counter !== null && <span className="hg-n">{counter}</span>}
                    </span>
                    <span className="hg-prog">
                      <i style={{ "--d": `${longest || 1600}ms` } as CSSProperties} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        const n = lanes[0][0];
        const isFirst = n.id === first;
        const left = [...(isFirst ? [{ key: "__fallback", icon: "retry" as IconName }] : []), ...(n.chips ?? [])];
        const loops = spec.loop?.from === n.id ? spec.loop : null;
        return (
          <div
            className={`hg-row hg-node${left.length ? " hg-row--chips" : ""}`}
            data-s={nodes[n.id]}
            key={n.id}
            style={{ "--row": r } as CSSProperties}
          >
            {left.length > 0 && (
              <div className="hg-l">
                <span className="hg-stack">
                  {left.map((c) =>
                    c.key === "__fallback" ? (
                      <span className="hg-chip" data-s={nodes[n.id] === "draft" ? "draft" : "open"} key={c.key}>
                        <Icon name="retry" />
                        {labels.fallback}
                      </span>
                    ) : (
                      chip(c)
                    ),
                  )}
                </span>
                <span className="hg-conn" />
              </div>
            )}
            <div className="hg-c">
              {card(
                n,
                isFirst && (
                  <span className="hg-when">
                    <Icon name="clock" />
                    {labels.schedule}
                  </span>
                ),
              )}
            </div>
            {loops && (
              <div className="hg-r">
                <span className="hg-conn" />
                {(
                  <span className="hg-chip hg-chip--loop" data-n="loop" data-s={chips[loops.chip] ?? "open"}>
                    <Icon name="retry" />
                    {labels.chips[loops.chip]}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
