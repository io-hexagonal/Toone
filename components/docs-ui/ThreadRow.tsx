import type { ReactNode } from "react";
import styles from "./ThreadRow.module.css";
import { DestinationHeader } from "./DestinationHeader";
import { Field } from "./Field";
import { Glyph } from "./glyphs";

/**
 * P8 Row, System Threads variant. Source: Features/Chat/Views/SystemThreadRow.swift.
 *
 * - ThreadIndicatorDot :14-37: 7pt circle, top padding 5; processing = theme
 *   accent, unseen = success, attention / needs a fix = warning, seen = tertiary.
 * - Row :77-108: HStack(top, spacing 8) dot + VStack(spacing 2); padding h8 v4,
 *   min-h 52, r8; fill secondary @0.06 (hover white .10, selected accent .14 +
 *   1pt accent .6 stroke).
 * - Line 1 :112-171: "<routine>" callout medium primary (truncates first),
 *   "#N" callout monospaced digits secondary, "· <step>" callout medium
 *   primary; trailing time caption2 monospaced tertiary.
 * - Line 2 :175-198: caption2, "<agent>" secondary · tertiary dot · status
 *   (regular secondary when neutral, semibold orange / red otherwise).
 * - Line 3 :202-219: caption2 preview, optional "<author>:" medium tertiary.
 *   Lines 2-3 keep 28pt free on the right while the Stop overlay shows.
 * - Stop :223-236: stop.circle 13pt regular in a 24² frame, trailing padding 4,
 *   secondary, red while hovered (xmark.circle for a queued thread).
 *
 * Text comes from ThreadRowTitle / SystemThreadRowText
 * (Features/Chat/Views/ThreadsHoverButton.swift:187-330).
 */

export type ThreadDot = "processing" | "unseen" | "seen" | "attention";

type Props = {
  /** Routine name (truncates first) or, outside a run, the whole title. */
  routine: string;
  runNumber?: number;
  step?: string;
  /** "Running 1m 12s" / "2 minutes ago". */
  time: string;
  agent: string;
  status: string;
  statusTone?: "neutral" | "warning" | "error";
  preview?: string;
  previewAuthor?: string;
  dot: ThreadDot;
  /** An actively running thread keeps a Stop control. */
  canStop?: boolean;
  state?: "hover" | "selected";
  /** The pointer is on the Stop control: it turns red. */
  stopHovered?: boolean;
};

export function SystemThreadRow({
  routine,
  runNumber,
  step,
  time,
  agent,
  status,
  statusTone = "neutral",
  preview,
  previewAuthor,
  dot,
  canStop = false,
  state,
  stopHovered = false,
}: Props) {
  return (
    <div className={styles.row} data-state={state}>
      <span className={styles.dot} data-dot={dot} />
      <div className={styles.lines}>
        <div className={styles.titleLine}>
          <span className={styles.title}>
            <span className={styles.routine}>{routine}</span>
            {runNumber !== undefined ? <span className={styles.runLabel}>#{runNumber}</span> : null}
            {step ? <span className={styles.step}>· {step}</span> : null}
          </span>
          <span className={styles.time}>{time}</span>
        </div>
        <div className={styles.statusLine} data-stop={canStop ? "true" : undefined}>
          <span className={styles.agent}>{agent}</span>
          <span className={styles.sep}>·</span>
          <span className={styles.status} data-tone={statusTone}>
            {status}
          </span>
        </div>
        {preview ? (
          <div className={styles.previewLine} data-stop={canStop ? "true" : undefined}>
            {previewAuthor ? <span className={styles.author}>{previewAuthor}:</span> : null}
            <span className={styles.preview}>{preview}</span>
          </div>
        ) : null}
      </div>
      {canStop ? (
        <span className={styles.stop} data-hover={stopHovered ? "true" : undefined}>
          <Glyph name="stop.circle" size={15} />
        </span>
      ) : null}
    </div>
  );
}

/**
 * The System Threads destination of the left panel
 * (LeftOrchestratorView.swift:1259-1277, 3484-3560): destination header,
 * "Search system threads" (padding h8 v4), then the rows (LazyVStack
 * spacing 2, padding h8, bottom 8).
 */
export function SystemThreadsDestination({ children }: { children: ReactNode }) {
  return (
    <div>
      <DestinationHeader title="System Threads" />
      <div className={styles.search}>
        <Field placeholder="Search system threads" style={{ gap: 8, padding: "0 8px" }} />
      </div>
      <div className={styles.list}>{children}</div>
    </div>
  );
}
