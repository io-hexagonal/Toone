import { Glyph } from "./glyphs";
import styles from "./RailThreads.module.css";

/**
 * The navigation rail's recent-conversation strip, for NavRail's
 * `{ kind: "custom" }` "recentThreads" slot.
 *
 * Source: RecentThreadRailList (apps/toone-desktop/Toone/Toone/UI/Layout/
 * LeftOrchestratorView.swift:3229-3445): user conversations only, LazyVStack
 * spacing 3, padding v4; threadButton :3371-3418 = bubble.left.fill 10pt
 * semibold in a 28² frame coloured by ThreadIndicatorDot (seen = tertiary,
 * processing = accent, unseen = success, attention = warning); selected =
 * accent + 1pt accent stroke r8; hovered = accent on accent .10, scale 1.10.
 */

export type RailThreadSpec = {
  dot?: "seen" | "processing" | "unseen" | "attention";
  state?: "selected" | "hover";
};

export function RailThreads({ threads }: { threads: RailThreadSpec[] }) {
  return (
    <div className={styles.list}>
      {threads.map((t, i) => (
        <span className={styles.item} data-dot={t.dot ?? "seen"} data-state={t.state} key={i}>
          <Glyph name="bubble.left.fill" size={12} weight="semibold" />
        </span>
      ))}
    </div>
  );
}
