import type { ReactNode } from "react";
import { Glyph, type GlyphName } from "./glyphs";
import styles from "./OrgTree.module.css";

/**
 * The right (project) panel's Organization tree (main repo,
 * apps/toone-desktop/Toone/Toone/).
 *
 * - PanelDisclosure   UI/Components/PanelHeader.swift (PanelDisclosureHeader):
 *                     HStack spacing 4: chevron 9pt semibold in a 12pt frame
 *                     · icon 13pt medium in a 16pt frame · title caption
 *                     semibold · Spacer; textSecondary; padding h16, min-h 32.
 * - OrgSectionHeader  Features/Organization/Views/OrgSectionHeaderView.swift:
 *                     HStack spacing 4: chevron (caption, tertiary, 14pt
 *                     frame) · icon .body secondary · title .body primary ·
 *                     count caption2 tertiary in a tertiary @0.15 capsule
 *                     (padding 5/1); padding leading 16 × level, vertical 4,
 *                     horizontal 8.
 * - OrgTypeHeader     MCPSectionView.swift:86-94: caption semibold tertiary,
 *                     leading 16 + 8, top 4.
 * - McpRow            MCPSectionView.swift:96-147: 14pt gap · 6pt status dot
 *                     (green ready, orange enabled-but-needs-key, white 0.3
 *                     off) · icon .body (accent, or white 0.4 off) · name
 *                     .body (primary, or white 0.4 off) · Spacer · badges;
 *                     padding leading 16 + horizontal 8, vertical 4.
 * - OrgBadge          MCPSectionView.swift:217-225: caption2, padding 5/1,
 *                     colour @0.15 capsule, colour text.
 */

export function PanelDisclosure({ title, icon, expanded = true }: { title: string; icon: GlyphName; expanded?: boolean }) {
  return (
    <div className={styles.disclosure}>
      <span className={styles.disclosureChevron}>
        <Glyph name={expanded ? "chevron.down" : "chevron.right"} size={10} weight="semibold" />
      </span>
      <span className={styles.disclosureIcon}>
        <Glyph name={icon} size={14} weight="medium" />
      </span>
      <span className={styles.disclosureTitle}>{title}</span>
    </div>
  );
}

export function OrgSectionHeader({
  title,
  icon,
  count,
  expanded = false,
  level = 0,
}: {
  title: string;
  icon: GlyphName;
  count?: number;
  expanded?: boolean;
  level?: number;
}) {
  return (
    <div className={styles.row} style={{ paddingLeft: 8 + level * 16 }}>
      <span className={styles.sectionChevron}>
        <Glyph name={expanded ? "chevron.down" : "chevron.right"} size={11} />
      </span>
      <Glyph color="var(--tu-text-2)" name={icon} size={15} />
      <span className={styles.name}>{title}</span>
      {count !== undefined ? <span className={styles.count}>{count}</span> : null}
    </div>
  );
}

export function OrgTypeHeader({ title }: { title: string }) {
  return <div className={styles.typeHeader}>{title}</div>;
}

export function OrgBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={styles.badge} style={{ ["--org-badge" as string]: color }}>
      {label}
    </span>
  );
}

export type McpState = "ready" | "needsKey" | "off";

const DOT: Record<McpState, string> = {
  ready: "var(--tu-success)",
  needsKey: "var(--tu-warning)",
  off: "rgb(77, 77, 77)", // Color(white: 0.3)
};

export function McpRow({
  name,
  icon,
  state,
  badges,
  iconColor,
}: {
  name: string;
  icon: GlyphName;
  state: McpState;
  badges?: ReactNode;
  /** Override the icon colour (the built-in row's seal is always accent). */
  iconColor?: string;
}) {
  const off = state === "off";
  return (
    <div className={styles.row} data-off={off ? "true" : undefined} style={{ paddingLeft: 24 }}>
      <span style={{ width: 14, flex: "none" }} />
      <span className={styles.dot} style={{ background: DOT[state] }} />
      <Glyph
        color={iconColor ?? (off ? "rgb(102, 102, 102)" : "var(--tu-accent)")}
        name={icon}
        size={15}
        style={{ ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }}
      />
      <span className={styles.name}>{name}</span>
      <span className={styles.spacer} />
      {badges}
    </div>
  );
}
