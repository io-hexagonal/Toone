import { Glyph } from "./glyphs";
import styles from "./RailThreads.module.css";

/**
 * The navigation rail's recent-conversation strip, for NavRail's
 * `{ kind: "custom" }` "recentThreads" slot.
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
