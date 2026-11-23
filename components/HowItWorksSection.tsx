"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import HowItWorksGraph, {
  Icon,
  type ContractState,
  type GraphSpec,
  type IconName,
  type NodeSpec,
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
 * A persona picker above the stepper swaps the whole scene (request, graph,
 * run log, pause) for another routine built on the same skeleton; picking one
 * starts it from step 1, and the clock then loops inside that routine.
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
/** The routines the picker offers: each a different formation. */
const PERSONAS = ["marketer", "seo", "film"] as const;
type Persona = (typeof PERSONAS)[number];
type Span = readonly [number, number];
type Scenario = {
  graph: GraphSpec;
  /** When each step runs, in ms from the start of "Watch it run". */
  run: Record<string, readonly Span[]>;
  /** The contracted step's counter: [time, value] keyframes. */
  count: readonly Span[];
  counterNode: string;
  max: number;
  /** The contract's minimum, where the step stops short, and where it ends. */
  pass: number;
  pausedAt: number;
  final: number;
  /** While the count sits under the contract mid-run (a review loop). */
  unmet?: Span;
  loop?: Span;
  /** When a rule lights up: a fallback firing, the loop, "ask me first". */
  fire?: Record<string, number>;
  log: readonly { key: string; at: number; icon?: "shield" | "retry"; count?: boolean }[];
  /** What starts once the paused step is through. */
  next: readonly string[];
};
const SCENARIOS: Record<Persona, Scenario> = {
  // A split, then a draft and its reviewer joined by a needs_fix loop.
  marketer: {
    graph: {
      rows: [
        { id: "topics", agent: "strategist", model: "Opus" },
        [{ id: "trends", agent: "researcher", model: "Haiku" }, { id: "competitors", agent: "researcher", model: "Haiku" }],
        { id: "draft", agent: "writer", model: "Sonnet" },
        { id: "review", agent: "reviewer", model: "GPT", counter: true, chips: [{ key: "min", icon: "shield" }, { key: "other", icon: "shield" }] },
        { id: "visuals", agent: "designer", logos: ["figma"] },
        { id: "publish", agent: "publisher", logos: ["linkedin", "threads", "instagram"], chips: [{ key: "gate", icon: "chat" }] },
      ],
      loop: { from: "review", to: "draft", chip: "loop" },
    },
    run: {
      topics: [[300, 1100]], trends: [[1100, 2300]], competitors: [[1100, 2700]],
      draft: [[2700, 3700], [4700, 5400]], review: [[3700, 4700], [5400, 6300]],
      visuals: [[6300, 7400]], publish: [[7400, 9000]],
    },
    count: [[3800, 0], [4600, 6], [5400, 6], [6200, 9]],
    counterNode: "review", max: 10, pass: 8, pausedAt: 6, final: 9,
    unmet: [4600, 5400], loop: [4700, 5400], fire: { loop: 4700, gate: 7400 },
    log: [
      { key: "topics", at: 300 }, { key: "research", at: 1100 }, { key: "draft", at: 2700 },
      { key: "review", at: 3700, count: true }, { key: "loop", at: 4700, icon: "retry" },
      { key: "contract", at: 6250, icon: "shield" }, { key: "publish", at: 6300 },
    ],
    next: ["visuals"],
  },
  // A straight chain with a source fallback and one agent per page, ending in a fork.
  seo: {
    graph: {
      rows: [
        { id: "pull", agent: "analyst", logos: ["search-console", "semrush"], chips: [{ key: "fallback", icon: "retry" }] },
        { id: "pick", agent: "analyst", counter: true, chips: [{ key: "min", icon: "shield" }, { key: "other", icon: "shield" }] },
        { id: "refresh", agent: "writer", model: "Sonnet", each: 8 },
        { id: "check", agent: "reviewer", model: "GPT" },
        [{ id: "save", agent: "publisher", logos: ["wordpress"] }, { id: "report", agent: "analyst", logos: ["google-docs", "gmail"] }],
      ],
    },
    run: {
      pull: [[300, 2300]], pick: [[2300, 3900]], refresh: [[3900, 5900]], check: [[5900, 7000]],
      save: [[7000, 8300]], report: [[7000, 9000]],
    },
    count: [[2400, 0], [3700, 8]],
    counterNode: "pick", max: 8, pass: 8, pausedAt: 5, final: 8,
    fire: { fallback: 1300 },
    log: [
      { key: "pull", at: 300 }, { key: "fallback", at: 1300, icon: "retry" },
      { key: "pick", at: 2300, count: true }, { key: "contract", at: 3750, icon: "shield" },
      { key: "refresh", at: 3900 }, { key: "check", at: 5900 }, { key: "report", at: 7000 },
    ],
    next: ["refresh"],
  },
  // Three lanes of two steps that merge into the cut.
  film: {
    graph: {
      rows: [
        { id: "breakdown", agent: "producer", model: "Opus" },
        [
          [
            { id: "broll", agent: "researcher", logos: ["pexels"], counter: true, chips: [{ key: "min", icon: "shield" }, { key: "other", icon: "shield" }] },
            { id: "trim", agent: "editor", model: "Haiku" },
          ],
          [{ id: "voice", agent: "narrator", logos: ["elevenlabs"] }, { id: "captions", agent: "editor", model: "Haiku" }],
          [
            { id: "thumbs", agent: "designer", logos: ["higgsfield", "openai"], chips: [{ key: "fallback", icon: "retry" }] },
            { id: "pick", agent: "producer", model: "Opus" },
          ],
        ],
        { id: "cut", agent: "editor" },
        { id: "review", agent: "reviewer", model: "Opus" },
        { id: "upload", agent: "publisher", logos: ["youtube"] },
      ],
    },
    run: {
      breakdown: [[300, 1400]], broll: [[1400, 3600]], voice: [[1400, 2800]], thumbs: [[1400, 3900]],
      trim: [[3600, 4700]], captions: [[2800, 4000]], pick: [[3900, 4800]],
      cut: [[4800, 6200]], review: [[6200, 7500]], upload: [[7500, 9000]],
    },
    count: [[1600, 0], [3400, 12]],
    counterNode: "broll", max: 12, pass: 12, pausedAt: 7, final: 12,
    fire: { fallback: 2800 },
    log: [
      { key: "breakdown", at: 300 }, { key: "tracks", at: 1400, count: true },
      { key: "fallback", at: 2800, icon: "retry" }, { key: "contract", at: 3600, icon: "shield" },
      { key: "cut", at: 4800 }, { key: "review", at: 6200 }, { key: "upload", at: 7500 },
    ],
    next: ["trim"],
  },
};

// --- the pause ---
const TYPE_FROM = 700;
const TYPE_MS = 1500;
const PRESS_AT = 5700;
const RESUME_AT = 6100;
const RECOUNT_FROM = 6300;
const RECOUNT_MS = 1900;

type Frame = {
  nodes: Record<string, NodeState>;
  chips: Record<string, ContractState>;
  /** The counter's value; null hides it. */
  count: number | null;
  looping: boolean;
  again: readonly string[];
  /** Index into the log of the newest line shown, -1 for none. */
  log: number;
  logDone: boolean;
  /** Share of the edit typed so far, 0..1. */
  typed: number;
  pressed: boolean;
  resumed: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Rows as lanes of steps, top to bottom. */
function lanesOf(graph: GraphSpec): NodeSpec[][][] {
  return graph.rows.map((row) =>
    Array.isArray(row)
      ? (row as readonly (NodeSpec | readonly NodeSpec[])[]).map((cell) => (Array.isArray(cell) ? [...(cell as readonly NodeSpec[])] : [cell as NodeSpec]))
      : [[row as NodeSpec]],
  );
}

function countAt(frames: readonly Span[], t: number): number {
  let value = frames[0][1];
  for (let i = 0; i < frames.length; i++) {
    const [at, v] = frames[i];
    if (t < at) break;
    const next = frames[i + 1];
    value = next && t < next[0] ? Math.floor(v + ((t - at) / (next[0] - at)) * (next[1] - v)) : v;
  }
  return value;
}

function frameAt(step: number, t: number, sc: Scenario): Frame {
  const all = lanesOf(sc.graph).flat(2);
  const nodes: Record<string, NodeState> = {};
  const chips: Record<string, ContractState> = {};
  const ownerOf: Record<string, string> = {};
  for (const n of all) for (const c of n.chips ?? []) ownerOf[c.key] = n.id;
  if (sc.graph.loop) ownerOf[sc.graph.loop.chip] = sc.graph.loop.from;
  const base = { looping: false, again: [] as string[], log: -1, logDone: false, typed: 0, pressed: false, resumed: false };

  if (step === 0) {
    for (const n of all) nodes[n.id] = "draft";
    for (const key of Object.keys(ownerOf)) chips[key] = "draft";
    return { ...base, nodes, chips, count: null };
  }

  if (step === 1) {
    const again: string[] = [];
    for (const n of all) {
      const spans = sc.run[n.id] ?? [];
      nodes[n.id] = spans.some(([a, b]) => t >= a && t < b)
        ? "running"
        : spans.length && t >= spans[spans.length - 1][1]
          ? "done"
          : spans.length && t >= spans[0][1]
            ? "done"
            : "idle";
      if (spans.length > 1 && t >= spans[1][0]) again.push(n.id);
    }
    const count = countAt(sc.count, t);
    const met = count >= sc.pass;
    for (const [key, owner] of Object.entries(ownerOf)) {
      const at = sc.fire?.[key];
      chips[key] =
        key === "min"
          ? met ? "met" : sc.unmet && t >= sc.unmet[0] && t < sc.unmet[1] ? "unmet" : "open"
          : key === "other"
            ? met ? "met" : "open"
            : at !== undefined
              ? t >= at ? "met" : "open"
              : nodes[owner] === "done" ? "met" : "open";
    }
    let log = -1;
    sc.log.forEach((line, i) => {
      if (t >= line.at) log = i;
    });
    const end = Math.max(...Object.values(sc.run).map((spans) => spans[spans.length - 1][1]));
    return {
      ...base, nodes, chips, again,
      count: t < sc.count[0][0] ? null : count,
      looping: !!sc.loop && t >= sc.loop[0] && t < sc.loop[1],
      log, logDone: t >= end,
    };
  }

  // The pause: everything upstream is done, the contracted step stopped short.
  const resumed = t >= RESUME_AT;
  const count = resumed
    ? clamp(sc.pausedAt + Math.floor(((t - RECOUNT_FROM) / RECOUNT_MS) * (sc.final - sc.pausedAt)), sc.pausedAt, sc.final)
    : sc.pausedAt;
  const through = count >= sc.final && t >= RECOUNT_FROM + RECOUNT_MS + 300;
  let reached = false;
  for (const row of lanesOf(sc.graph)) {
    const here = row.some((lane) => lane.some((n) => n.id === sc.counterNode));
    for (const lane of row) {
      const at = lane.findIndex((n) => n.id === sc.counterNode);
      lane.forEach((n, i) => {
        nodes[n.id] = reached ? "idle" : here && at >= 0 && i > at ? "idle" : "done";
      });
    }
    if (here) reached = true;
  }
  nodes[sc.counterNode] = !resumed ? "paused" : through ? "done" : "running";
  if (through) for (const id of sc.next) nodes[id] = "running";
  for (const [key, owner] of Object.entries(ownerOf)) {
    chips[key] =
      key === "min"
        ? count >= sc.pass ? "met" : resumed ? "open" : "unmet"
        : nodes[owner] === "idle" ? "open" : "met";
  }
  return {
    ...base, nodes, chips, count,
    again: sc.loop ? [sc.graph.loop!.to] : [],
    typed: clamp((t - TYPE_FROM) / TYPE_MS, 0, 1),
    pressed: t >= PRESS_AT && t < RESUME_AT,
    resumed,
  };
}

/** Reduced motion: one still frame per step. */
function stillAt(step: number, sc: Scenario): Frame {
  if (step === 1) return { ...frameAt(1, sc.log[sc.log.length - 2].at + 400, sc), logDone: false };
  return frameAt(step, step === 2 ? TYPE_FROM + TYPE_MS + 100 : 0, sc);
}

export default function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const g = useTranslations("landing.routineGraph");
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const elapsed = useRef(0);
  const hold = useRef({ live: false, hover: false, focus: false });
  const [persona, setPersona] = useState<Persona>("marketer");
  const scenario = SCENARIOS[persona];
  const [active, setActive] = useState(0);
  const [frame, setFrame] = useState<Frame>(() => frameAt(0, 0, scenario));
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
        const next = frameAt(active, elapsed.current, scenario);
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
  }, [active, reduced, scenario]);

  function select(index: number, focus = false) {
    elapsed.current = 0;
    setActive(index);
    setFrame(frameAt(index, 0, scenario));
    if (focus) tabRefs.current[index]?.focus();
  }

  /** Another routine: same scene, from step 1. */
  function pick(next: Persona) {
    if (next === persona) return;
    elapsed.current = 0;
    setPersona(next);
    setActive(0);
    setFrame(frameAt(0, 0, SCENARIOS[next]));
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

  const view = reduced ? stillAt(active, scenario) : frame;
  const panelId = `${id}-panel`;
  const sc = `scenarios.${persona}` as const;
  const edit = t(`${sc}.pause.edit`);
  const typed = edit.slice(0, Math.round(view.typed * edit.length));
  const pauseState: NodeState = view.resumed ? "running" : "paused";
  const firstLog = 0;

  const ids = lanesOf(scenario.graph).flat(2);
  const chipKeys = [...ids.flatMap((n) => (n.chips ?? []).map((c) => c.key)), ...(scenario.graph.loop ? [scenario.graph.loop.chip] : [])];
  const labels = {
    schedule: t(`${sc}.graph.schedule`),
    fallback: t("fallback"),
    parallelShort: t(`${sc}.graph.parallelShort`),
    nodes: Object.fromEntries(ids.map((n) => [n.id, t(`${sc}.graph.nodes.${n.id}`)])),
    agents: Object.fromEntries(ids.map((n) => [n.agent, t(`agents.${n.agent}`)])),
    chips: Object.fromEntries(chipKeys.map((key) => [key, t(`${sc}.graph.chips.${key}`)])),
    running: g("running"),
    paused: g("paused"),
  };
  const counter = view.count === null ? null : `${view.count} / ${scenario.max}`;
  const durations = Object.fromEntries(Object.entries(scenario.run).map(([id, spans]) => [id, spans[0][1] - spans[0][0]]));

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
            /* The intro is centred over the two columns. */
            .hiw > :is(.eyebrow, h2, .sub) { text-align: center; margin-left: auto; margin-right: auto; }

            /* The persona picker: which routine the scene shows. */
            .hiw-personas {
              display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
              margin: 26px auto 30px;
            }
            .hiw-persona {
              display: inline-flex; align-items: center; height: 36px; padding: 0 16px;
              border-radius: 999px; border: 1px solid rgba(29,28,25,0.14);
              background: rgba(255,255,255,0.55); color: rgba(29,28,25,0.72);
              font: inherit; font-size: 14px; font-weight: 550; letter-spacing: -0.005em;
              gap: 6px; text-decoration: none; white-space: nowrap; cursor: pointer;
              transition: background-color .2s ease, color .2s ease, border-color .2s ease;
            }
            .hiw-persona:hover { border-color: rgba(29,28,25,0.3); color: rgba(29,28,25,0.95); }
            .hiw-persona[aria-pressed="true"] { background: #141311; border-color: #141311; color: #f0ede6; }
            .hiw-persona:focus-visible { outline: 2px solid #141311; outline-offset: 2px; }
            .hiw-persona--more { border-color: transparent; background: none; padding: 0 8px; }
            .hiw-persona--more:hover { border-color: transparent; text-decoration: underline; text-underline-offset: 3px; }

            /* Two columns: the steps run the full height of the panel (rules
               flush with its top and bottom edges) with room between them. */
            .hiw-grid {
              display: grid; grid-template-columns: minmax(0, 0.83fr) minmax(0, 1.17fr);
              column-gap: clamp(48px, 6vw, 76px); align-items: stretch;
            }

            /* --- the step list: every step open, the active one in full ink --- */
            .hiw-steps { display: flex; flex-direction: column; }
            .hiw-step { position: relative; flex: 1 0 auto; display: flex; border-bottom: 1px solid rgba(29,28,25,0.1); }
            .hiw-step:first-child { border-top: 1px solid rgba(29,28,25,0.1); }
            .hiw-tab {
              all: unset; box-sizing: border-box; cursor: pointer; display: grid;
              grid-template-columns: 30px minmax(0, 1fr); width: 100%;
              align-content: center; padding: 22px 4px 24px 2px; border-radius: 6px;
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
            .hiw-outcome {
              margin: 0 0 14px; color: rgba(29,28,25,0.92); font-size: 17px; font-weight: 600;
              line-height: 1.4; letter-spacing: -0.01em; text-wrap: pretty;
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
              font-weight: 600;
              background: linear-gradient(rgba(29,28,25,0.38), rgba(29,28,25,0.38)) 0 100% / 0 1.25px no-repeat;
              padding-bottom: 1px;
            }
            .hiw-card[data-on] .hiw-k { animation: hiw-underline 0.6s ease-out forwards; }
            .hiw-card[data-on] .hiw-k:nth-of-type(2) { animation-delay: 0.6s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(3) { animation-delay: 0.85s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(4) { animation-delay: 1.1s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(5) { animation-delay: 1.35s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(6) { animation-delay: 1.6s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(7) { animation-delay: 1.85s; }
            .hiw-card[data-on] .hiw-k:nth-of-type(8) { animation-delay: 2.1s; }
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
              border: 0; padding: 0; cursor: pointer;
              transition: transform 0.15s ease, background-color 0.15s ease;
            }
            .hiw-send:hover { background: #2b2925; transform: translateY(-1px); }
            .hiw-send:active { transform: scale(0.94); }
            .hiw-send:focus-visible { outline: 2px solid #141311; outline-offset: 2px; }
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
              .hiw-grid { grid-template-columns: 1fr; gap: 32px; align-items: start; }
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

      <div className="hiw-personas" role="group" aria-label={t("personaLabel")}>
        {PERSONAS.map((p) => (
          <button
            type="button"
            className="hiw-persona"
            key={p}
            aria-pressed={p === persona}
            aria-controls={panelId}
            onClick={() => pick(p)}
          >
            {t(`tabs.${p}`)}
          </button>
        ))}
        <Link className="hiw-persona hiw-persona--more" href="/explore">
          {t("more")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>

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
          <p className="hiw-outcome">{t(`${sc}.outcome`)}</p>
          <div className="hiw-cards">
            <div className="hiw-card hiw-card--prompt" data-on={active === 0 ? "" : undefined}>
              <p className="hiw-card-head">
                <Icon name="chat" />
                {t("promptLabel")}
              </p>
              <p className="hiw-prompt">
                {t.rich(`${sc}.prompt`, { k: mark })}
                <span className="hiw-caret" aria-hidden="true" />
              </p>
              <button type="button" className="hiw-send" aria-label={t("promptSend")} aria-controls={panelId} onClick={() => select(1)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 12.5v-9M4.2 7.2 8 3.4l3.8 3.8" />
                </svg>
              </button>
            </div>

            <div className="hiw-card" data-on={active === 1 ? "" : undefined}>
              <p className="hiw-card-head">
                <Icon name="clock" />
                <span>
                  {t(`${sc}.routineName`)}
                  <span className="hiw-when"> · {t(`${sc}.graph.schedule`)}</span>
                </span>
                <span className="hiw-right hiw-status">
                  <Icon name="pulse" />
                  {g("running")}
                </span>
              </p>
              <ul className="hiw-log">
                {scenario.log.slice(firstLog, view.log + 1).map((line, j) => {
                  const index = firstLog + j;
                  const running = index === view.log && !view.logDone && !line.icon;
                  return (
                    <li key={line.key} data-s={running ? "running" : "done"}>
                      {running ? (
                        <span className="hiw-log-dot" aria-hidden="true" />
                      ) : (
                        <Icon name={line.icon ?? "check"} />
                      )}
                      <span className="hiw-log-t">{t(`${sc}.run.${line.key}`)}</span>
                      {line.count && counter !== null && <span className="hiw-log-n">{counter}</span>}
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
                {t(`${sc}.graph.nodes.${scenario.counterNode}`)}
                <span className="hiw-right hiw-status" data-s={pauseState}>
                  <Icon name={view.resumed ? "pulse" : "pause"} />
                  {view.resumed ? g("running") : g("paused")}
                </span>
              </p>
              <div className="hiw-pause-body">
              <p className="hiw-reason">
                <Icon name="shield" />
                {t(`${sc}.pause.reason`)}
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
                {t("pauseNote")}
              </p>
              </div>
            </div>
          </div>

          <div className="hiw-stage" data-step={active}>
            <HowItWorksGraph
              key={persona}
              spec={scenario.graph}
              nodes={view.nodes}
              chips={view.chips}
              counter={counter}
              looping={view.looping}
              again={view.again}
              durations={durations}
              labels={labels}
              motion={!reduced}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
