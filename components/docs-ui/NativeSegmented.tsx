import type { CSSProperties } from "react";
import styles from "./NativeSegmented.module.css";

/**
 * P6 (native half): SwiftUI `Picker(...).pickerStyle(.segmented)` on macOS,
 * i.e. an NSSegmentedControl in dark appearance.
 *
 * CALIBRATE: the repo has no geometry for this native control. Height,
 * track/selection fills, radius (macOS 26 draws capsule-ish segments) and the
 * label gap are guesses, to be replaced from a capture of the running app.
 *
 * - `label`: a visible picker label ("Show"). SwiftUI shows it on macOS unless
 *   the picker has `.labelsHidden()`.
 * - `fill`: stretch the segments across the available width (the default for
 *   a segmented picker in a VStack); otherwise the control hugs its content
 *   (`.fixedSize(horizontal: true, ...)`).
 */
type Props = {
  segments: string[];
  selected: number;
  label?: string;
  fill?: boolean;
  style?: CSSProperties;
};

export function NativeSegmented({ segments, selected, label, fill = false, style }: Props) {
  return (
    <div className={styles.picker} data-fill={fill ? "true" : undefined} style={style}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div className={styles.track}>
        {segments.map((segment, index) => (
          <span className={styles.segment} data-selected={index === selected ? "true" : undefined} key={segment}>
            {segment}
          </span>
        ))}
      </div>
    </div>
  );
}
