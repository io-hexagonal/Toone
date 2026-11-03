import type { ReactNode } from "react";
import styles from "./ExploreSubmissions.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * Explore → My submissions pieces (P8 SubmissionRow, P9 SubmissionStatusBadge).
 */

export type SubmissionStatus = "pending" | "approved" | "rejected";

const STATUS: Record<SubmissionStatus, { label: string; symbol: GlyphName; color: string }> = {
  approved: { label: "Approved", symbol: "checkmark.circle", color: "var(--tu-success)" },
  pending: { label: "Pending", symbol: "clock", color: "var(--tu-warning)" },
  rejected: { label: "Rejected", symbol: "exclamationmark.circle", color: "var(--tu-error)" },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, symbol, color } = STATUS[status];
  return (
    <span className={styles.badge} style={{ color, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
      <Glyph name={symbol} size={12} weight="semibold" />
      {label}
    </span>
  );
}

export function PanelSectionHeader({ title, icon, count }: { title: string; icon?: GlyphName; count?: number }) {
  return (
    <div className={styles.sectionHeader}>
      {icon ? (
        <span className={styles.sectionIcon}>
          <Glyph name={icon} size={14} weight="medium" />
        </span>
      ) : null}
      <span className={styles.sectionTitle}>{title}</span>
      <span className={styles.spacer} />
      {count !== undefined ? <span className={styles.sectionCount}>{count}</span> : null}
    </div>
  );
}

export function SubmissionCard({
  title,
  subtitle,
  status,
  icon = "arrow.triangle.branch",
  expanded = false,
  children,
}: {
  title: string;
  subtitle: string;
  status: SubmissionStatus;
  icon?: GlyphName;
  expanded?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header} data-selected={expanded ? "true" : undefined}>
        <span className={styles.iconTile}>
          <Glyph name={icon} size={16} weight="medium" />
        </span>
        <span className={styles.identity}>
          <span className={styles.title}>{title}</span>
          <span className={styles.subtitle}>{subtitle}</span>
        </span>
        <span className={styles.spacer} />
        <SubmissionStatusBadge status={status} />
        <span className={styles.chevron}>
          <Glyph name={expanded ? "chevron.down" : "chevron.right"} size={11} weight="semibold" />
        </span>
      </div>
      {expanded ? <div className={styles.body}>{children}</div> : null}
    </div>
  );
}

export function SubmissionNotes({
  summary,
  submitted,
  reviewed,
  reviewNote,
}: {
  summary: string;
  submitted: string;
  reviewed?: string;
  reviewNote?: string;
}) {
  return (
    <div className={styles.notes}>
      {summary ? <span className={styles.secondary}>{summary}</span> : null}
      <span className={styles.dates}>
        <span>Submitted {submitted}</span>
        {reviewed ? <span>Reviewed {reviewed}</span> : null}
      </span>
      {reviewNote ? (
        <span className={styles.reviewNote}>
          <span className={styles.reviewNoteTitle}>Review note</span>
          <span className={styles.secondary}>{reviewNote}</span>
        </span>
      ) : null}
    </div>
  );
}

export function SubmissionActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
