import { EVENT_SHEET_FIGURE_WIDTH, EventDivider, EventLabeled, EventSheet, EventSheetHeader, EventStatusCapsule } from "../CalendarEventSheet";
import { DEMO } from "../demo";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * The read-only event sheet for a scheduled routine: "Weekly growth digest"
 * with the grey "Routine" capsule, its time, topic, participant and
 * department, and only Delete and Cancel (no Save, no Confirm). Same event as
 * the Monday 7 AM chip in calendar-week.
 *
 * CALIBRATE: the sheet window, LabeledContent alignment, the push buttons
 * and whether AppKit tints the destructive Delete title red (drawn neutral,
 * like the kit's other destructive buttons).
 */

function CalendarRoutineEvent() {
  const digest = DEMO.otherRoutines.digest;
  return (
    <EventSheet>
      <EventSheetHeader capsules={<EventStatusCapsule label="Routine" tone="tertiary" />} title={digest.name} />
      <EventDivider />
      <EventLabeled label="Time" value="Oct 26, 7:00 AM - Oct 26, 7:30 AM" />
      <EventLabeled label="Topic" value={DEMO.explore.submissions.approved.summary} />
      <EventLabeled label="Participants" value={digest.owner} />
      <EventLabeled label="Department" value="growth" />
      <EventDivider />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PushButton label="Delete" />
        <span style={{ flex: "1 1 auto" }} />
        <PushButton label="Cancel" />
      </div>
    </EventSheet>
  );
}

export const scene: SceneDefinition = {
  id: "calendar-routine-event",
  width: EVENT_SHEET_FIGURE_WIDTH,
  radius: 16,
  label: `The Calendar's event sheet for the scheduled routine ${DEMO.otherRoutines.digest.name}, marked Routine. It lists the time, Oct 26, 7:00 to 7:30 AM, the topic, the participant ${DEMO.otherRoutines.digest.owner} and the department growth. There is no Save button, only Delete and Cancel: routine events can't be edited here.`,
  caption: "A scheduled routine opens read-only: change its schedule in the routine, not in Calendar.",
  Component: CalendarRoutineEvent,
};
