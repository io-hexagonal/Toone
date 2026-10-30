import type { CSSProperties, ReactNode } from "react";
import { Glyph, type GlyphName } from "./glyphs";
import styles from "./InspectorCard.module.css";

/**
 * P16 InspectorCard + MetaTile: the Routines panel's definition inspector
 * (the pane under the graph that describes the selected node).
 *
 * Sources: APP/Features/Organization/Views/RoutineCreatorPanelView.swift
 * (APP = apps/toone-desktop/Toone/Toone/):
 * - InspectorPreview / InspectorHeader: definitionPreview :1144-1171 (VStack
 *   spacing 14; HStack: selection title .headline, Spacer, "Discuss with
 *   agent" bubble.left.and.bubble.right, .plain, .caption, .secondary;
 *   hidden when inspecting a published routine); titles :1813-1829;
 * - InspectorSummaryCard: stepDefinitionPreview :1256-1290 / routine
 *   :1172-1208 (VStack spacing 10, padding 14, innerBackground .42, r12,
 *   1pt separator). With `title`, draws the card's title row:
 *   Label(step.title, systemImage: "N.circle.fill") .title3 semibold
 *   (`number`), then `text` in .callout .secondary;
 * - MetaTileGrid: LazyVGrid(.adaptive(minimum: 180), spacing 10) (150 for
 *   the routine definition); column spacing is the default 8;
 * - InspectorTile / TileLabel / MetaTile: metadata() :2159-2203 (VStack
 *   spacing 5; Label caption secondary; value callout medium, 2 lines;
 *   padding 9, innerBackground .42, r8, 1pt separator; empty value →
 *   "To be decided"). Same tile as the Auto-fix tile
 *   (RoutineSidebarComponents.swift:608-691);
 * - InspectorMenuLabel: the draft's borderless Menu selectors (step model,
 *   executor, execution) :1563-1680, Label(…).font(.caption). CALIBRATE:
 *   native .borderlessButton menu (label colour, indicator chevron);
 * - InspectorSection: previewSection :2205-2219 (VStack spacing 9, title
 *   .headline, empty message .callout .secondary);
 * - InspectorRow: previewRow :2221-2298 (HStack top spacing 10; icon in the
 *   accent; title callout medium, detail caption secondary, spacing 2;
 *   optional `scope` button; padding 10, innerBackground .38 (.62 hovered),
 *   r9, 1pt separator);
 * - InspectorDetail: detailList :2300-2307 ("Label: a, b" caption secondary).
 *
 * Strokes are SwiftUI `.stroke` (centred on the edge); drawn as a 1px inset
 * ring, a half-point difference.
 */

export function InspectorPreview({ children }: { children: ReactNode }) {
  return <div className={styles.preview}>{children}</div>;
}

export function InspectorHeader({ title, discuss = true }: { title: string; discuss?: boolean }) {
  return (
    <div className={styles.header}>
      <span className={styles.headline}>{title}</span>
      {discuss ? (
        <span className={styles.discuss}>
          <Glyph name="bubble.left.and.bubble.right" size={12} />
          Discuss with agent
        </span>
      ) : null}
    </div>
  );
}

/** SF "N.circle.fill": a filled disc with the number knocked out. */
function NumberCircle({ n, size = 17 }: { n: number; size?: number }) {
  return (
    <svg aria-hidden="true" className={styles.numberCircle} height={size} viewBox="0 0 16 16" width={size}>
      <circle cx="8" cy="8" fill="currentColor" r="7.4" />
      <text
        dominantBaseline="central"
        fill="var(--tu-panel)"
        fontFamily="var(--tu-font-rounded)"
        fontSize="10"
        fontWeight="700"
        textAnchor="middle"
        x="8"
        y="8.4"
      >
        {n}
      </text>
    </svg>
  );
}

export function InspectorSummaryCard({
  title,
  number,
  icon,
  text,
  children,
  style,
}: {
  title?: string;
  /** Draws the "N.circle.fill" symbol before the title (step cards). */
  number?: number;
  icon?: GlyphName;
  text?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.card} style={style}>
      {title ? (
        <span className={styles.cardTitle}>
          {number !== undefined ? <NumberCircle n={number} /> : icon ? <Glyph name={icon} size={17} /> : null}
          {title}
        </span>
      ) : null}
      {text ? <span className={styles.cardText}>{text}</span> : null}
      {children}
    </div>
  );
}

export function MetaTileGrid({ minimum = 180, children }: { minimum?: number; children: ReactNode }) {
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minimum}px, 1fr))` }}>
      {children}
    </div>
  );
}

/** The bare tile surface (padding 9, inner .42, r8, separator ring). */
export function InspectorTile({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.tile} style={style}>
      {children}
    </div>
  );
}

/** Label(…, systemImage:) .caption .secondary: a tile's heading row. */
export function TileLabel({ icon, children }: { icon: GlyphName; children: ReactNode }) {
  return (
    <span className={styles.tileLabel}>
      <Glyph name={icon} size={11} />
      <span>{children}</span>
    </span>
  );
}

export function MetaTile({ label, icon, value }: { label: string; icon: GlyphName; value: string }) {
  return (
    <InspectorTile>
      <TileLabel icon={icon}>{label}</TileLabel>
      <span className={styles.tileValue}>{value || "To be decided"}</span>
    </InspectorTile>
  );
}

export function InspectorMenuLabel({ icon, label }: { icon: GlyphName; label: string }) {
  return (
    <span className={styles.menuLabel}>
      <Glyph name={icon} size={11} />
      {label}
      <Glyph className={styles.menuChevron} name="chevron.down" size={8} weight="bold" />
    </span>
  );
}

export function InspectorSection({
  title,
  empty,
  children,
}: {
  title: string;
  /** Shown (callout, secondary) instead of children. */
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.section}>
      <span className={styles.headline}>{title}</span>
      {empty !== undefined ? <span className={styles.cardText}>{empty}</span> : children}
    </div>
  );
}

/** Label(text, systemImage:) in .callout (completion criteria, outcomes). */
export function InspectorLabel({ icon, children, secondary }: { icon: GlyphName; children: ReactNode; secondary?: boolean }) {
  return (
    <span className={styles.labelRow} style={secondary ? { color: "var(--tu-label-2)" } : undefined}>
      <Glyph name={icon} size={13} />
      {children}
    </span>
  );
}

export function InspectorDetail({ label, values }: { label: string; values: string[] }) {
  return <span className={styles.caption}>{`${label}: ${values.join(", ")}`}</span>;
}

export function InspectorSubheadline({ children }: { children: ReactNode }) {
  return <span className={styles.subheadline}>{children}</span>;
}

export function InspectorRow({
  title,
  detail,
  icon,
  scope = false,
}: {
  title: string;
  detail?: string;
  icon: GlyphName;
  /** The `scope` "Inspect" button (shown when the row's node is not selected). */
  scope?: boolean;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>
        <Glyph name={icon} size={14} />
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{title}</span>
        {detail ? <span className={styles.caption}>{detail}</span> : null}
      </span>
      {scope ? (
        <span className={styles.rowScope}>
          <Glyph name="scope" size={14} />
        </span>
      ) : null}
    </div>
  );
}
