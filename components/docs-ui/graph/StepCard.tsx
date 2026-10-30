import styles from "../docs-ui.module.css";
import { LiveBadge } from "../Pill";
import { liveColor } from "./NodeCard";
import { alpha, NodeSurface } from "./NodeSurface";
import type { PlacedNode } from "./types";

/**
 * Step card: RoutinePipelineGraphComponents.swift:247-294. 150×36, r8,
 * fill inner @0.85, inside border 1 (2 selected), caption2 medium label
 * centred. Border is accent when selected, the live colour @0.9 while running,
 * separator otherwise: step cards never show completed/failed colours.
 * Optional stubs above/below in 8pt (input / artefact colour), stack spacing 2.
 * The live badge is pinned top-trailing at (+6, −6).
 */

function lastPathSegment(value: string): string {
  const stripped = value.split(" ")[0] ?? value;
  return stripped.split("/").filter(Boolean).pop() ?? stripped;
}

function stubText(prefix: string, values: string[]): string {
  const shown = values.slice(0, 2).map(lastPathSegment).join(" · ");
  return `${prefix} ${shown}${values.length > 2 ? ` +${values.length - 2}` : ""}`;
}

type Props = { node: PlacedNode; selected: boolean; presentsLiveActivity?: boolean };

export function StepCard({ node, selected, presentsLiveActivity = true }: Props) {
  const live = presentsLiveActivity && node.runState === "running";
  const hue = liveColor(node.liveLabel);
  const border = selected ? "var(--tu-accent)" : live ? alpha(hue, 90) : "var(--tu-sep)";
  return (
    <div className={styles.stepStack}>
      {node.stepIns?.length ? (
        <span className={styles.stepStub} style={{ color: "var(--tu-pipe-input)" }}>
          {stubText("↓", node.stepIns)}
        </span>
      ) : null}
      <NodeSurface
        borderColor={border}
        borderWidth={selected ? 2 : 1}
        className={styles.stepCard}
        height={node.h}
        running={live}
        width={node.w}
      >
        <span className={styles.truncate} style={{ maxWidth: "100%" }}>{node.label}</span>
        {live ? <LiveBadge label={node.liveLabel ?? "RUNNING"} style={{ position: "absolute", top: -6, right: -6, zIndex: 3 }} /> : null}
      </NodeSurface>
      {node.stepOuts?.length ? (
        <span className={styles.stepStub} style={{ color: "var(--tu-pipe-artefact)" }}>
          {stubText("↑", node.stepOuts)}
        </span>
      ) : null}
    </div>
  );
}
