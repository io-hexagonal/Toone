import type { ReactNode } from "react";
import styles from "../docs-ui.module.css";
import { Button } from "../Button";
import { Glyph } from "../glyphs";
import { StatusChip } from "../Pill";

/**
 * Routine Creator graph container and toolbar
 * (Features/Organization/Views/RoutineDraftPipelineView.swift:56-231).
 * Container: r14, innerBackground @0.38, 1pt separator @0.75, clipped.
 * Toolbar: title + summary · [status chip] · Run setup / Artefacts / Steps
 * chips · fit + "Focus selection". The toolbar is a horizontal ScrollView
 * (:137) with no truncation or overflow menu: at a narrow width the app shows
 * the leading items and clips the rest mid-word at the right edge. A 640px
 * figure is narrower than the real panel, so figures pass `clipAfter` to end
 * the toolbar on the last item that fits whole instead of slicing one.
 */

export function GraphContainer({
  toolbar,
  children,
  footer,
}: {
  toolbar: ReactNode;
  /** The <GraphCanvas>. */
  children: ReactNode;
  /** Optional <FocusStrip> (shown when the selected node has a live thread). */
  footer?: ReactNode;
}) {
  return (
    <div className={styles.graphContainer}>
      {toolbar}
      <div className={styles.graphDivider} />
      {children}
      {footer ? (
        <>
          <div className={styles.graphDivider} />
          {footer}
        </>
      ) : null}
    </div>
  );
}

/**
 * The toolbar summary line, exactly as the app builds it. Note the app always
 * writes "sub-routines" and "artefacts" (no singular), while run values and
 * resources do pluralise (RoutineInputPresentation.summary).
 */
export function pipelineSummary(counts: {
  steps: number;
  subRoutines: number;
  runValues: number;
  resources: number;
  artefacts: number;
}): string {
  const values = `${counts.runValues} ${counts.runValues === 1 ? "run value" : "run values"}`;
  const resources = `${counts.resources} ${counts.resources === 1 ? "resource" : "resources"}`;
  return `${counts.steps} steps · ${counts.subRoutines} sub-routines · ${values} · ${resources} · ${counts.artefacts} artefacts`;
}

/** Toolbar items in the app's order, leading → trailing. */
const TOOLBAR_ITEMS = ["runSetup", "artefacts", "steps", "fit", "focus"] as const;
export type ToolbarItem = (typeof TOOLBAR_ITEMS)[number];

function ToolbarDivider({ height }: { height: number }) {
  return <span className={styles.toolbarDivider} style={{ height }} />;
}

export function GraphToolbar({
  published,
  summary,
  status,
  chips,
  hasSelection,
  clipAfter = "focus",
}: {
  /** "Routine pipeline" when published, "Draft pipeline" otherwise. */
  published: boolean;
  summary: string;
  /** Live status chip, only while a run of the published routine is live. */
  status?: { summary: string; caution?: boolean; runCount?: number };
  chips: { runSetup: boolean; artefacts: boolean; steps: boolean };
  hasSelection: boolean;
  /** Last item drawn; everything after it is past the figure's right edge. */
  clipAfter?: ToolbarItem;
}) {
  const shows = (item: ToolbarItem) => TOOLBAR_ITEMS.indexOf(item) <= TOOLBAR_ITEMS.indexOf(clipAfter);
  return (
    <div className={styles.graphToolbar}>
      <div className={styles.graphToolbarTitle}>
        <span>{published ? "Routine pipeline" : "Draft pipeline"}</span>
        <span>{summary}</span>
      </div>
      <ToolbarDivider height={22} />
      {status ? (
        <>
          <StatusChip caution={status.caution} runCount={status.runCount} summary={status.summary} />
          <ToolbarDivider height={22} />
        </>
      ) : null}
      {shows("runSetup") ? (
        <span className={styles.graphChip} data-active={chips.runSetup ? "true" : undefined}>
          Run setup
        </span>
      ) : null}
      {shows("artefacts") ? (
        <span className={styles.graphChip} data-active={chips.artefacts ? "true" : undefined}>
          Artefacts
        </span>
      ) : null}
      {shows("steps") ? (
        <span className={styles.graphChip} data-active={chips.steps ? "true" : undefined}>
          Steps
        </span>
      ) : null}
      {shows("fit") ? (
        <>
          <ToolbarDivider height={14} />
          <span className={styles.graphToolbarButton} data-tone="secondary">
            <Glyph name="arrow.up.left.and.arrow.down.right" size={11} />
          </span>
        </>
      ) : null}
      {shows("focus") ? (
        <span className={styles.graphToolbarButton} data-disabled={hasSelection ? undefined : "true"}>
          <Glyph name="scope" size={11} />
          Focus selection
        </span>
      ) : null}
    </div>
  );
}

/** Strip under the canvas: selected node label + bordered small "Focus thread". */
export function FocusStrip({ label }: { label: string }) {
  return (
    <div className={styles.focusStrip}>
      <span className={`${styles.focusStripLabel} ${styles.truncate}`}>{label}</span>
      <span style={{ flex: 1 }} />
      <Button icon="bubble.left.and.bubble.right" label="Focus thread" variant="bordered" />
    </div>
  );
}
