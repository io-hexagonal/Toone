import type { CSSProperties, ReactNode } from "react";
import styles from "./docs-ui.module.css";
import { Glyph } from "./glyphs";

/**
 * P9 Pills and badges.
 *
 * - StatusPill: RoutineSidebarComponents.swift:47-86 (11/600, padding 6/1.5,
 *   tone @0.18; `tone="neutral"` uses the hover fill).
 * - LiveBadge: RoutinePipelineGraphComponents.swift:318-347 ("RUNNING",
 *   7pt rounded bold, tracking 0.35). Caution labels (WAITING, PAUSED,
 *   RETRYING, STALLED, needs-fix) turn orange (`:415-420`).
 * - StatusChip: RoutineDraftPipelineView.swift:240-282 (waveform.path.ecg 9pt
 *   bold + caption2 semibold, running colour, orange for non-running).
 * - Badge: small accent capsule (share status, "Recommended", mode badges).
 * - CountBadge: rail count (8 bold, orange capsule ≥13²).
 */

export const CAUTION_LABELS = ["WAITING", "PAUSED", "RETRYING", "STALLED", "NEEDS FIX"];

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  /** "neutral" or any CSS colour (e.g. "var(--tu-success)"). */
  tone: "neutral" | string;
}) {
  const style = tone === "neutral" ? undefined : ({ "--tu-pill-tone": tone } as CSSProperties);
  return (
    <span className={styles.statusPill} data-tone={tone === "neutral" ? "neutral" : undefined} style={style}>
      {label}
    </span>
  );
}

export function LiveBadge({ label = "RUNNING", style }: { label?: string; style?: CSSProperties }) {
  return (
    <span
      className={styles.liveBadge}
      data-caution={CAUTION_LABELS.includes(label) ? "true" : undefined}
      style={style}
    >
      {label}
    </span>
  );
}

export function StatusChip({
  summary,
  caution = false,
  runCount,
}: {
  /** e.g. "Running · Investigate a topic" (RoutineDraftRuntimePresentation.swift:370-393). */
  summary: string;
  /** true for any summary kind other than running (paused, waiting, retrying…). */
  caution?: boolean;
  /** Shown as "N runs" when more than one run is active. */
  runCount?: number;
}) {
  return (
    <span className={styles.statusChip} data-caution={caution ? "true" : undefined}>
      <Glyph name="waveform.path.ecg" size={10} weight="bold" />
      <span>{summary}</span>
      {runCount && runCount > 1 ? (
        <span style={{ fontSize: 8, fontWeight: 700 }}>{runCount} runs</span>
      ) : null}
    </span>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const style = tone ? ({ "--tu-badge-tone": tone } as CSSProperties) : undefined;
  return (
    <span className={styles.badge} style={style}>
      {children}
    </span>
  );
}

export function CountBadge({ count }: { count: number }) {
  return <span className={styles.countBadge}>{count}</span>;
}
