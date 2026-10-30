import type { CSSProperties, ReactNode } from "react";
import styles from "./docs-ui.module.css";
import { cx } from "./cx";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P5 Buttons. Sources: ButtonStyles.swift:15-69 (icon), RoutineActionButtonStyle.swift
 * (routine-*), SetupFlowChoiceStepView.swift:77-101 (setup). `prominent` and
 * `bordered` are native macOS controls: their geometry is a placeholder until
 * calibrated against a capture.
 *
 * Buttons are drawings, not controls: they render a <span>, never a <button>.
 */
export type ButtonVariant =
  | "icon"
  | "prominent"
  | "bordered"
  | "setup"
  | "plain";

type Props = {
  variant: ButtonVariant;
  label?: ReactNode;
  icon?: GlyphName;
  /** Glyph size; defaults to ~1.1× the variant's text size. */
  iconSize?: number;
  state?: "hover" | "pressed";
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
};

const ICON_SIZE: Record<ButtonVariant, number> = {
  icon: 16,
  prominent: 14,
  bordered: 12,
  setup: 14,
  plain: 11,
};

export function Button({ variant, label, icon, iconSize, state, disabled, style, className }: Props) {
  return (
    <span
      className={cx(styles.button, styles[`button-${variant}`], className)}
      data-disabled={disabled ? "true" : undefined}
      data-state={state}
      style={style}
    >
      {icon ? <Glyph name={icon} size={iconSize ?? ICON_SIZE[variant]} /> : null}
      {label}
    </span>
  );
}
