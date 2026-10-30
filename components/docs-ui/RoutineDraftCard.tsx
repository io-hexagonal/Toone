import { Glyph } from "./glyphs";
import styles from "./RoutineDraftCard.module.css";

/**
 * The routine draft card a drafting thread shows in chat (the "routine
 * handoff" card). It sits in its own assistant message, under the
 * supervisor's reply, with only the meta row below it.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/RichMessageBubble.swift:525-650
 *   (RoutineDraftCardView): VStack spacing 8; header button = HStack spacing
 *   8 [point.3.connected.trianglepath.dotted .title3 in AppColors.primary]
 *   [VStack spacing 2: name callout semibold textPrimary / status caption
 *   textSecondary] Spacer(min 16) [chevron.right caption semibold
 *   textTertiary]; then Divider().opacity(0.45) and a trailing
 *   .borderedProminent .small button (paperplane.fill + "Publish", or
 *   play.fill + "Run" once published); padding 16, r12, fill primary @0.10,
 *   1pt stroke primary @0.28.
 * - status text :667-682 ("<Status> · revision N" for a card pinned to a
 *   checked revision), action title :693-697.
 * - placement: trailing local content of the message (:139-147, :470-480);
 *   cards are posted after each closing check, one per checked revision
 *   (Core/Services/RoutineCreator/RoutinePreparationContext.swift:100-127).
 *
 * AppColors.primary is Color.accentColor; the docs draw it with --tu-accent
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
  /** "Publish" (draft), "Run" (published), or none (superseded / Routine Creator only). */
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
