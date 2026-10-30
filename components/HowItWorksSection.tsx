"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import HowItWorksGraph, {
  Icon,
  type ContractState,
  type IconName,
  type NodeKey,
  type NodeState,
} from "@/components/HowItWorksGraph";

/**
 * "How it works": a three-step stepper (all steps open, the active one
 * highlighted) beside one framed panel. The panel keeps the same routine graph
 * in every step (the request from step 1, as Toone parsed it) and swaps the
 * card above it: the request (Describe it), the live run log (Watch it run),
 * the paused step with an edit and Resume (Pause, edit, resume).
 *
 * One clock drives everything. It only ticks while the panel is in view and
 * nothing in the stepper is hovered or keyboard-focused; it fills the active
 * step's progress bar and advances the step when full. Each step's frame is a
 * pure function of the elapsed time (`frameAt`), so pausing the clock pauses
 * the whole scene. Reduced motion: no clock, one still frame per step.
 *
 * The three cards share one grid cell, so the panel is always as tall as the
 * tallest card in the current language: no layout shift between steps.
 */
const STEPS = ["describe", "run", "resume"] as const;
const DURATIONS = [7200, 10400, 9600];
const CHIPS: Record<(typeof STEPS)[number], readonly (readonly [string, IconName])[]> = {
  describe: [
    ["words", "chat"],
    ["schedule", "clock"],
    ["accounts", "key"],
  ],
  run: [
    ["parallel", "fan"],
    ["models", "spark"],
    ["live", "pulse"],
  ],
  resume: [
    ["contracts", "shield"],
    ["fallbacks", "retry"],
    ["resume", "play"],
  ],
};
const LOG = ["research", "merge", "review", "leads", "contract", "design", "publish"] as const;

// --- the run, in ms from the start of each step ---
const R_START = 300;
const R_END = [1900, 2500, 1700, 2250];
const RUN = {
  merge: [2600, 3300],
  review: [3300, 4400],
  leads: [4400, 6500],
  design: [6500, 7800],
  publish: [7800, 9100],
} as const;
const COUNT_FROM = 4500;
const COUNT_MS = 1600;
const LOG_AT = [R_START, RUN.merge[0], RUN.review[0], RUN.leads[0], COUNT_FROM + COUNT_MS + 50, RUN.design[0], RUN.publish[0]];
// --- the pause ---
const PAUSED_AT = 12;
const TYPE_FROM = 700;
const TYPE_MS = 1500;
const PRESS_AT = 5700;
const RESUME_AT = 6100;
const RECOUNT_FROM = 6300;
const RECOUNT_MS = 1900;

type Frame = {
  nodes: Record<NodeKey, NodeState>;
  leads: number | null;
  min: ContractState;
  unique: ContractState;
  /** Index into LOG of the newest line shown, -1 for none. */
  log: number;
  logDone: boolean;
  /** Share of the edit typed so far, 0..1. */
  typed: number;
  pressed: boolean;
  resumed: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const span = (t: number, a: number, b: number): NodeState => (t < a ? "idle" : t < b ? "running" : "done");

function nodesAll(state: NodeState): Record<NodeKey, NodeState> {
  return {
    trigger: state, r1: state, r2: state, r3: state, r4: state,
    merge: state, review: state, leads: state, design: state, publish: state,
  };
}

function frameAt(step: number, t: number): Frame {
  if (step === 0) {
    return { nodes: nodesAll("draft"), leads: null, min: "draft", unique: "draft", log: -1, logDone: false, typed: 0, pressed: false, resumed: false };
  }
  if (step === 1) {
    const count = clamp(Math.floor(((t - COUNT_FROM) / COUNT_MS) * 20), 0, 20);
    const met = count >= 20 ? "met" : "open";
    let log = -1;
    LOG_AT.forEach((at, i) => {
      if (t >= at) log = i;
    });
    return {
      nodes: {
        trigger: t < R_START ? "running" : "done",
        r1: span(t, R_START, R_END[0]),
        r2: span(t, R_START, R_END[1]),
        r3: span(t, R_START, R_END[2]),
        r4: span(t, R_START, R_END[3]),
        merge: span(t, ...RUN.merge),
        review: span(t, ...RUN.review),
        leads: span(t, ...RUN.leads),
        design: span(t, ...RUN.design),
        publish: span(t, ...RUN.publish),
      },
      leads: t < RUN.leads[0] ? null : count,
      min: met,
      unique: met,
      log,
      logDone: t >= RUN.publish[1],
      typed: 0,
      pressed: false,
      resumed: false,
    };
  }
  const resumed = t >= RESUME_AT;
  const count = resumed
    ? clamp(PAUSED_AT + Math.floor(((t - RECOUNT_FROM) / RECOUNT_MS) * (20 - PAUSED_AT)), PAUSED_AT, 20)
    : PAUSED_AT;
  const leadsDone = count >= 20 && t >= RECOUNT_FROM + RECOUNT_MS + 300;
  return {
    nodes: {
      ...nodesAll("done"),
      leads: !resumed ? "paused" : leadsDone ? "done" : "running",
      design: leadsDone ? "running" : "idle",
      publish: "idle",
    },
    leads: count,
    min: count >= 20 ? "met" : resumed ? "open" : "unmet",
    unique: "met",
    log: -1,
    logDone: false,
    typed: clamp((t - TYPE_FROM) / TYPE_MS, 0, 1),
    pressed: t >= PRESS_AT && t < RESUME_AT,
    resumed,
  };
}

/** Reduced motion: one still frame per step. */
const STILL: Frame[] = [
  frameAt(0, 0),
  { ...frameAt(1, RUN.design[0] + 400), logDone: false },
  { ...frameAt(2, TYPE_FROM + TYPE_MS + 100) },
];

export default function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const g = useTranslations("landing.routineGraph");
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const elapsed = useRef(0);
  const hold = useRef({ live: false, hover: false, focus: false });
  const [active, setActive] = useState(0);
  const [frame, setFrame] = useState<Frame>(() => frameAt(0, 0));
  const [held, setHeld] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function updateHold(patch: Partial<typeof hold.current>) {
    Object.assign(hold.current, patch);
    const h = hold.current;
    setHeld(!h.live || h.hover || h.focus);
  }

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const io = new IntersectionObserver(([entry]) => {
      updateHold({ live: entry.isIntersecting });
      if (entry.isIntersecting) setSeen(true);
    }, {
      threshold: 0.4,
    });
    io.observe(panel);
    return () => io.disconnect();
  }, []);

  // The clock: elapsed time of the active step, ticking only while not held.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    let key = "";
    const loop = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const h = hold.current;
      if (h.live && !h.hover && !h.focus) {
        elapsed.current += dt;
        const duration = DURATIONS[active];
        if (elapsed.current >= duration) {
          elapsed.current = 0;
          setActive((active + 1) % STEPS.length);
          return;
        }
        barRef.current?.style.setProperty("transform", `scaleX(${elapsed.current / duration})`);
        const next = frameAt(active, elapsed.current);
        const nextKey = JSON.stringify(next);
        if (nextKey !== key) {
          key = nextKey;
          setFrame(next);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

  function select(index: number, focus = false) {
    elapsed.current = 0;
    setActive(index);
    setFrame(frameAt(index, 0));
    if (focus) tabRefs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = STEPS.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? active === last ? 0 : active + 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? active === 0 ? last : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next, true);
  }

  const view = reduced ? STILL[active] : frame;
  const panelId = `${id}-panel`;
  const edit = t("pause.edit");
  const typed = edit.slice(0, Math.round(view.typed * edit.length));
  const pauseState: NodeState = view.resumed ? "running" : "paused";
  const firstLog = 0;

  const labels = {
    schedule: t("graph.schedule"),
    fallback: t("graph.fallback"),
    research: t("graph.research"),
    merge: t("graph.merge"),
    review: t("graph.review"),
    findLeads: t("graph.findLeads"),
    design: t("graph.design"),
    publish: t("graph.publish"),
    min: t("graph.min"),
    unique: t("graph.unique"),
    running: g("running"),
    paused: g("paused"),
  };

  const mark = (chunks: ReactNode) => <span className="hiw-k">{chunks}</span>;

  return (
    <section
      className="section hiw"
      id="how-it-works"
      data-held={held ? "" : undefined}
      data-seen={seen ? "" : undefined}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hiw-grid {
              display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
              gap: 48px; align-items: start;
            }

            /* --- the step list: every step open, the active one in full ink --- */
            .hiw-steps { display: flex; flex-direction: column; }
            .hiw-step { position: relative; border-bottom: 1px solid rgba(29,28,25,0.1); }
            .hiw-step:first-child { border-top: 1px solid rgba(29,28,25,0.1); }
            .hiw-tab {
              all: unset; box-sizing: border-box; cursor: pointer; display: grid;
              grid-template-columns: 30px minmax(0, 1fr); width: 100%;
              padding: 22px 4px 24px 2px; border-radius: 6px;
            }
            .hiw-tab:focus-visible { outline: 2px solid #1d1c19; outline-offset: 2px; }
            .hiw-num {
              padding-top: 4px; font-size: 13px; font-weight: 600;
              font-variant-numeric: tabular-nums; color: rgba(29,28,25,0.38);
              transition: color 0.25s;
            }
            .hiw-title {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: 20px; font-weight: 500; letter-spacing: -0.015em; line-height: 1.25;
              color: rgba(29,28,25,0.44); transition: color 0.25s;
            }
            .hiw-body {
              display: block; grid-column: 2; margin-top: 8px; max-width: 46ch;
              color: rgba(29,28,25,0.44); font-size: 14.5px; line-height: 1.55;
              transition: color 0.25s;
            }
            .hiw-chips { grid-column: 2; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
            .hiw-chip {
              display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 8px;
              border-radius: 999px; background: rgba(255,255,255,0.4);
              box-shadow: inset 0 0 0 1px rgba(29,28,25,0.1);
              color: rgba(29,28,25,0.5); font-size: 12px; font-weight: 550; white-space: nowrap;
              transition: color 0.25s, background-color 0.25s, box-shadow 0.25s;
            }
            .hiw-chip svg { width: 13px; height: 13px; flex-shrink: 0; color: rgba(29,28,25,0.42); transition: color 0.25s; }
            .hiw-tab:hover .hiw-title, .hiw-tab:hover .hiw-num { color: rgba(29,28,25,0.72); }
            .hiw-tab:hover .hiw-body { color: rgba(29,28,25,0.58); }
            .hiw-tab[aria-selected="true"] .hiw-num { color: #1d1c19; }
            .hiw-tab[aria-selected="true"] .hiw-title { color: #1d1c19; }
            .hiw-tab[aria-selected="true"] .hiw-body { color: rgba(29,28,25,0.64); }
            .hiw-tab[aria-selected="true"] .hiw-chip {
              background: rgba(255,255,255,0.78); color: rgba(29,28,25,0.8);
              box-shadow: inset 0 0 0 1px rgba(29,28,25,0.14);
            }
            .hiw-tab[aria-selected="true"] .hiw-chip svg { color: rgba(29,28,25,0.55); }
            /* the active step's bottom rule fills as the step plays */
            .hiw-bar {
              position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; z-index: 1;
              background: #1d1c19; transform: scaleX(0); transform-origin: left;
            }

            /* --- the panel: the app's graph container, on cream --- */
            .hiw-panel {
              display: flex; flex-direction: column; gap: 26px;
              padding: 28px 30px 32px;
              border: 1px solid rgba(29,28,25,0.1); border-radius: 18px;
              background:
                radial-gradient(rgba(29,28,25,0.065) 1px, transparent 1.2px) 0 0 / 18px 18px,
                #f6f4ef;
            }
            .hiw-cards { display: grid; }
            .hiw-card {
              grid-area: 1 / 1; display: flex; flex-direction: column;
              padding: 15px 17px 16px; border-radius: 14px; background: #fff;
              box-shadow: inset 0 0 0 1px rgba(29,28,25,0.1), 0 1px 2px rgba(29,28,25,0.04), 0 6px 18px rgba(29,28,25,0.05);
              color: rgba(29,28,25,0.86); font-size: 13.5px; line-height: 1.55;
              visibility: hidden; opacity: 0; transform: translateY(4px);
              transition: opacity 0.35s ease, transform 0.35s ease, visibility 0s linear 0.35s;
            }
            .hiw-card[data-on] {
              visibility: visible; opacity: 1; transform: none;
              transition: opacity 0.35s ease, transform 0.35s ease, visibility 0s;
            }
            .hiw-card svg { width: 13px; height: 13px; flex-shrink: 0; }
            .hiw-card-head {
              display: flex; align-items: center; gap: 8px; margin-bottom: 9px;
              color: rgba(29,28,25,0.5); font-size: 11px; font-weight: 600;
              letter-spacing: 0.08em; text-transform: uppercase;
            }
            .hiw-card-head svg { color: rgba(29,28,25,0.55); }
            .hiw-card-head .hiw-right { margin-left: auto; }

            /* step 1: the request, with what Toone picked out of it underlined */
            .hiw-prompt { padding-right: 34px; text-wrap: pretty; }
            .hiw-k {
              background: linear-gradient(rgba(29,28,25,0.38), rgba(29,28,25,0.38)) 0 100% / 0 1.25px no-repeat;
              padding-bottom: 1px;
            }
            .hiw-card[data-on] .hiw-k { animation: hiw-underline 0.6s ease-out forwards; }
            .hiw-card[data-on] .hiw-k:nth-of-type(2) { animation-delay: 0.6s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(3) { animation-delay: 0.85s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(4) { animation-delay: 1.1s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(5) { animation-delay: 1.35s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(6) { animation-delay: 1.6s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(1) { animation-delay: 0.35s; }
            @keyframes hiw-underline { to { background-size: 100% 1.25px; } }
            .hiw-caret {
              display: inline-block; width: 1.5px; height: 1.1em; margin-left: 2px;
              vertical-align: -0.18em; background: rgba(29,28,25,0.75);
              animation: hiw-blink 1.1s steps(1) infinite;
            }
            @keyframes hiw-blink { 50% { opacity: 0; } }
            .hiw-send {
              position: absolute; right: 13px; bottom: 13px;
              display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%;
              background: #141311; color: #f0ede6;
            }
            .hiw-card--prompt { position: relative; }
            .hiw-send svg { width: 12px; height: 12px; }

            /* step 2: the run log */
            .hiw-status {
              display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 3px 9px 3px 7px;
              font-size: 10.5px; font-weight: 600; letter-spacing: 0.01em; text-transform: none;
              color: rgba(29,28,25,0.82); background: rgba(29,28,25,0.05);
              box-shadow: inset 0 0 0 .75px rgba(29,28,25,0.32);
            }
            .hiw-status[data-s="paused"] {
              color: #b25a00; background: #fff7ec; box-shadow: inset 0 0 0 .75px rgba(255,149,0,0.7);
            }
            .hiw-status svg { width: 11px; height: 11px; }
            .hiw-log {
              list-style: none; display: flex; flex-direction: column;
              gap: 6px; height: calc(4 * 20px + 3 * 6px); overflow: hidden;
            }
            .hiw-log li {
              display: flex; align-items: center; gap: 9px; flex-shrink: 0; height: 20px;
              font-size: 13px; color: rgba(29,28,25,0.5); white-space: nowrap;
              animation: hiw-line 0.35s ease-out both;
            }
            /* the newest four lines; phones have room for the whole run */
            @media (min-width: 641px) { .hiw-log li:nth-last-child(n+5) { display: none; } }
            .hiw-log-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
            .hiw-log li[data-s="running"] { color: rgba(29,28,25,0.88); }
            .hiw-log li svg { color: rgba(29,28,25,0.45); }
            .hiw-log-dot {
              position: relative; width: 13px; height: 13px; flex-shrink: 0; display: grid; place-items: center;
            }
            .hiw-log-dot::before {
              content: ''; width: 6px; height: 6px; border-radius: 50%; background: #1d1c19;
            }
            .hiw-log-dot::after {
              content: ''; position: absolute; inset: 1px; border-radius: 50%;
              box-shadow: 0 0 0 1px rgba(29,28,25,0.4); animation: hiw-ping 1.4s ease-out infinite;
            }
            .hiw-log-n {
              margin-left: auto; font-variant-numeric: tabular-nums; font-size: 12px; font-weight: 600;
              color: rgba(29,28,25,0.62);
            }
            @keyframes hiw-line { from { opacity: 0; transform: translateY(5px); } }
            @keyframes hiw-ping { from { transform: scale(1); opacity: 1; } to { transform: scale(1.7); opacity: 0; } }

            /* step 3: the paused step, an edit and Resume */
            .hiw-reason { display: flex; align-items: center; gap: 8px; color: rgba(29,28,25,0.82); transition: opacity 0.3s; }
            .hiw-reason svg { color: #c46a00; }
            .hiw-card[data-resumed] .hiw-reason { opacity: 0.45; }
            .hiw-pause-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
            .hiw-edit { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
            .hiw-field {
              flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
              height: 34px; padding: 0 11px; border-radius: 9px; background: #faf9f6;
              box-shadow: inset 0 0 0 1px rgba(29,28,25,0.16);
              color: rgba(29,28,25,0.88); font-size: 13px; white-space: nowrap; overflow: hidden;
            }
            .hiw-field svg { color: rgba(29,28,25,0.5); }
            .hiw-resume {
              display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; height: 34px;
              border-radius: 999px; padding: 0 15px 0 12px;
              background: #141311; color: #f0ede6; font-size: 12.5px; font-weight: 600;
              transition: transform 0.15s ease, opacity 0.3s ease;
            }
            .hiw-resume svg { width: 11px; height: 11px; fill: currentColor; }
            .hiw-resume[data-pressed] { transform: scale(0.94); }
            .hiw-card[data-resumed] .hiw-resume { opacity: 0.4; }
            .hiw-note { display: flex; align-items: center; gap: 7px; margin-top: 11px; color: rgba(29,28,25,0.5); font-size: 12px; }
            .hiw-note svg { color: rgba(29,28,25,0.45); }

            /* the draft pops in, row by row, each time "Describe it" comes up
               (first once the panel is in view, so the visitor sees it build) */
            .hiw[data-seen] .hiw-stage[data-step="0"] :is(.hg-chip, .hg-card, .hg-cap) {
              animation: hiw-in 0.5s cubic-bezier(0.34, 1.36, 0.64, 1) both;
            }
            .hiw[data-seen] .hiw-stage[data-step="0"] .hg-fan .hg-card { animation-delay: calc(0.14s + var(--i) * 0.06s); }
            .hiw[data-seen] .hiw-stage[data-step="0"] .hg-row :is(.hg-card, .hg-chip, .hg-cap) { animation-delay: calc(0.12s * var(--row)); }
            .hiw[data-seen] .hiw-stage[data-step="0"] .hg-row--rx .hg-card { animation-delay: 0.14s; }
            .hiw[data-seen] .hiw-stage[data-step="0"] .hg-svg { animation: hiw-fade 0.5s ease-in 0.45s both; }
            @keyframes hiw-in { from { opacity: 0; transform: scale(0.94); } }
            @keyframes hiw-fade { from { opacity: 0; } }
            /* while the clock is held, the agents' progress holds too */
            .hiw[data-held] .hg-prog i { animation-play-state: paused; }

            @media (max-width: 960px) {
              .hiw-grid { grid-template-columns: 1fr; gap: 32px; }
              .hiw-body { max-width: 60ch; }
            }
            @media (max-width: 640px) {
              .hiw-tab { padding: 18px 2px 20px; grid-template-columns: 26px minmax(0, 1fr); }
              .hiw-title { font-size: 18px; }
              .hiw-body { font-size: 14px; }
              .hiw-chips { margin-top: 12px; }
              .hiw-chip { height: 24px; font-size: 11.5px; }
              .hiw-panel { padding: 18px 16px 22px; gap: 22px; border-radius: 16px; }
              .hiw-card { padding: 13px 14px 14px; font-size: 13px; }
              .hiw-prompt { padding-right: 26px; }
              .hiw-when { display: none; }
              .hiw-prompt { font-size: 12.5px; line-height: 1.55; }
              .hiw-log { height: calc(7 * 20px + 6 * 6px); }
              .hiw-edit { flex-wrap: wrap; }
              .hiw-field { flex-basis: 100%; }
            }
            @media (prefers-reduced-motion: reduce) {
              .hiw-num, .hiw-title, .hiw-body, .hiw-chip, .hiw-card { transition: none; }
              .hiw-bar { display: none; }
              .hiw-caret, .hiw-log-dot::after { animation: none; }
              .hiw-card[data-on] .hiw-k { animation: none; background-size: 100% 1.25px; }
              .hiw-log li { animation: none; }
              .hiw[data-seen] .hiw-stage[data-step="0"] :is(.hg-chip, .hg-card, .hg-cap, .hg-svg) { animation: none; }
            }
          `,
        }}
      />
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2>{t("title")}</h2>
      <p className="sub">{t("sub")}</p>

      <div
        className="hiw-grid"
        onPointerEnter={() => updateHold({ hover: true })}
        onPointerLeave={() => updateHold({ hover: false })}
        onFocus={(e) => updateHold({ focus: e.target.matches(":focus-visible") })}
        onBlur={() => updateHold({ focus: false })}
      >
        <div className="hiw-steps" role="tablist" aria-orientation="vertical" aria-label={t("eyebrow")} onKeyDown={onKeyDown}>
          {STEPS.map((step, i) => {
            const selected = i === active;
            return (
              <div className="hiw-step" key={step}>
                <button
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={panelId}
                  aria-labelledby={`${id}-title-${i}`}
                  aria-describedby={`${id}-body-${i}`}
                  tabIndex={selected ? 0 : -1}
                  className="hiw-tab"
                  onClick={() => select(i)}
                >
                  <span className="hiw-num">{i + 1}.</span>
                  <span className="hiw-title" id={`${id}-title-${i}`}>{t(`steps.${step}.title`)}</span>
                  <span className="hiw-body" id={`${id}-body-${i}`}>{t(`steps.${step}.body`)}</span>
                  <span className="hiw-chips">
                    {CHIPS[step].map(([chip, icon]) => (
                      <span className="hiw-chip" key={chip}>
                        <Icon name={icon} />
                        {t(`steps.${step}.chips.${chip}`)}
                      </span>
                    ))}
                  </span>
                </button>
                {selected && !reduced && (
                  <span
                    className="hiw-bar"
                    aria-hidden="true"
                    key={active}
                    ref={(el) => {
                      barRef.current = el;
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="hiw-panel" role="tabpanel" id={panelId} aria-labelledby={`${id}-title-${active}`} ref={panelRef}>
          <div className="hiw-cards">
            <div className="hiw-card hiw-card--prompt" data-on={active === 0 ? "" : undefined}>
              <p className="hiw-card-head">
                <Icon name="chat" />
                {t("promptLabel")}
              </p>
              <p className="hiw-prompt">
                {t.rich("prompt", { k: mark })}
                <span className="hiw-caret" aria-hidden="true" />
              </p>
              <span className="hiw-send" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12.5v-9M4.2 7.2 8 3.4l3.8 3.8" />
                </svg>
              </span>
            </div>

            <div className="hiw-card" data-on={active === 1 ? "" : undefined}>
              <p className="hiw-card-head">
                <Icon name="clock" />
                <span>
                  {g("routineName")}
                  <span className="hiw-when"> · {t("graph.schedule")}</span>
                </span>
                <span className="hiw-right hiw-status">
                  <Icon name="pulse" />
                  {g("running")}
                </span>
              </p>
              <ul className="hiw-log">
                {LOG.slice(firstLog, view.log + 1).map((line, j) => {
                  const index = firstLog + j;
                  const running = index === view.log && !view.logDone && line !== "contract";
                  return (
                    <li key={line} data-s={running ? "running" : "done"}>
                      {running ? (
                        <span className="hiw-log-dot" aria-hidden="true" />
                      ) : (
                        <Icon name={line === "contract" ? "shield" : "check"} />
                      )}
                      <span className="hiw-log-t">{t(`run.${line}`)}</span>
                      {line === "leads" && view.leads !== null && (
                        <span className="hiw-log-n">{view.leads} / 20</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div
              className="hiw-card"
              data-on={active === 2 ? "" : undefined}
              data-resumed={view.resumed ? "" : undefined}
            >
              <p className="hiw-card-head">
                <Icon name="pause" />
                {t("graph.findLeads")}
                <span className="hiw-right hiw-status" data-s={pauseState}>
                  <Icon name={view.resumed ? "pulse" : "pause"} />
                  {view.resumed ? g("running") : g("paused")}
                </span>
              </p>
              <div className="hiw-pause-body">
              <p className="hiw-reason">
                <Icon name="shield" />
                {t("pause.reason")}
              </p>
              <div className="hiw-edit">
                <span className="hiw-field">
                  <Icon name="pencil" />
                  <span>
                    {active === 2 ? typed : edit}
                    {active === 2 && !view.resumed && <span className="hiw-caret" aria-hidden="true" />}
                  </span>
                </span>
                <span className="hiw-resume" data-pressed={view.pressed ? "" : undefined}>
                  <svg viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2 1.2v7.6a.5.5 0 0 0 .76.43l6.1-3.8a.5.5 0 0 0 0-.86L2.76.77A.5.5 0 0 0 2 1.2Z" />
                  </svg>
                  {g("resume")}
                </span>
              </div>
              <p className="hiw-note">
                <Icon name="check" />
                {t("pause.note")}
              </p>
              </div>
            </div>
          </div>

          <div className="hiw-stage" data-step={active}>
            <HowItWorksGraph
              nodes={view.nodes}
              leads={view.leads}
              contracts={{ min: view.min, unique: view.unique }}
              researchMs={R_END.map((end) => end - R_START)}
              labels={labels}
              motion={!reduced}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
