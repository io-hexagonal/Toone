import type { CSSProperties } from "react";
import styles from "./PulsingDot.module.css";

/**
 * PulsingDot: the active-state dot (meeting mode, listening, browser tab
 * activity). Source: Features/Chat/Views/PulsingDot.swift (main repo):
 * Circle(size) in `color`, opacity 0.3 ↔ 1.0 easeInOut(duration) forever
 * (autoreverse), shadow color @0.6 radius size/2.
 *
 * Motion only under prefers-reduced-motion: no-preference; the static dot
 * sits at full opacity.
 */
export function PulsingDot({
  size = 8,
  color = "var(--tu-error)",
  duration = 0.8,
  style,
}: {
  size?: number;
  color?: string;
  /** Seconds per half-cycle (SwiftUI's duration with autoreverse). */
  duration?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className={styles.dot}
      style={{
        width: size,
        height: size,
        ["--pd-color" as string]: color,
        ["--pd-blur" as string]: `${size}px`,
        ["--pd-duration" as string]: `${duration}s`,
        ...style,
      }}
    />
  );
}
