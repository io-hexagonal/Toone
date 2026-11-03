import type { CSSProperties, ReactNode } from "react";
import styles from "./docs-ui.module.css";
import { cx } from "./cx";

/**
 * P1 Surface: the panel, card, inset and row surfaces.
 *
 * - `panel`: frozen-glass panel fill, r24 (use when the crop shows a panel corner).
 * - `card`: thread card background + 1pt thread card border, r16.
 * - `inset`: inner background @0.42, r8 (inspector tiles, run rows).
 * - `row`: panel row surface, r8; `state` = hover | selected | drop.
 */
export type SurfaceVariant = "panel" | "card" | "inset" | "row";

type Props = {
  variant: SurfaceVariant;
  state?: "hover" | "selected" | "drop";
  radius?: number;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
};

export function Surface({ variant, state, radius, padding, style, className, children }: Props) {
  return (
    <div
      className={cx(styles.surface, styles[`surface-${variant}`], className)}
      data-state={state}
      style={{ borderRadius: radius, padding, ...style }}
    >
      {children}
    </div>
  );
}
