import type { ReactNode } from "react";
import { DestinationHeader } from "./DestinationHeader";
import styles from "./GitTimeline.module.css";
import { Glyph } from "./glyphs";

/**
 * Project History (the Timeline): the left-panel destination's pieces.
 * Source: Features/GitTimeline/GitTimelinePanelView.swift (main repo) and
 * GitWorkingChangesView.swift.
 *
 * - TimelineDestination  LeftOrchestratorView.swift:1300-1308: destination
 *                        header "Timeline", then the panel with
 *                        showsPanelHeader false: the embedded toolbar
 *                        (:219-238: "Checked …" caption2 tertiary · Spacer ·
 *                        arrow.clockwise icon button; padding h16, min-h 32),
 *                        Divider, and the repository root Label (:67-77:
 *                        folder + path, caption2 secondary, padding 14/6).
 * - TimelineSection      GitWorkingChangesView.swift:3-33: chevron.right 9pt
 *                        semibold rotated 90° when open · title caption2
 *                        semibold kerning 0.8 · count caption2 monospaced in
 *                        a secondary @0.12 capsule (padding 6/2); all
 *                        secondary; padding 14/10. `empty` is the line under
 *                        an empty open section (:48-54: caption tertiary,
 *                        padding h30, bottom 12).
 * - PersonFilterBar      GitTimelinePanelView.swift:394-447: chips in a
 *                        secondary @0.08 r7 track (padding 2, spacing 2),
 *                        inset 14, vertical padding 8; chip = 6pt dot ·
 *                        caption (semibold when on) · padding 10/4, on =
 *                        secondary @0.18 r6.
 * - DayHeader            :496-503: title uppercased, caption2 semibold,
 *                        kerning 0.8, secondary, padding h14 top 12 bottom 4.
 * - CommitRow            :518-569: 8pt person dot · VStack(spacing 1)
 *                        [subject callout medium · author caption secondary]
 *                        · Spacer(min 8) · reference chips · relative date
 *                        caption2 monospacedDigit tertiary; padding 14/7,
 *                        selected accent @0.12 r6; outer padding h6.
 * - ReferenceChip        :571-581: caption2 semibold, padding 7/2, capsule;
 *                        "you are here" accent @0.18 + accent text, "last
 *                        known backup" secondary @0.12.
 * - CompactBackRow       :251-264: Label("Timeline", chevron.left), caption
 *                        semibold, plain; padding h16, min-h 32; Divider.
 * - CommitDetail         :665-709: VStack(spacing 12) padding 14: subject
 *                        callout semibold · "agent-or-author · %ar" caption
 *                        secondary · "What happened here?" (sparkles,
 *                        caption semibold, .small) · "WHAT CHANGED" caption2
 *                        semibold kerning 0.8 secondary (+4 top) · file rows.
 * - FileRow              :712-750: change glyph 11pt in its tint (added
 *                        plus.circle green, deleted minus.circle red, else
 *                        pencil.circle secondary) · path caption · Spacer(6)
 *                        · "+N" green / "-N" red caption2 monospacedDigit.
 *
 * Person colours are hard-coded in the app (:51-53): blue, orange, green,
 * purple, pink, teal, by first appearance, newest contributor first.
 */

/**
 * Per-person dots. The app uses SwiftUI .blue/.orange/.green/.purple/.pink/.teal
 * (GitTimelinePanelView.swift:51-53); the docs keep theme colours only, so the
 * first person takes the Smoky Quartz accent and teal becomes the theme taupe.
 */
export const PERSON_COLORS = ["var(--tu-accent)", "#ff9f0a", "#30d158", "#bf5af2", "#ff375f", "#d9ccc7"];

export function TimelineDestination({
  checked,
  repoPath,
  children,
}: {
  checked: string;
  repoPath: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.destination}>
      <DestinationHeader title="Timeline" />
      <div className={styles.toolbar}>
        <span className={styles.checked}>{checked}</span>
        <span className={styles.spacer} />
        <span className={styles.iconButton}>
          <Glyph name="arrow.clockwise" size={15} />
        </span>
      </div>
      <div className={styles.divider} />
      <div className={styles.root}>
        <Glyph name="folder" size={11} />
        <span className={styles.truncate}>{repoPath}</span>
      </div>
      {children}
    </div>
  );
}

export function TimelineDivider() {
  return <div className={styles.divider} />;
}

export function TimelineSection({
  title,
  count,
  expanded = true,
  empty,
}: {
  title: string;
  count: number;
  expanded?: boolean;
  empty?: string;
}) {
  return (
    <>
      <div className={styles.section}>
        <span className={styles.sectionChevron} data-expanded={expanded ? "true" : undefined}>
          <Glyph name="chevron.right" size={10} weight="semibold" />
        </span>
        <span className={styles.kerned}>{title.toUpperCase()}</span>
        <span className={styles.count}>{count}</span>
      </div>
      {expanded && empty ? <div className={styles.empty}>{empty}</div> : null}
    </>
  );
}

export function PersonFilterBar({
  people,
  selected,
}: {
  people: Array<{ name: string; color: string }>;
  /** Index into people, or undefined for "Everyone". */
  selected?: number;
}) {
  return (
    <div className={styles.filterOuter}>
      <div className={styles.filterTrack}>
        <span className={styles.chip} data-on={selected === undefined ? "true" : undefined}>
          Everyone
        </span>
        {people.map((p, i) => (
          <span className={styles.chip} data-on={selected === i ? "true" : undefined} key={p.name}>
            <span className={styles.chipDot} style={{ background: p.color }} />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DayHeader({ title }: { title: string }) {
  return <div className={`${styles.dayHeader} ${styles.kerned}`}>{title.toUpperCase()}</div>;
}

export function ReferenceChip({ label, emphasized }: { label: string; emphasized: boolean }) {
  return (
    <span className={styles.refChip} data-emphasized={emphasized ? "true" : undefined}>
      {label}
    </span>
  );
}

export function CommitRow({
  subject,
  author,
  when,
  color,
  selected,
  chips,
}: {
  subject: string;
  author: string;
  when: string;
  color: string;
  selected?: boolean;
  chips?: ReactNode;
}) {
  return (
    <div className={styles.commitOuter}>
      <div className={styles.commit} data-selected={selected ? "true" : undefined}>
        <span className={styles.commitDot} style={{ background: color }} />
        <span className={styles.commitText}>
          <span className={`${styles.subject} ${styles.truncate}`}>{subject}</span>
          <span className={styles.author}>{author}</span>
        </span>
        <span className={styles.spacer} style={{ minWidth: 8 }} />
        {chips}
        <span className={styles.when}>{when}</span>
      </div>
    </div>
  );
}

export function CompactBackRow() {
  return (
    <>
      <div className={styles.backRow}>
        <Glyph name="chevron.left" size={11} weight="semibold" />
        <span>Timeline</span>
      </div>
      <div className={styles.divider} />
    </>
  );
}

/** Deleted (minus.circle, red) is not drawn by any figure yet. */
export type FileChange = "added" | "modified";

export function CommitDetail({
  subject,
  byline,
  files,
}: {
  subject: string;
  byline: string;
  files: Array<{ path: string; change: FileChange; additions: number; deletions: number }>;
}) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailSubject}>{subject}</div>
      <div className={styles.detailByline}>{byline}</div>
      <span className={styles.explain}>
        <Glyph name="sparkles" size={11} weight="medium" />
        What happened here?
      </span>
      <div className={`${styles.kerned} ${styles.whatChanged}`}>WHAT CHANGED</div>
      {files.map((f) => (
        <div className={styles.fileRow} key={f.path}>
          <Glyph
            color={f.change === "added" ? "var(--tu-success)" : "var(--tu-text-2)"}
            name={f.change === "added" ? "plus.circle" : "pencil.circle"}
            size={12}
          />
          <span className={`${styles.filePath} ${styles.truncate}`}>{f.path}</span>
          <span className={styles.spacer} style={{ minWidth: 6 }} />
          <span className={styles.plus}>+{f.additions}</span>
          <span className={styles.minus}>-{f.deletions}</span>
        </div>
      ))}
    </div>
  );
}
