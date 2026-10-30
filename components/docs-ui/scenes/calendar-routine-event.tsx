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
 * Sources (apps/toone-desktop/Toone/Toone/Features/Calendar/):
 * - Views/CalendarEventDetailView.swift:52-139 (sheet, see
 *   CalendarEventSheet.tsx; actions HStack: Confirm only for proposed
 *   events with onConfirm, Delete (role .destructive) whenever onDelete is
 *   set and mode != .create, Spacer, Cancel, Save hidden in .readOnly);
 *   :143-184 (readOnlyContent: LabeledContent Time / Topic / Participants /
 *   Department / Notes / Created by, each only when set; values
 *   textSecondary); :463-467 (timeRange "MMM d, h:mm a - MMM d, h:mm a").
 * - Views/CalendarPanelView.swift:84-105 (a routine event opens .readOnly;
 *   onDelete is passed for every selected event, onConfirm only for
 *   proposed ones).
 * - ViewModels/CalendarViewModel.swift:276-291 (virtual routine events:
 *   title = routine name, participants = [agent name], topic = purpose,
 *   department = departmentId, tags ["routine"], source .routine, status
 *   confirmed, so no "Proposed" capsule and no Notes / Created by).
 *
 * Code vs plan:
 * - The plan calls it a popover; the code presents a sheet.
 * - The plan's "Mon 09:00 – 09:30" is "Oct 26, 7:00 AM - Oct 26, 7:30 AM" in
 *   the code's format, at the time calendar-week shows.
 * - The plan says "only Cancel". In the code the read-only sheet still shows
 *   Delete, because CalendarPanelView passes onDelete for every event and
 *   the button only hides in .create mode. Drawn as the code has it (likely
 *   an app bug: the routine event is virtual, regenerated from the trigger).
 * - Topic is the routine's purpose (demo copy shared with the Explore
 *   listing of the same routine); department is the department id.
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
