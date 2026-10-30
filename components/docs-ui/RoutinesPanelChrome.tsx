import type { CSSProperties, ReactNode } from "react";
import { Button } from "./Button";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * The Routines panel's top chrome: header, Divider, workspace toolbar,
 * Divider (RoutineCreatorPanelView.swift:177-190).
 *
 * Sources (RCP = APP/Features/Organization/Views/RoutineCreatorPanelView.swift):
 * - RoutinesPanelHeader: RCP:398-450. HStack spacing 10, padding 14:
 *   point.3.connected.trianglepath.dotted in the accent; VStack spacing 1 of
 *   "Routines" .headline over the status line .caption .secondary (Drafts:
 *   draftStatusText RCP:3264-3271 "Draft · revision N"; Routines:
 *   "Published · <cadence.displayName>"); Spacer; TooneProCreationBadge
 *   (App Store builds only, not drawn); `+` icon button (help "Create a new
 *   routine draft"); `xmark` 10 bold secondary icon button.
 * - RoutinesToolbar: RCP:452-480. HStack spacing 8 (Spacing.sm), padding
 *   h14 v8, innerBackground @0.25: `sidebar.left` icon button, Spacer, then
 *   the section's actions.
 * - ToolbarButton: macOS `.bordered` / `.borderedProminent` at
 *   `.controlSize(.small)` (Label title + systemImage). CALIBRATE: native
 *   geometry (height, radius, fill, label size), like Button's variants.
 *
 * Drawings only: every control is a <span>.
 */

export function RoutinesPanelHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14 }}>
      <Glyph color="var(--tu-accent)" name="point.3.connected.trianglepath.dotted" size={15} />
      <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "16px", color: "var(--tu-label-1)" }}>Routines</span>
        {subtitle ? (
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>{subtitle}</span>
        ) : null}
      </span>
      <span style={{ flex: "1 1 auto" }} />
      <Button label={<Glyph name="plus" size={15} />} variant="icon" />
      <Button label={<Glyph color="var(--tu-label-2)" name="xmark" size={11} weight="bold" />} variant="icon" />
    </div>
  );
}

export function PanelDivider() {
  return <div style={{ height: 1, background: "var(--tu-sep)" }} />;
}

export function RoutinesToolbar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        background: "color-mix(in srgb, var(--tu-inner) 25%, transparent)",
      }}
    >
      <Button label={<Glyph name="sidebar.left" size={15} />} variant="icon" />
      <span style={{ flex: "1 1 auto" }} />
      {children}
    </div>
  );
}

/** A `.buttonStyle(.icon)` toolbar glyph (diagnostics, sub-routine, discard). */
export function ToolbarIcon({ icon, color, weight }: { icon: GlyphName; color?: string; weight?: "regular" | "semibold" }) {
  return <Button label={<Glyph color={color} name={icon} size={15} weight={weight} />} variant="icon" />;
}

const SMALL: CSSProperties = { height: 22, padding: "0 8px", borderRadius: 6, fontSize: 11, gap: 4 };

export function ToolbarButton({
  label,
  icon,
  prominent = false,
  destructive = false,
  menu = false,
  style,
  children,
}: {
  label: string;
  icon: GlyphName;
  /** `.borderedProminent` (the light controlTint fill, dark label). */
  prominent?: boolean;
  /** `role: .destructive` on a bordered button: the label in system red. */
  destructive?: boolean;
  /** A `Menu` with `.menuStyle(.button)`: a trailing indicator chevron. */
  menu?: boolean;
  style?: CSSProperties;
  /** Overlay drawn inside the button box (a Tooltip). */
  children?: ReactNode;
}) {
  return (
    <span style={{ position: "relative", display: "inline-flex", flex: "none" }}>
      <Button
        icon={icon}
        iconSize={11}
        label={
          menu ? (
            <>
              {label}
              <Glyph name="chevron.down" size={8} style={{ marginLeft: 2, opacity: 0.7 }} weight="bold" />
            </>
          ) : (
            label
          )
        }
        style={{ ...SMALL, ...(destructive ? { color: "var(--tu-error)" } : null), ...style }}
        variant={prominent ? "prominent" : "bordered"}
      />
      {children}
    </span>
  );
}
