import type { CSSProperties, ReactNode } from "react";
import styles from "./ActionCard.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P12 ActionCard: the app-owned card pinned above a thread's composer (the
 * routine Issue card and its relatives).
 *
 * - ActionCard          card: padding 12, stacked 8pt apart, r16 continuous,
 *                       card fill + 1pt card border inside.
 * - ActionCardHeader    glyph 13pt semibold in a 16pt column · 8 · title
 *                       body semibold (2 lines max) · Spacer · meta caption
 *                       tertiary · trailing.
 * - ActionCardRows      the rows under the header, indented 16 + 8 = 24 to
 *                       the title's text edge, stacked 8pt apart.
 * - ActionCardDetail    callout, secondary, up to 3 lines.
 * - ActionCardMeta      caption, tertiary.
 * - ActionCardFootnote  info.circle caption tertiary + meta text.
 * - ActionCardWarning   exclamationmark.triangle.fill caption warning +
 *                       callout secondary.
 * - ActionCardInset     the proposal / diff / evidence surface: padding 8,
 *                       r8, code background @0.6.
 * - ActionCardProposal  inside the inset, stacked 4pt apart: label caption
 *                       semibold tertiary, change callout primary (3 lines),
 *                       provenance, note caption secondary, "Show change"
 *                       disclosure.
 * - Disclosure          native DisclosureGroup, collapsed. CALIBRATE: the
 *                       chevron size, weight and gap are guesses.
 * - ActionCardActions   primary, secondary, Spacer(min 8), quiet; in a row
 *                       8pt apart. Pass RoutineActionButtons.
 */

export function ActionCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.card} style={style}>
      {children}
    </div>
  );
}

export function ActionCardHeader({
  title,
  glyph,
  tint,
  meta,
  trailing,
}: {
  title: string;
  glyph: GlyphName;
  /** CSS colour of the glyph, e.g. "var(--tu-warning)". */
  tint: string;
  meta?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={styles.header}>
      <span className={styles.headerGlyph}>
        <Glyph color={tint} name={glyph} size={15} weight="semibold" />
      </span>
      <span className={styles.headerTitle}>{title}</span>
      <span className={styles.spacer} />
      {meta ? <span className={styles.headerMeta}>{meta}</span> : null}
      {trailing}
    </div>
  );
}

export function ActionCardRows({ children }: { children: ReactNode }) {
  return <div className={styles.rows}>{children}</div>;
}

export function ActionCardDetail({ children }: { children: ReactNode }) {
  return <div className={styles.detail}>{children}</div>;
}

export function ActionCardMeta({ children }: { children: ReactNode }) {
  return <div className={styles.meta}>{children}</div>;
}

export function ActionCardFootnote({ children }: { children: ReactNode }) {
  return (
    <div className={styles.iconLine}>
      <Glyph color="var(--tu-text-3)" name="info.circle" size={11} />
      <div className={styles.meta}>{children}</div>
    </div>
  );
}

export function ActionCardWarning({ children }: { children: ReactNode }) {
  return (
    <div className={styles.iconLine}>
      <Glyph color="var(--tu-warning)" name="exclamationmark.triangle.fill" size={11} />
      <div className={styles.detail}>{children}</div>
    </div>
  );
}

export function ActionCardInset({ children }: { children: ReactNode }) {
  return <div className={styles.inset}>{children}</div>;
}

export function ActionCardProposal({
  label = "Proposed fix",
  change,
  provenance,
  note,
  disclosure,
}: {
  /** "Proposed fix" or "Proposed retry". */
  label?: string;
  change: string;
  provenance?: string;
  note?: string;
  /** Collapsed disclosure label, "Show change" when the proposal has a diff. */
  disclosure?: string;
}) {
  return (
    <ActionCardInset>
      <div className={styles.proposalLabel}>{label}</div>
      {change ? <div className={styles.proposalChange}>{change}</div> : null}
      {provenance ? <div className={styles.meta}>{provenance}</div> : null}
      {note ? <div className={styles.proposalNote}>{note}</div> : null}
      {disclosure ? <Disclosure label={disclosure} /> : null}
    </ActionCardInset>
  );
}

/** Native DisclosureGroup label, collapsed (calibrate from a capture). */
export function Disclosure({ label }: { label: string }) {
  return (
    <span className={styles.disclosure}>
      <span className={styles.disclosureChevron}>
        <Glyph name="chevron.right" size={9} weight="bold" />
      </span>
      <span>{label}</span>
    </span>
  );
}

export function ActionCardActions({
  primary,
  secondary,
  quiet,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
  quiet?: ReactNode;
}) {
  return (
    <div className={styles.actions}>
      {primary}
      {secondary}
      <span className={styles.actionSpacer} />
      {quiet}
    </div>
  );
}
