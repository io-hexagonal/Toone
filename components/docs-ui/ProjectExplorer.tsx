import type { ReactNode } from "react";
import { Glyph, type GlyphName } from "./glyphs";
import styles from "./ProjectExplorer.module.css";

/**
 * Project Explorer building blocks (right panel). Drawings, not controls.
 * - DisclosureHeader: a section's disclosure header.
 * - BrowserHeader: the file browser's header.
 * - FileTreeRow: one file or folder row: icon and colour by file type, and a
 *   "+" badge coloured by how recently the file changed.
 * - FileTree: the tree's stack (spacing 0) with 8pt padding.
 */

/** File icon colour names → the colours the file tree draws them in. */
export const FILE_ICON_COLOR = {
  accent: "var(--tu-accent)",
  /** .yellow.opacity(0.8): folders. systemYellow (dark) #FFD60A. */
  yellow: "rgba(255, 214, 10, 0.8)",
  /** Secondary text colour: md / txt / unknown files. */
  gray: "var(--tu-text-2)",
} as const;

/** File badge colours by recency: green .90 / .60, white .40 / .20. */
export const FILE_BADGE_COLOR = {
  fresh: "color-mix(in srgb, var(--tu-success) 90%, transparent)",
  recent: "color-mix(in srgb, var(--tu-success) 60%, transparent)",
  moderate: "rgba(255, 255, 255, 0.4)",
  aging: "rgba(255, 255, 255, 0.2)",
} as const;

export function DisclosureHeader({
  title,
  icon,
  expanded,
  count,
}: {
  title: string;
  icon: GlyphName;
  expanded: boolean;
  count?: number;
}) {
  return (
    <div className={styles.disclosure}>
      <span className={styles.disclosureChevron}>
        <Glyph name={expanded ? "chevron.down" : "chevron.right"} size={10} weight="semibold" />
      </span>
      <span className={styles.disclosureIcon}>
        <Glyph name={icon} size={15} weight="medium" />
      </span>
      <span className={styles.disclosureTitle}>{title}</span>
      {count === undefined ? null : <span className={styles.disclosureCount}>{count}</span>}
    </div>
  );
}

export function BrowserHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className={styles.browserHeader}>
      <span className={styles.browserTitle}>{title}</span>
      {badge ? <span className={styles.browserBadge}>{badge}</span> : null}
      <span className={styles.browserRefresh}>
        <Glyph name="arrow.clockwise" size={15} weight="medium" />
      </span>
    </div>
  );
}

export type FileTreeRowSpec = {
  title: string;
  icon: GlyphName;
  /** One of FILE_ICON_COLOR, or any CSS colour. */
  iconColor: string;
  level: number;
  /** Directories draw a chevron; files an empty 14-wide slot. */
  directory?: boolean;
  expanded?: boolean;
  /** Recently touched file: draws the "+" badge in this tier's colour. */
  badge?: keyof typeof FILE_BADGE_COLOR;
  state?: "hover" | "selected";
  metadata?: string;
};

export function FileTreeRow({ row }: { row: FileTreeRowSpec }) {
  return (
    <div className={styles.row} data-state={row.state} style={{ paddingLeft: row.level * 16 + 4 }}>
      <span className={styles.rowChevron}>
        {row.directory ? <Glyph name={row.expanded ? "chevron.down" : "chevron.right"} size={11} /> : null}
      </span>
      {row.badge ? (
        <span className={styles.rowBadge} style={{ color: FILE_BADGE_COLOR[row.badge] }}>
          +
        </span>
      ) : null}
      <span className={styles.rowIcon} style={{ color: row.iconColor }}>
        <Glyph name={row.icon} size={14} />
      </span>
      <span className={styles.rowTitle}>{row.title}</span>
      {row.metadata ? <span className={styles.rowMeta}>{row.metadata}</span> : null}
    </div>
  );
}

export function FileTree({ rows, children }: { rows: FileTreeRowSpec[]; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
      {rows.map((row, i) => (
        <FileTreeRow key={`${row.level}-${row.title}-${i}`} row={row} />
      ))}
      {children}
    </div>
  );
}
