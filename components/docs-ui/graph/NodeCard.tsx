import styles from "../docs-ui.module.css";
import { Glyph, type GlyphName } from "../glyphs";
import { LiveBadge, CAUTION_LABELS } from "../Pill";
import { alpha, NodeSurface } from "./NodeSurface";
import type { NodeKind, PlacedNode } from "./types";

/**
 * Standard graph card (input / routine / sub-routine / artefact / department):
 * RoutinePipelineGraphComponents.swift:174-245. 180×48, r10, fill inner @0.90,
 * inside border 1.5 (2 selected). Glyph `.caption` in the kind colour, title
 * caption medium, subtitle caption2 tertiary, optional trailing "+N",
 * disclosure chevron and health / live badge.
 *
 * The "N⌄" sub-routine count capsule (`:195-210`) is never shown in the app
 * (plan §5.6), so it is not implemented.
 */

export const KIND_GLYPH: Record<NodeKind, GlyphName> = {
  input: "tray.and.arrow.down",
  routine: "list.bullet.rectangle",
  subRoutine: "arrow.turn.down.right",
  artefact: "shippingbox",
  step: "circle.fill",
  department: "building.2",
};

export const KIND_COLOR: Record<NodeKind, string> = {
  input: "var(--tu-pipe-input)",
  routine: "var(--tu-pipe-routine)",
  subRoutine: "var(--tu-pipe-routine)",
  artefact: "var(--tu-pipe-artefact)",
  step: "var(--tu-text-3)",
  department: "var(--tu-pipe-department)",
};

export function liveColor(label?: string): string {
  return label && CAUTION_LABELS.includes(label) ? "var(--tu-warning)" : "var(--tu-running)";
}

type Props = {
  node: PlacedNode;
  selected: boolean;
  /** RoutineDraftPipelineView passes true; the org graph may pass false (spinner). */
  presentsLiveActivity?: boolean;
};

export function NodeCard({ node, selected, presentsLiveActivity = true }: Props) {
  const runState = node.runState ?? "none";
  const health = node.health ?? "ok";
  const live = presentsLiveActivity && runState === "running";
  const liveHue = liveColor(node.liveLabel);

  let border: string;
  if (health === "broken") border = alpha("var(--tu-error)", 85);
  else if (health === "missing") border = alpha("var(--tu-warning)", 85);
  else if (selected) border = "var(--tu-accent)";
  else if (runState === "completed") border = alpha("var(--tu-success)", 60);
  else if (runState === "failed") border = alpha("var(--tu-error)", 60);
  else if (runState === "running") border = live ? alpha(liveHue, 90) : alpha("var(--tu-accent)", 80);
  else border = "var(--tu-sep)";

  return (
    <NodeSurface
      borderColor={border}
      borderWidth={selected ? 2 : 1.5}
      className={styles.nodeCard}
      height={node.h}
      running={live}
      width={node.w}
    >
      <Glyph color={KIND_COLOR[node.kind]} name={KIND_GLYPH[node.kind]} size={11} />
      <div className={styles.nodeCardText}>
        <span className={`${styles.nodeCardTitle} ${styles.truncate}`}>{node.label}</span>
        {node.sublabel ? (
          <span className={`${styles.nodeCardSubtitle} ${styles.truncate}`}>{node.sublabel}</span>
        ) : null}
      </div>
      <div className={styles.nodeCardTrailing}>
        {node.leafArtefactCount ? (
          <span className={styles.nodeArtefactCount}>+{node.leafArtefactCount}</span>
        ) : null}
        {node.expanded !== undefined ? (
          <Glyph
            color="var(--tu-text-3)"
            name={node.expanded ? "chevron.up.circle.fill" : "chevron.down.circle"}
            size={11}
          />
        ) : null}
        {health === "broken" ? (
          <Glyph color="var(--tu-error)" name="exclamationmark.triangle.fill" size={11} />
        ) : health === "missing" ? (
          <Glyph color="var(--tu-warning)" name="questionmark.circle.fill" size={11} />
        ) : runState === "running" ? (
          live ? (
            <LiveBadge label={node.liveLabel ?? "RUNNING"} />
          ) : (
            <Glyph color="var(--tu-text-3)" name="circle.dashed" size={10} />
          )
        ) : null}
      </div>
    </NodeSurface>
  );
}
