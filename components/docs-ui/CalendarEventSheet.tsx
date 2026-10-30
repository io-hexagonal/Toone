import type { ReactNode } from "react";
import { Sheet, SheetStage } from "./Sheet";

/**
 * The Calendar's event sheet (CalendarEventDetailView), shared by the
 * calendar-routine-event and calendar-proposed-event scenes.
 *
 * Source: apps/toone-desktop/Toone/Toone/Features/Calendar/Views/
 * CalendarEventDetailView.swift:52-139: VStack leading spacing Spacing.md
 * 16; header HStack (title .headline textPrimary · Spacer · "Proposed"
 * caption2 orange on orange @0.12 capsule, padding 6/2 · "Routine" caption2
 * textTertiary on textTertiary @0.12 capsule); Divider().opacity(0.3);
 * content; Divider().opacity(0.3); actions. .padding() (16), width 460,
 * background layoutStyle.popoverBackground (= innerBackgroundColor,
 * LayoutStyle.swift:395-397). Presented with `.sheet` from the Calendar
 * panel (CalendarPanelView.swift:84-110), so it is a sheet, not a popover.
 *
 * CALIBRATE: the sheet window (Sheet.tsx) and the Divider tone at 0.3.
 */

export const EVENT_SHEET_WIDTH = 460;
export const EVENT_SHEET_FIGURE_WIDTH = EVENT_SHEET_WIDTH + 48;

export function EventSheet({ children }: { children: ReactNode }) {
  return (
    <SheetStage>
      <Sheet
        style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, background: "var(--tu-inner)" }}
        width={EVENT_SHEET_WIDTH}
      >
        {children}
      </Sheet>
    </SheetStage>
  );
}

/** Divider().opacity(0.3). CALIBRATE */
export function EventDivider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />;
}

export function EventStatusCapsule({ label, tone }: { label: string; tone: "orange" | "tertiary" }) {
  const color = tone === "orange" ? "var(--tu-warning)" : "var(--tu-text-3)";
  return (
    <span
      style={{
        flex: "none",
        padding: "2px 6px",
        borderRadius: 999,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
        fontSize: 10,
        lineHeight: "13px",
      }}
    >
      {label}
    </span>
  );
}

export function EventSheetHeader({ title, capsules }: { title: string; capsules?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flex: "1 1 auto", fontSize: 13, lineHeight: "16px", fontWeight: 700, color: "var(--tu-text-1)" }}>
        {title}
      </span>
      {capsules}
    </div>
  );
}

/**
 * LabeledContent("Label") { Text(value).foregroundStyle(…) } outside a Form:
 * label leading, value trailing. CALIBRATE (macOS standalone LabeledContent
 * alignment).
 */
export function EventLabeled({ label, value, tertiary }: { label: string; value: string; tertiary?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, fontSize: 13, lineHeight: "16px" }}>
      <span style={{ flex: "none", color: "var(--tu-text-1)" }}>{label}</span>
      <span style={{ flex: "1 1 auto", textAlign: "right", color: tertiary ? "var(--tu-text-3)" : "var(--tu-text-2)" }}>
        {value}
      </span>
    </div>
  );
}
