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
