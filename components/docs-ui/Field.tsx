import type { CSSProperties } from "react";
import styles from "./docs-ui.module.css";
import { cx } from "./cx";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P7 Field. Sources: SearchField.swift:18-75 (search: magnifyingglass 13,
 * min-h 32, r12, inputBg .78, inputBorder .8 @ 0.5pt, focused accent .65 @ 1pt),
 * InAppBrowserView.swift:102-180 (url: inputBg .88).
 *
 * Pass `value` for typed text, otherwise `placeholder` renders in tertiary.
 */
type Props = {
  variant?: "search" | "text" | "url";
  placeholder?: string;
  value?: string;
  focused?: boolean;
  icon?: GlyphName | null;
  style?: CSSProperties;
};

export function Field({ variant = "search", placeholder, value, focused, icon, style }: Props) {
  const glyph = icon === null ? null : (icon ?? (variant === "search" ? "magnifyingglass" : undefined));
  return (
    <div
      className={cx(styles.field, variant === "url" && styles["field-url"])}
      data-focused={focused ? "true" : undefined}
      style={style}
    >
      {glyph ? <Glyph className={styles.fieldIcon} name={glyph} size={13} /> : null}
      <span className={cx(styles.truncate, !value && styles.fieldPlaceholder)}>{value || placeholder}</span>
    </div>
  );
}
