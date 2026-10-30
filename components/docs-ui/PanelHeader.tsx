import type { ReactNode } from "react";
import styles from "./docs-ui.module.css";
import { Glyph, type GlyphName } from "./glyphs";

/**
 * P2 PanelHeader (PanelHeader.swift:37-74): icon 16 in a 28 frame,
 * subheadline (11) semibold title, optional caption2 subtitle, min height 44,
 * horizontal padding 16. `trailing` holds icon buttons (sidebar toggles etc.).
 */
type Props = {
  title: string;
  subtitle?: string;
  icon?: GlyphName;
  trailing?: ReactNode;
};

export function PanelHeader({ title, subtitle, icon, trailing }: Props) {
  return (
    <div className={styles.panelHeader}>
      {icon ? (
        <span className={styles.panelHeaderIcon}>
          <Glyph name={icon} size={16} />
        </span>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span className={`${styles.panelHeaderTitle} ${styles.truncate}`}>{title}</span>
        {subtitle ? (
          <span className={`${styles.panelHeaderSubtitle} ${styles.truncate}`}>{subtitle}</span>
        ) : null}
      </div>
      {trailing ? <div className={styles.panelHeaderTrailing}>{trailing}</div> : null}
    </div>
  );
}
