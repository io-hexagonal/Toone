"use client";

import { useEffect, useRef, useState } from "react";
import RoutineChain, { type ChainRow, type RowState } from "@/components/RoutineChain";

type Props = {
  rows: ChainRow[];
  labels: { running: string; paused: string };
};

const TICK_MS = 1700;
/** Ticks per loop: one per card, then two with the whole run done. */
const HOLD_TICKS = 2;

/**
 * The "After" graph. Static (every step done) until it scrolls into view, then
 * it runs one card at a time while visible. Reduced motion keeps it static.
 */
export default function AfterRoutineRun({ rows, labels }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearInterval(timer);
        if (!entry.isIntersecting) return;
        setTick(0);
        timer = window.setInterval(
          () => setTick((t) => ((t ?? 0) + 1) % (rows.length + HOLD_TICKS)),
          TICK_MS,
        );
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [rows.length]);

  const states: RowState[] = rows.map((_, i) =>
    tick === null || i < tick ? "done" : i === tick ? "running" : "idle",
  );

  return (
    <div ref={ref}>
      <RoutineChain rows={rows} states={states} labels={labels} />
    </div>
  );
}
