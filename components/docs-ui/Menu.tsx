import type { CSSProperties } from "react";
import styles from "./Menu.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P19 Menu: a native dark NSMenu lookalike (macOS 26), drawn open.
 *
 * No geometry for NSMenu exists in the repo: every number here is a guess
 * to CALIBRATE from a capture of the running app (plan §5.2):
 * - background rgba(42,42,44,.96) with a white-14% 0.5px inner hairline, a
 *   black-50% 0.5px outer rim and a window shadow;
 * - corner radius 11, 5px inner padding;
 * - item height 24, 13pt regular label at white .85, 16px icon column at
 *   x = 10, label at x = 34, 22px right padding;
 * - highlighted item: theme accent fill (Smoky Quartz grey; the docs keep every figure in the theme), r7, white label/icon;
 * - separator: 1px white 10% with 10px side margins and 5px vertical margins.
 * SwiftUI menu items built with `Button("…", systemImage:)` show their symbol
 * on macOS 26 menus.
 */

export type MenuItem =
  | { label: string; icon?: GlyphName; highlighted?: boolean; disabled?: boolean; shortcut?: string }
  | "separator";

export function Menu({ items, style }: { items: MenuItem[]; style?: CSSProperties }) {
  const hasIcons = items.some((item) => item !== "separator" && item.icon);
  return (
    <div className={styles.menu} style={style}>
      {items.map((item, i) =>
        item === "separator" ? (
          <div className={styles.separator} key={`sep-${i}`} />
        ) : (
          <div
            className={styles.item}
            data-disabled={item.disabled ? "true" : undefined}
            data-highlighted={item.highlighted ? "true" : undefined}
            data-icons={hasIcons ? "true" : undefined}
            key={item.label}
          >
            {item.icon ? (
              <span className={styles.icon}>
                <Glyph name={item.icon} size={15} />
              </span>
            ) : null}
            <span className={styles.label}>{item.label}</span>
            {item.shortcut ? <span className={styles.shortcut}>{item.shortcut}</span> : null}
          </div>
        ),
      )}
    </div>
  );
}
