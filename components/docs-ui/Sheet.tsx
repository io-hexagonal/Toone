import type { CSSProperties, ReactNode } from "react";
import styles from "./Sheet.module.css";

/**
 * P19 Sheet: a native dark macOS sheet (`.sheet { … }`), drawn over the
 * panel that presents it.
 *
 * The SwiftUI view inside a sheet supplies its own padding and width
 * (e.g. ShareChooserSheet.swift:124, `.padding(24).frame(width: 520)`), so
 * `Sheet` only paints the sheet window: its fill, corner, hairline and
 * shadow. `SheetStage` is the crop around it: the presenting panel's surface
 * with the sheet hanging from the top.
 *
 * CALIBRATE (plan §5.2, no geometry in the repo): macOS 26 draws sheets as
 * floating rounded cards inset from the window's top edge. The fill
 * (window background, a touch lighter than the frozen panel), radius 16,
 * hairline and shadow are guesses to replace from a capture.
 */

export function SheetStage({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.stage} style={style}>
      {children}
    </div>
  );
}

export function Sheet({ width, children, style }: { width: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.sheet} style={{ width, ...style }}>
      {children}
    </div>
  );
}

/** The usual sheet footer: secondary action left, primary right (HStack + Spacer). */
export function SheetFooter({ leading, trailing }: { leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={styles.footer}>
      {leading}
      <span className={styles.spacer} />
      {trailing}
    </div>
  );
}
