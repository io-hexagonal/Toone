import type { CSSProperties, ReactNode } from "react";
import styles from "./RoutineActionButton.module.css";

/**
 * P5 RoutineActionButton: the one button style of the routine surfaces in a
 * thread (the Issue card's actions, the Applying line's Stop, a notice's
 * [Open]). Source: Features/Chat/Views/RoutineActionButtonStyle.swift.
 *
 * - primary: solid fill of the theme accent (Smoky Quartz white 0.72), label
 *   in the dark base #14161E (the accent's luminance is above 0.30, :48-51).
 * - secondary: AppColors.hoverBackground (white 0.10) + 1pt threadCardBorder
 *   (white 0.08, strokeBorder = inside), label textPrimary.
 * - quiet: text only, textSecondary.
 * - link: accent label, no surface.
 * regular = callout (12) medium, padding 0/12, min-height 28, r8 continuous;
 * compact = caption (10) medium, padding 0/10 (link/quiet 0/6), min-height 20, r6.
 * `hover` reproduces the hover fills (secondary white 0.15, quiet/link white 0.10,
 * primary brightness +0.06).
 *
 * Note: the shared `Button` variants `routine-*` in docs-ui.module.css use
 * the controlTint fill and a 0.5pt white-15% stroke; the Swift style uses the
 * accent fill and a 1pt threadCardBorder. This primitive follows the Swift.
 *
 * A drawing, not a control: renders a <span>.
 */
export type RoutineActionKind = "primary" | "secondary" | "quiet" | "link";

type Props = {
  kind: RoutineActionKind;
  size?: "regular" | "compact";
  hover?: boolean;
  disabled?: boolean;
  children: ReactNode;
  style?: CSSProperties;
};

export function RoutineActionButton({ kind, size = "regular", hover, disabled, children, style }: Props) {
  return (
    <span
      className={styles.button}
      data-disabled={disabled ? "true" : undefined}
      data-hover={hover ? "true" : undefined}
      data-kind={kind}
      data-size={size}
      style={style}
    >
      {children}
    </span>
  );
}
