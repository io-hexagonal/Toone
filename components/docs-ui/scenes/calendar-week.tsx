import { Button } from "../Button";
import { CalendarEventChip } from "../CalendarEventChip";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import { NativeSegmented } from "../NativeSegmented";
import type { SceneDefinition } from "../scene";
import styles from "./calendar-week.module.css";

/**
 * The Calendar panel in Week view, unscrolled (the grid starts at 6 AM), with
 * the three kinds of event the grid draws: a scheduled routine (read-only,
 * generated from its trigger), one of your own events, and an event an agent
 * proposed that waits for confirmation.
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/Features/Calendar/):
 * - Views/CalendarPanelView.swift:15-36: header · Divider().opacity(0.3) ·
 *   week grid · Divider().opacity(0.3) · bottom bar.
 * - Views/CalendarHeaderView.swift:22-79: HStack spacing 8, padding 16/8;
 *   chevron.left / chevron.right 13pt semibold textSecondary in .icon
 *   buttons; headerTitle .headline; "Today" .bordered .small tinted accent;
 *   Spacer; segmented Day / Week / Month at width 180; filter
 *   line.3.horizontal.decrease.circle .body textSecondary; close xmark 10pt
 *   bold textTertiary.
 * - ViewModels/CalendarViewModel.swift:138-155: week title "MMM d" + "–" +
 *   "d" of the last day, so a week that crosses a month reads "Oct 26–1"
 *   (the end has no month; a real quirk). Weeks start on Monday (:123-127).
 * - Views/CalendarWeekView.swift:25-29, 47-102, 194-225: hour height 50,
 *   6 AM start, time column 50 + 4 trailing padding (caption2 tertiary,
 *   top-trailing), day header 40 (EEE uppercased caption2 tertiary · day
 *   number body bold in a 28pt circle, accent @0.15 + accent text today),
 *   1pt hour lines textTertiary @0.1, no vertical lines; events span the full
 *   column width and are offset by their start time.
 *   The crop ends 50pt into Thursday's column (no events there).
 * - Views/CalendarEventView.swift (CalendarEventChip): chips.
 * - ViewModels/CalendarViewModel.swift:254-298: routine events are virtual:
 *   title = routine name, duration = estimatedDuration (30 min default),
 *   source .routine, read-only (CalendarPanelView.swift:84 opens them
 *   .readOnly).
 * - Views/CalendarBottomBar.swift:20-52: "calendar" + "N today" caption
 *   tertiary · Spacer · plus.circle.fill .body + "New Event" caption, accent.
 *
 * Code vs plan:
 * - The plan's "three-day slice": the week grid always lays out 7 equal
 *   columns. This crop shows the first three (Mon–Wed) and the start of
 *   Thursday at the width they have in a ~1,030pt-wide panel, and draws
 *   the header and bottom bar at the crop width (their Spacers absorb the
 *   difference). "Today" is the
 *   Wednesday so the today circle falls inside the crop.
 * - "Project events" (guide): the code stores events per project
 *   (coordination/knowledge/calendar/events, CalendarViewModel.swift:213-217)
 *   with participants, tags and a proposed/confirmed status; the grid chip
 *   shows only title, time and the routine/proposed marks.
 * - A confirmed agent event is drawn in AppColors.info (system blue); the
 *   figure shows the proposed (orange) state the plan asks for, so no blue.
 *
 * Calibrate: the native segmented control, the "Today" bordered button and
 * the Divider().opacity(0.3) tone.
 */

const COLUMN_W = 140;
const PARTIAL_W = 50; // the slice ends inside Thursday; its centred header falls outside the crop
const PANEL_W = 54 + COLUMN_W * 3 + PARTIAL_W;
const MAGNIFY = 1.15;
const HOUR = 50;
const START_HOUR = 6;
const HOURS = 5; // 6 AM … 10 AM rows visible above the bottom bar

const DAYS = [
  { weekday: "MON", day: 26 },
  { weekday: "TUE", day: 27 },
  { weekday: "WED", day: 28, today: true },
];

function y(hour: number, minute = 0) {
  return (hour - START_HOUR) * HOUR + (minute / 60) * HOUR;
}

function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

function CalendarWeek() {
  const digest = DEMO.otherRoutines.digest.name;
  const hours = Array.from({ length: HOURS }, (_, i) => START_HOUR + i);
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <div className={styles.header}>
        <Button icon="chevron.left" iconSize={14} variant="icon" />
        <span className={styles.title}>{DEMO.calendar.weekTitle}</span>
        <Button icon="chevron.right" iconSize={14} variant="icon" />
        <span className={styles.today}>Today</span>
        <span className={styles.spacer} />
        <NativeSegmented fill segments={["Day", "Week", "Month"]} selected={1} style={{ width: 180, fontSize: 12 }} />
        <Glyph color="var(--tu-text-2)" name="line.3.horizontal.decrease.circle" size={15} />
        <span className={styles.close}>
          <Glyph name="xmark" size={10} weight="bold" />
        </span>
      </div>
      <div className={styles.divider} />

      <div className={styles.grid}>
        <div className={styles.timeColumn}>
          <div style={{ height: 40 }} />
          {hours.map((hour) => (
            <div className={styles.hourLabel} key={hour}>
              {hourLabel(hour)}
            </div>
          ))}
        </div>

        {DAYS.map((d) => (
          <div className={styles.dayColumn} key={d.day} style={{ width: COLUMN_W }}>
            <div className={styles.dayHeader}>
              <span className={styles.weekday}>{d.weekday}</span>
              <span className={styles.dayNumber} data-today={d.today ? "true" : undefined}>
                {d.day}
              </span>
            </div>
            <div className={styles.slots} style={{ height: HOURS * HOUR }}>
              {hours.map((hour) => (
                <div className={styles.hourLine} key={hour} style={{ top: y(hour) }} />
              ))}
              {d.weekday === "MON" ? (
                <CalendarEventChip height={(30 / 60) * HOUR} source="routine" style={{ position: "absolute", top: y(7) }} title={digest} />
              ) : null}
              {d.weekday === "TUE" ? (
                <CalendarEventChip
                  height={HOUR}
                  source="user"
                  style={{ position: "absolute", top: y(8) }}
                  timeRange="8:00 AM - 9:00 AM"
                  title={DEMO.calendar.userEvent}
                />
              ) : null}
              {d.weekday === "WED" ? (
                <CalendarEventChip
                  height={(45 / 60) * HOUR}
                  proposed
                  source="agent"
                  style={{ position: "absolute", top: y(9, 30) }}
                  timeRange="9:30 AM - 10:15 AM"
                  title={DEMO.calendar.proposedEvent}
                />
              ) : null}
            </div>
          </div>
        ))}
        <div className={styles.dayColumn} style={{ width: PARTIAL_W }}>
          <div className={styles.dayHeader} />
          <div className={styles.slots} style={{ height: HOURS * HOUR }}>
            {hours.map((hour) => (
              <div className={styles.hourLine} key={hour} style={{ top: y(hour) }} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.divider} />
      <div className={styles.bottomBar}>
        <span className={styles.todayCount}>
          <Glyph name="calendar" size={11} />
          1 today
        </span>
        <span className={styles.spacer} />
        <span className={styles.newEvent}>
          <Glyph name="plus.circle.fill" size={15} style={{ ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }} />
          New Event
        </span>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "calendar-week",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The Calendar panel in Week view for ${DEMO.calendar.weekTitle}, showing Monday to Wednesday from 6 AM. Monday has the scheduled routine "${DEMO.otherRoutines.digest.name}" at 7 AM in grey with a repeat mark; Tuesday has your event "${DEMO.calendar.userEvent}" from 8 to 9 AM; Wednesday, today, has "${DEMO.calendar.proposedEvent}", proposed by an agent, with a dashed orange outline and a question mark. The bottom bar reads 1 today and New Event.`,
  caption: "Scheduled routines, your own events and agent proposals share one week grid; a dashed orange event waits for you to confirm it.",
  Component: CalendarWeek,
};
