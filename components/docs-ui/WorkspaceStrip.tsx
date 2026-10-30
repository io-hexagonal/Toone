import type { CSSProperties, ReactNode } from "react";
import { Glyph } from "./glyphs";
import styles from "./WorkspaceStrip.module.css";

/**
 * P4 WorkspaceStrip (UI/Layout/WorkspaceStripView.swift:13-113, pill
 * :197-279). The project strip across the top of the left panel
 * (LeftOrchestratorView.swift:727-734), followed there by a separator.
 *
 * - `pills`: one per workspace. `active` gets the accent capsule and the
 *   filled index badge; `hover` shows the half-strength hover fill and, when
 *   more than one workspace exists, the small close button; `unread`
 *   (inactive only) pulses its accent stroke.
 * - `add`: the "+" (shown while fewer than 9 workspaces exist), optionally in
 *   hover state; `addOverlay` renders inside its box (e.g. a <Tooltip>).
 *
 * Drawings, not controls: everything renders as <span>/<div>.
 */

export type WorkspacePillSpec = {
  index: number;
  name: string;
  active?: boolean;
  hover?: boolean;
  unread?: boolean;
  /** Drawn inside the pill (e.g. the hovered pill's <Tooltip>). */
  overlay?: ReactNode;
};

type Props = {
  pills: WorkspacePillSpec[];
  /** false hides the "+" (9 workspaces reached). */
  add?: false | { hover?: boolean };
  addOverlay?: ReactNode;
  style?: CSSProperties;
};

export function WorkspacePill({ pill, showClose }: { pill: WorkspacePillSpec; showClose: boolean }) {
  const unread = Boolean(pill.unread && !pill.active);
  return (
    <span
      className={styles.pill}
      data-active={pill.active ? "true" : undefined}
      data-hover={pill.hover ? "true" : undefined}
      data-unread={unread ? "true" : undefined}
    >
      <span className={styles.badge}>{pill.index}</span>
      <span className={styles.name}>{pill.name}</span>
      {pill.hover && showClose ? (
        <span className={styles.close}>
          <Glyph name="xmark" size={8} weight="bold" />
        </span>
      ) : null}
      {pill.overlay}
    </span>
  );
}

export function WorkspaceStrip({ pills, add = {}, addOverlay, style }: Props) {
  return (
    <div className={styles.strip} style={style}>
      {pills.map((pill) => (
        <WorkspacePill key={pill.index} pill={pill} showClose={pills.length > 1} />
      ))}
      {add ? (
        <span className={styles.add} data-hover={add.hover ? "true" : undefined}>
          <Glyph name="plus" size={15} weight="medium" />
          {addOverlay}
        </span>
      ) : null}
    </div>
  );
}
