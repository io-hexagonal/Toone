import type { CSSProperties, ReactNode } from "react";
import styles from "./RoutineSidebar.module.css";
import { CapsuleTabs } from "./CapsuleTabs";
import { Field } from "./Field";
import { Glyph } from "./glyphs";
import { StatusPill } from "./Pill";

/**
 * P14 RoutineSidebar: the Routines panel's left column, Routines tab.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - column: RoutineCreatorPanelView.swift:482-521 (switcher padding 8, Divider,
 *   width 225…285…320, innerBackground @0.18); switcher :523-561 (CapsuleTabs);
 * - list: OrganizationOverviewView.swift:142-159 (CurrentRoutinesView, list
 *   background innerBackground @innerBackgroundOpacity = 0.05 for Smoky Quartz),
 *   :666-735 (sections, LazyVStack spacing 4, padding h16 / bottom 16, heading
 *   caption semibold, success for Running, padding 8 / 4), :756-771 (controls
 *   row: SearchField + filter + diagnostics, spacing 4, padding v8 h16),
 *   :800-855 (diagnostics 28² checkmark.seal, green when clean), :911-927
 *   (filter glyph, body, secondary), :1010-1059 (family card around a routine,
 *   its sub-routines and its history), :1061-1081 (history);
 * - RoutineSidebarComponents.swift: metrics :19-41, pill :47-86, schedule dot
 *   :109-129, history count :131-155, family card :162-173, history header
 *   :179-200, row :366-566;
 * - run row: RoutineRunHistoryRowView.swift:57-304; compact run controls
 *   RoutineRunControlsView.swift:205-250 (three 22² slots, spacing 2).
 *
 * Every row is a drawing (spans), never a control.
 */

// RoutineSidebarMetrics (RoutineSidebarComponents.swift:19-41)
const M = {
  disclosure: 14,
  gap: 4,
  dot: 6,
  icon: 16,
  runInset: 18, // disclosure + gap
  runChevron: 12,
  runDetailInset: 16, // runChevron + gap
  cardInset: 4,
  rowPadding: 6,
  contentLeading: 10, // cardInset + rowPadding
  headerInset: 28,
  nameInset: 48,
};

export type SidebarTone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONE: Record<SidebarTone, string> = {
  neutral: "neutral",
  accent: "var(--tu-accent)",
  success: "var(--tu-success)",
  warning: "var(--tu-warning)",
  danger: "var(--tu-error)",
};

/** RoutineStatusPill with the sidebar's tone names. */
export function SidebarPill({ label, tone }: { label: string; tone: SidebarTone }) {
  return <StatusPill label={label} tone={TONE[tone]} />;
}

// ---------------------------------------------------------------------------
// Column, switcher, controls row, list
// ---------------------------------------------------------------------------

export function RoutineSidebar({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div className={styles.sidebar} style={{ width }}>
      {children}
    </div>
  );
}

export function RoutineSidebarSwitcher({ selected = "Routines" }: { selected?: "Routines" | "Drafts" | "Bundles" }) {
  return (
    <>
      <div className={styles.switcherBar}>
        <CapsuleTabs selected={selected} tabs={["Routines", "Drafts", "Bundles"]} />
      </div>
      <div className={styles.divider} />
    </>
  );
}

/** Search field, filter button and diagnostics button (no issues: green seal). */
export function RoutineControlsRow({ placeholder = "Search routines" }: { placeholder?: string }) {
  return (
    <div className={styles.controlsRow}>
      <Field placeholder={placeholder} style={{ flex: 1, gap: 8, padding: "0 8px" }} />
      <span className={styles.filterButton}>
        <Glyph name="line.3.horizontal.decrease.circle" size={15} />
      </span>
      <span className={styles.diagnosticsButton}>
        <Glyph name="checkmark.seal" size={15} />
      </span>
    </div>
  );
}

/** CurrentRoutinesView's scroll area (controls row + list): innerBackground @0.05. */
export function RoutineScrollArea({ children }: { children: ReactNode }) {
  return <div className={styles.scrollArea}>{children}</div>;
}

/** The sections under the controls row. */
export function RoutineList({ children }: { children: ReactNode }) {
  return <div className={styles.list}>{children}</div>;
}

export function RoutineSectionHeading({
  title,
  count,
  kind = "plain",
  style,
}: {
  title: string;
  count: number;
  kind?: "running" | "paused" | "plain";
  style?: CSSProperties;
}) {
  return (
    <div className={styles.heading} data-kind={kind} style={style}>
      {kind === "running" ? <Glyph name="play.circle.fill" size={11.5} style={{ ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }} /> : null}
      {kind === "paused" ? <Glyph name="pause.circle.fill" size={11.5} style={{ ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }} /> : null}
      <span>{title}</span>
      <span className={styles.headingCount}>{count}</span>
    </div>
  );
}

/** The neutral card around a routine, its sub-routines and its history. */
export function RoutineFamilyCard({ children }: { children: ReactNode }) {
  return <div className={styles.familyCard}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Routine row: [disclosure][dot][icon] name … [count][pill][history]
// ---------------------------------------------------------------------------

export function RoutineScheduleDot({ isOn }: { isOn: boolean }) {
  return <span className={styles.scheduleDot} data-on={isOn ? "true" : undefined} />;
}

type RoutineRowProps = {
  name: string;
  /** A sub-routine row: arrow.turn.down.right instead of the dot, callout text. */
  isSub?: boolean;
  /** Scheduled or running: the dot is filled green. */
  isOn?: boolean;
  level?: number;
  /** null: no disclosure (an empty 14pt column is kept). */
  expanded?: boolean | null;
  subroutineCount?: number;
  pill?: { label: string; tone: SidebarTone };
  /** The total recorded runs; undefined shows no history button. */
  historyCount?: number;
  note?: string;
  selected?: boolean;
};

export function RoutineRow({
  name,
  isSub = false,
  isOn = false,
  level = 0,
  expanded = null,
  subroutineCount = 0,
  pill,
  historyCount,
  note,
  selected = false,
}: RoutineRowProps) {
  return (
    <div className={styles.rowOuter} data-sub={isSub ? "true" : undefined}>
      <div
        className={styles.row}
        data-selected={selected ? "true" : undefined}
        data-sub={isSub ? "true" : undefined}
        style={{ paddingLeft: M.rowPadding + level * M.runInset }}
      >
        <span className={styles.disclosure}>
          {expanded === null ? null : (
            <Glyph name={expanded ? "chevron.down" : "chevron.right"} size={9} weight="bold" />
          )}
        </span>
        {isSub ? (
          <span className={styles.subMark}>
            <Glyph name="arrow.turn.down.right" size={10} weight="medium" />
          </span>
        ) : (
          <RoutineScheduleDot isOn={isOn} />
        )}
        <span className={styles.rowIcon}>
          <Glyph name="doc.text" size={isSub ? 13 : 14.5} />
        </span>
        <span className={styles.rowName}>{name}</span>
        <span className={styles.rowTrailing}>
          {subroutineCount > 0 ? (
            <span className={styles.subCount}>
              <Glyph name="arrow.triangle.branch" size={10.5} />
              {subroutineCount}
            </span>
          ) : null}
          {note ? <span className={styles.note}>{note}</span> : null}
          {pill ? <SidebarPill label={pill.label} tone={pill.tone} /> : null}
        </span>
        {historyCount !== undefined ? (
          <span className={styles.historyCount}>
            <Glyph name="clock.arrow.circlepath" size={10.5} weight="medium" />
            {historyCount > 0 ? historyCount : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Execution history
// ---------------------------------------------------------------------------

export function RoutineHistoryHeader() {
  return (
    <div className={styles.historyHeader} style={{ paddingLeft: M.contentLeading + M.headerInset }}>
      <span className={styles.historyHeaderIcon}>
        <Glyph name="clock.arrow.circlepath" size={11.5} weight="medium" />
      </span>
      <span>Execution history</span>
    </div>
  );
}

export type StagePhase = "succeeded" | "running" | "pending" | "awaiting input";

const STAGE_GLYPH = {
  succeeded: "checkmark.circle.fill",
  running: "circle.dotted",
  pending: "circle",
  "awaiting input": "questionmark.circle.fill",
} as const;

const STAGE_COLOR: Record<StagePhase, string> = {
  succeeded: "var(--tu-success)",
  running: "var(--tu-accent)",
  "awaiting input": "var(--tu-accent)",
  pending: "var(--tu-text-3)",
};

type RunRowProps = {
  number: number;
  pill: { label: string; tone: SidebarTone };
  /** "2 min ago" (RoutineRunHistoryRow.ageLabel). */
  age: string;
  /** The second line; nil for a completed run. */
  summary?: string;
  /** "Manual · running 2 min" (RoutineRunHistoryRow.metaLabel). */
  meta: string;
  expanded?: boolean;
  /** The latest checkpoint's steps, shown when expanded. */
  stages?: { title: string; phase: StagePhase }[];
  /** Compact run controls (a live run whose routine is not selected). */
  controls?: { canPause: boolean; canContinue: boolean; canCancel: boolean };
  /** Sealed run, expanded: "Restart from a step…" and "Edit routine" under
   * the steps (RoutineRunHistoryRowView.swift:255-292). */
  actions?: boolean;
};

export function RunRow({ number, pill, age, summary, meta, expanded = false, stages, controls, actions = false }: RunRowProps) {
  return (
    <div className={styles.runOuter}>
      <div
        className={styles.run}
        data-expanded={expanded ? "true" : undefined}
        style={{ paddingLeft: M.rowPadding + M.runInset }}
      >
        <div className={styles.runIdentity}>
          <span className={styles.runChevron}>
            <Glyph name={expanded ? "chevron.down" : "chevron.right"} size={9} weight="bold" />
          </span>
          <span className={styles.runNumber}>Run #{number}</span>
          <SidebarPill label={pill.label} tone={pill.tone} />
          <span className={styles.runAge}>{age}</span>
        </div>
        {summary ? <div className={styles.runSummary}>{summary}</div> : null}
        <div className={styles.runMeta}>
          <span className={styles.runMetaText}>{meta}</span>
          {controls ? <RunControls {...controls} /> : null}
        </div>
        {expanded ? (
          <div className={styles.runDetail}>
            {(stages ?? []).map((stage, index) => (
              <div className={styles.stage} key={stage.title}>
                <span className={styles.stageIcon} style={{ color: STAGE_COLOR[stage.phase] }}>
                  <Glyph
                    name={STAGE_GLYPH[stage.phase]}
                    size={10.5}
                    style={{ ["--tu-glyph-knockout" as string]: "#262626" }}
                  />
                </span>
                <span className={styles.stageNumber}>{index + 1}.</span>
                <span className={styles.stageTitle}>{stage.title}</span>
                <span className={styles.stageLabel}>{stage.phase}</span>
              </div>
            ))}
            {actions ? <RunActions /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Pause / Continue / Cancel run as three fixed 22² icon slots. */
export function RunControls({ canPause, canContinue, canCancel }: NonNullable<RunRowProps["controls"]>) {
  return (
    <span className={styles.runControls}>
      <span className={styles.runControlSlot}>{canPause ? <Glyph name="pause.fill" size={10} /> : null}</span>
      <span className={styles.runControlSlot}>{canContinue ? <Glyph name="play.fill" size={10} /> : null}</span>
      <span className={styles.runControlSlot}>{canCancel ? <Glyph name="stop.fill" size={10} /> : null}</span>
    </span>
  );
}

/**
 * A sealed run's actions (RoutineRunHistoryRowView.swift:255-292): VStack
 * spacing 4, top 4; Divider at 0.5 opacity; HStack spacing 12 of two
 * borderless accent labels in .caption medium (the restart menu hides its
 * indicator).
 */
function RunActions() {
  const label = { fontSize: 10, lineHeight: "13px", fontWeight: 500, color: "var(--tu-accent)", whiteSpace: "nowrap" } as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
      <div style={{ height: 1, background: "var(--tu-sep)", opacity: 0.5 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 18 }}>
        <span style={label}>Restart from a step…</span>
        <span style={label}>Edit routine</span>
      </div>
    </div>
  );
}
