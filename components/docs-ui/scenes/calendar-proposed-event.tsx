import { EVENT_SHEET_FIGURE_WIDTH, EventDivider, EventSheet, EventSheetHeader, EventStatusCapsule } from "../CalendarEventSheet";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import { Checkbox, PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * The editable event sheet for an event an agent proposed: "Pricing sync"
 * with the orange "Proposed" capsule, its fields (title, start "to" end,
 * topic, participants, tags, notes), the agent switch, the Heads-ups block,
 * and the actions Confirm (green), Delete, Cancel and Save. Same event as
 * Wednesday's dashed chip in calendar-week.
 *
 * Sources (apps/toone-desktop/Toone/Toone/Features/Calendar/):
 * - Views/CalendarEventDetailView.swift:52-139 (sheet and header, see
 *   CalendarEventSheet.tsx; actions: Confirm .borderedProminent
 *   .tint(.green) for proposed events, Delete role .destructive, Spacer,
 *   Cancel, Save .borderedProminent); :186-267 (editableContent: TextField
 *   "Event title" .plain .body; HStack DatePicker labelsHidden · "to"
 *   textTertiary · DatePicker; TextFields "Topic", "Participants
 *   (comma-separated)", "Tags (comma-separated)", "Notes" (axis vertical,
 *   3…6 lines), all .plain .body; Toggle "Run an agent at the start time",
 *   which outside a Form is a checkbox); :271-319 (calendarExtrasContent:
 *   Divider, "Heads-ups" caption textSecondary, "Add heads-up" (plus)
 *   .borderless); :382-385 (extras shown in the Direct edition, edit mode,
 *   non-routine events with an organization).
 * - Views/CalendarPanelView.swift:84-105 (agent events open .edit; onConfirm
 *   only for proposed events).
 * - Models/CalendarEvent.swift:11-70 (participants, tags, status).
 *
 * Code vs plan:
 * - The plan's fields list leaves out Topic, Notes, the agent checkbox and
 *   the Heads-ups block; the code shows them, so they are drawn (Notes
 *   empty, showing its placeholder; no heads-ups yet; the project calendar
 *   playbook switch is off, so its toggle is absent).
 * - Dates are absolute in the app's date pickers, matching calendar-week.
 * - The topic reuses the demo run's topic.
 *
 * CALIBRATE: the sheet window; the native date pickers (text field +
 * stepper); the checkbox; the push buttons, the green Confirm fill, and
 * whether the destructive Delete title is red (drawn neutral); the
 * borderless "Add heads-up" (drawn in the theme accent).
 */

/** DatePicker (default style on macOS: date-and-time text field with a stepper). CALIBRATE */
function DateField({ value }: { value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 22,
          padding: "0 6px",
          borderRadius: 5,
          background: "rgba(255,255,255,0.05)",
          boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.22)",
          fontSize: 13,
          color: "var(--tu-label-1)",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 13,
          height: 22,
          borderRadius: 4,
          background: "rgba(255,255,255,0.14)",
          color: "var(--tu-label-1)",
        }}
      >
        <Glyph name="chevron.up" size={7} weight="bold" />
        <Glyph name="chevron.down" size={7} weight="bold" />
      </span>
    </span>
  );
}

function PlainField({ value, placeholder, lines = 1 }: { value?: string; placeholder?: string; lines?: number }) {
  return (
    <span
      style={{
        display: "block",
        minHeight: lines * 16,
        fontSize: 13,
        lineHeight: "16px",
        color: value ? "var(--tu-text-1)" : "var(--tu-label-3)",
      }}
    >
      {value || placeholder}
    </span>
  );
}

function CalendarProposedEvent() {
  return (
    <EventSheet>
      <EventSheetHeader
        capsules={<EventStatusCapsule label="Proposed" tone="orange" />}
        title={DEMO.calendar.proposedEvent}
      />
      <EventDivider />
      <PlainField value={DEMO.calendar.proposedEvent} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <DateField value="10/28/2026, 9:30 AM" />
        <span style={{ fontSize: 13, color: "var(--tu-text-3)" }}>to</span>
        <DateField value="10/28/2026, 10:15 AM" />
      </div>
      <PlainField value={DEMO.run.topic} />
      <PlainField value={`${DEMO.people.you}, ${DEMO.people.guest}`} />
      <PlainField value="pricing" />
      <PlainField lines={3} placeholder="Notes" />
      <Checkbox checked={false}>Run an agent at the start time</Checkbox>
      <EventDivider />
      <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-text-2)" }}>Heads-ups</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "16px", color: "var(--tu-accent)" }}>
        <Glyph name="plus" size={13} weight="medium" />
        Add heads-up
      </span>
      <EventDivider />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PushButton
          label="Confirm"
          prominent
          style={{ background: "var(--tu-success)", color: "#fff" }}
        />
        <PushButton label="Delete" />
        <span style={{ flex: "1 1 auto" }} />
        <PushButton label="Cancel" />
        <PushButton label="Save" prominent />
      </div>
    </EventSheet>
  );
}

export const scene: SceneDefinition = {
  id: "calendar-proposed-event",
  width: EVENT_SHEET_FIGURE_WIDTH,
  radius: 16,
  label: `The Calendar's event sheet for ${DEMO.calendar.proposedEvent}, an event an agent proposed, marked Proposed in orange. Editable fields hold the title, Oct 28 from 9:30 to 10:15 AM, the topic, the participants ${DEMO.people.you} and ${DEMO.people.guest}, the tag pricing and an empty Notes field, with an unticked Run an agent at the start time checkbox and an Add heads-up button. Buttons: a green Confirm, Delete, Cancel and Save.`,
  caption: "An agent's proposed event waits for you: edit it, then Confirm or Delete.",
  Component: CalendarProposedEvent,
};
