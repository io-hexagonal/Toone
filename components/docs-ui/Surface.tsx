import type { CSSProperties, ReactNode } from "react";
import styles from "./docs-ui.module.css";
import { cx } from "./cx";

/**
 * P1 Surface. Sources: FloatingPanel.swift:608-672 (panel, r24),
 * DesignTokens.swift:23 (card, r16), PanelHeader.swift:182-238 (row surface).
 *
 * - `panel`: frozen-glass panel fill, r24 (use when the crop shows a panel corner).
 * - `card`: threadCardBackground + 1pt threadCardBorder, r16.
 * - `inset`: innerBackground @0.42, r8 (inspector tiles, run rows).
 * - `row`: panelRowSurface, r8; `state` = hover | selected | drop.
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
