import type { CSSProperties } from "react";
import styles from "./Tooltip.module.css";

/**
 * Native help tag (SwiftUI `.help("…")`), drawn absolutely positioned inside
 * the element it describes. AppKit places it under the pointer; figures have
 * no cursor, so pass `style` (top/left) to sit it just below the control.
 * Geometry is native: calibrate from a capture.
 */
export function Tooltip({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <span className={styles.tooltip} style={style}>
      {text}
    </span>
  );
}
