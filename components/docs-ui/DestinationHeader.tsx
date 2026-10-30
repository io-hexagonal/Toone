import styles from "./DestinationHeader.module.css";
import { Glyph } from "./glyphs";

/**
 * P2 PanelHeader, left-panel destination variant: the shared header of every
 * embedded destination (System Threads, Conversations, Agents …).
 * Source: UI/Layout/LeftOrchestratorView.swift:1364-1444.
 *
 * HStack spacing 8, padding h8, min-h 44 (panelHeaderMinHeight):
 * [sidebar.left icon button] title (headline = 13 bold) [optional caption2
 * secondary subtitle] … [sidebar.right icon button]; icons 13pt medium,
 * textSecondary, in the ≥28² icon button style. A separator Divider runs
 * along the bottom.
 */
export function DestinationHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={styles.header}>
      <span className={styles.iconButton}>
        <Glyph name="sidebar.left" size={15} weight="medium" />
      </span>
      <span className={styles.titles}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </span>
      <span className={styles.iconButton} style={{ marginLeft: "auto" }}>
        <Glyph name="sidebar.right" size={15} weight="medium" />
      </span>
    </div>
  );
}
