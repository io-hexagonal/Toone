import type { ReactNode } from "react";
import styles from "./ExploreSubmissions.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * Explore → My submissions pieces (P8 SubmissionRow, P9 SubmissionStatusBadge).
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - ExploreSubmissionCard: APP/Features/WorkflowCatalog/ExploreSubmissionComponents.swift:5-85
 *   (header HStack top spacing 8, padding 8, min-h 60; icon tile 32² r8
 *   accent .10 with a 16pt medium accent symbol; title 13 medium primary,
 *   subtitle 11 secondary, spacing 4; Spacer ≥8; badge; chevron 11 semibold
 *   secondary in 16×32; header uses panelRowSurface, selected = expanded:
 *   accent .12 + 0.5pt accent .32 border r8 (UI/Components/Layout/PanelHeader.swift:182-238);
 *   expanded body VStack spacing 16, padding 16, UI.label 13; whole card
 *   threadCardBackground .65, r8, 0.5pt separator .5 stroke);
 * - ExploreSubmissionStatusBadge :87-118 (Label(status.capitalized, symbol),
 *   UI.badge 11/600, colour green/orange/red, padding 8/4, colour .10 capsule);
 * - ExploreSubmissionNotes :120-154 (summary secondary; "Submitted …" /
 *   "Reviewed …" 11 secondary spacing 4; "Review note" Panel.sectionHeader
 *   12 semibold + reason secondary);
 * - PanelSectionHeader: UI/Components/Layout/PanelHeader.swift:100-133
 *   (HStack spacing 4, icon 13 medium in 16, caption 10 semibold, count
 *   caption2 semibold mono in a hover-fill capsule ≥18, secondary, padding
 *   h16, min-h 32).
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
