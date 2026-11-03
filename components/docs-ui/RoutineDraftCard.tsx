import { Glyph } from "./glyphs";
import styles from "./RoutineDraftCard.module.css";

/**
 * The routine draft card a drafting thread shows in chat (the "routine
 * handoff" card). It sits in its own assistant message, under the
 * agent's reply, with only the meta row below it.
 *
 * The app's primary colour is the accent colour; the docs draw it with --tu-accent
 * (Smoky Quartz grey). calibrate: the small prominent button.
 */
export function RoutineDraftCard({
  name,
  status,
  action = "Publish",
}: {
  name: string;
  /** e.g. "Drafting · revision 1" or "Ready · revision 3". */
  status: string;
  /** "Publish" (draft), "Run" (published), or none (superseded / drafting thread only). */
  action?: "Publish" | "Run" | null;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <Glyph color="var(--tu-accent)" name="point.3.connected.trianglepath.dotted" size={17} />
        <span className={styles.titles}>
          <span className={styles.name}>{name}</span>
          <span className={styles.status}>{status}</span>
        </span>
        <span className={styles.chevron}>
          <Glyph name="chevron.right" size={11} weight="semibold" />
        </span>
      </div>
      {action ? (
        <>
          <div className={styles.divider} />
          <div className={styles.actions}>
            <span className={styles.prominent}>
              <Glyph name={action === "Run" ? "play.fill" : "paperplane.fill"} size={11} />
              {action}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
