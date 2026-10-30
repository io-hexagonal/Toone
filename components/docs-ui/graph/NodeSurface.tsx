import type { CSSProperties, ReactNode } from "react";
import styles from "../docs-ui.module.css";
import { cx } from "../cx";

/**
 * Port of RoutineNodeSurfaceModifier (RoutinePipelineGraphComponents.swift:442-543),
 * legacy (non-glass) renderer: innerBackground fill, border drawn inside the
 * shape; a running card adds a breathing wash, an inner sheen and a rim that
 * falls off toward the bottom. Nothing is drawn outside the card.
 */
type Props = {
  className: string;
  width: number;
  height: number;
  /** Any CSS colour (already including its opacity). */
  borderColor: string;
  borderWidth: number;
  running: boolean;
  style?: CSSProperties;
  children: ReactNode;
};

export function NodeSurface({ className, width, height, borderColor, borderWidth, running, style, children }: Props) {
  return (
    <div
      className={cx(styles.nodeSurface, className)}
      data-running={running ? "true" : undefined}
      style={
        {
          width,
          height,
          "--tu-node-border": borderColor,
          "--tu-node-border-width": `${borderWidth}px`,
          ...style,
        } as CSSProperties
      }
    >
      {running ? (
        <>
          <span className={styles.nodeWash} />
          <span className={styles.nodeSheen} />
        </>
      ) : null}
      {children}
    </div>
  );
}

/** `color` at `percent` opacity, for CSS custom-property colours. */
export function alpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
