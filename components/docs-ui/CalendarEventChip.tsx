import type { CSSProperties } from "react";
import styles from "./CalendarEventChip.module.css";
import { Glyph } from "./glyphs";

/**
 * CalendarEventChip: one event block in the Calendar's day/week grid.
 * Source: Features/Calendar/Views/CalendarEventView.swift:25-124 (main repo),
 * colours :93-122, source/status enums CalendarEvent.swift:11-36.
 *
 * HStack(spacing 4): 3pt accent bar (r2) · VStack(spacing 1) [title
 * caption2 bold, 1 line · time "h:mm a - h:mm a" 9pt @0.7, only when the
 * block is taller than 30pt] · Spacer · routine glyph
 * arrow.triangle.2.circlepath 8pt @0.5 · proposed glyph questionmark.circle
 * 9pt orange. Padding 4/2, height max(duration/60 × hourHeight, 22), r4.
 *
 * - user:     bar = theme accent, fill accent @0.12, text primary.
 * - agent:    proposed → bar orange, fill orange @0.08, 1pt dashed [3,2]
 *             orange @0.3 border; confirmed → AppColors.info (system blue).
 *             Only the proposed state is drawn in the docs (theme colours).
 * - routine:  bar textTertiary, fill textTertiary @0.08, text secondary
 *             (read-only, generated from the routine's trigger).
 *
 * Absolutely positioned by the caller (the grid offsets it by start time).
 */
export type CalendarEventSource = "user" | "agent" | "routine";

type Props = {
  title: string;
  source: CalendarEventSource;
  proposed?: boolean;
  /** "8:00 AM - 9:00 AM"; drawn only when `height` > 30. */
  timeRange?: string;
  /** duration / 60 × hourHeight (the chip never draws shorter than 22). */
  height: number;
  style?: CSSProperties;
};

export function CalendarEventChip({ title, source, proposed = false, timeRange, height, style }: Props) {
  return (
    <div
      className={styles.chip}
      data-proposed={proposed ? "true" : undefined}
      data-source={source}
      style={{ height: Math.max(height, 22), ...style }}
    >
      <span className={styles.bar} />
      <span className={styles.text}>
        <span className={styles.title}>{title || "Untitled"}</span>
        {height > 30 && timeRange ? <span className={styles.time}>{timeRange}</span> : null}
      </span>
      {source === "routine" ? (
        <Glyph className={styles.routineGlyph} name="arrow.triangle.2.circlepath" size={9} />
      ) : null}
      {proposed ? <Glyph color="var(--tu-warning)" name="questionmark.circle" size={10} /> : null}
    </div>
  );
}
