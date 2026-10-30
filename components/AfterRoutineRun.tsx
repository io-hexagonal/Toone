"use client";

import { useEffect, useRef, useState } from "react";
import RoutineChain, { type ChainRow, type RowState } from "@/components/RoutineChain";
import { Icon } from "@/components/HowItWorksGraph";
import type { LogoKey } from "@/components/RoutineChain";

type Props = {
  /** Research, Find leads, Design files, Publish: titles and accounts. */
  steps: readonly { title: string; tiles: readonly LogoKey[] }[];
  labels: {
    running: string;
    paused: string;
    /** The contract on Find leads, e.g. "≥ 20". */
    min: string;
    /** The fallback rule, e.g. "retry ×1 → ask me". */
    fallback: string;
    ledger: string;
    known: string;
    fresh: string;
    duplicates: string;
  };
};

const LEADS = 1;
const TARGET = 20;
// --- one calm pass, in ms: one step at a time, then a rest with all done ---
const SPANS = [
  [0, 1700],
  [1700, 3900],
  [3900, 5500],
  [5500, 7100],
] as const;
const COUNT_FROM = 1900;
const COUNT_MS = 1600;
const LOOP_MS = 10200;

type Frame = { states: RowState[]; leads: number };

function frameAt(t: number): Frame {
  const states = SPANS.map(([a, b]): RowState => (t < a ? "idle" : t < b ? "running" : "done"));
  const leads = t < SPANS[LEADS][0]
    ? 0
    : Math.min(TARGET, Math.max(0, Math.floor(((t - COUNT_FROM) / COUNT_MS) * TARGET)));
  return { states, leads };
}

/** Before it is seen, and with reduced motion: the finished run. */
const STILL: Frame = { states: SPANS.map(() => "done"), leads: TARGET };

/**
 * "A Toone routine" in Why Toone: the hero's chain with its contract and
 * fallback on the Find leads edge, and the ledger that carries over between
 * runs. While in view it runs one step at a time; out of view it holds where
 * it was. Reduced motion shows the finished run, still.
 */
export default function AfterRoutineRun({ steps, labels }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Frame>(STILL);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let elapsed = 0;
    let last = 0;
    let key = "";
    const loop = (now: number) => {
      elapsed = (elapsed + Math.min(now - last, 64)) % LOOP_MS;
      last = now;
      const next = frameAt(elapsed);
      const nextKey = `${next.states.join()}|${next.leads}`;
      if (nextKey !== key) {
        key = nextKey;
        setFrame(next);
      }
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(raf);
        if (!entry.isIntersecting) return;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const leadsState = frame.states[LEADS];
  const met = frame.leads >= TARGET;
  const rows: ChainRow[] = steps.map((step, i) =>
    i === LEADS
      ? {
          ...step,
          end: leadsState === "idle" ? null : `${frame.leads} / ${TARGET}`,
          gate: (
            <>
              <span className="rg-chip" data-s={met ? "met" : "open"}>
                <Icon name="shield" />
                {labels.min}
                <span className="rg-chip-tick">
                  <Icon name="check" />
                </span>
              </span>
              <span className="rg-chip">
                <Icon name="retry" />
                {labels.fallback}
              </span>
            </>
          ),
        }
      : step,
  );

  return (
    <div className="ba-run" ref={ref}>
      <div className="ba-chain">
        <RoutineChain rows={rows} states={frame.states} labels={{ running: labels.running, paused: labels.paused }} />
      </div>
      <p className="ba-ledger" data-s={leadsState === "running" ? "writing" : undefined}>
        <span className="ba-ledger-name">
          <Icon name="ledger" />
          {labels.ledger}
        </span>
        <span className="ba-ledger-items">
          <span>{labels.known}</span>
          <span>{labels.fresh}</span>
          <span>{labels.duplicates}</span>
        </span>
      </p>
    </div>
  );
}
