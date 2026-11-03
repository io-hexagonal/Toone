import type { CSSProperties } from "react";
import { Field } from "./Field";
import { Glyph, type GlyphName } from "./glyphs";
import styles from "./RailHoverCard.module.css";

/**
 * What floats beside the navigation rail.
 *
 * - RailHoverCard: the hover card of a destination (width 250) or of a
 *   Routines / Explore option (width 250, 310 for a "Coming soon" Explore).
 *   Both: padding 16, VStack(spacing 4), a title (icon in an 18pt column,
 *   spacing 6, callout semibold, theme accent), the detail (caption,
 *   secondary text, leading inset 24).
 *   Placement: x = rail width (44) + 8 for the card's left edge,
 *   vertically centred on the hovered item (clamped to the rail's height).
 * - NewChatPicker: the New Chat agent picker, shown in a native popover
 *   from the New Chat button (arrow on the trailing edge): "New Chat"
 *   (title 17 semibold), "Choose an agent to start a new thread."
 *   (subtitle 13), padding 12; Divider; "Search agents" (padding h8
 *   v4); rows sorted by name (`person` in the accent, 20 wide · name callout
 *   medium · department caption secondary; padding 10, hover accent .10 r8).
 *
 * Position both with `style` (top/left) inside a position:relative parent.
 */

export function RailHoverCard({
  title,
  icon,
  detail,
  width = 250,
  style,
}: {
  title: string;
  icon: GlyphName;
  detail: string;
  width?: number;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.card} style={{ width, ...style }}>
      <span className={styles.title}>
        <span className={styles.titleIcon}>
          <Glyph name={icon} size={14} weight="semibold" />
        </span>
        {title}
      </span>
      <span className={styles.detail}>{detail}</span>
    </div>
  );
}

export function NewChatPicker({
  agents,
  hovered,
  arrowTop,
  style,
}: {
  agents: { name: string; department: string }[];
  /** Name of the row under the pointer. */
  hovered?: string;
  /** Arrow y inside the popover (aligns with the New Chat button). */
  arrowTop: number;
  style?: CSSProperties;
}) {
  const sorted = [...agents].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className={styles.popover} style={style}>
      <span className={styles.arrow} style={{ top: arrowTop }} />
      <div className={styles.pickerHeader}>
        <span className={styles.pickerTitle}>New Chat</span>
        <span className={styles.pickerSubtitle}>Choose an agent to start a new thread.</span>
      </div>
      <div className={styles.pickerDivider} />
      <div className={styles.pickerSearch}>
        <Field placeholder="Search agents" />
      </div>
      <div className={styles.pickerList}>
        {sorted.map((agent) => (
          <div className={styles.pickerRow} data-hover={agent.name === hovered ? "true" : undefined} key={agent.name}>
            <span className={styles.pickerIcon}>
              <Glyph name="person" size={15} />
            </span>
            <span className={styles.pickerLines}>
              <span className={styles.pickerName}>{agent.name}</span>
              <span className={styles.pickerDepartment}>{agent.department}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
