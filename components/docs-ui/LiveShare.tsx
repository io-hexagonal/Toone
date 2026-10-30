import type { CSSProperties, ReactNode } from "react";
import { Glyph, type GlyphName } from "./glyphs";
import styles from "./LiveShare.module.css";

/**
 * Live Share pieces (main repo, apps/toone-desktop/Toone/Toone/Features/Business/Views/).
 *
 * - SessionBanner        SessionBannerView.swift:59-292, placed at the top of
 *                        the left panel with padding 8/6 and a Divider below
 *                        (LeftOrchestratorView.swift:735-856). HStack spacing
 *                        8: 7pt dot in the risk colour · title caption
 *                        semibold · pills · borderless caption buttons ·
 *                        Spacer(8) · avatars (host only) · Leave / End.
 *                        Padding 10/6, risk colour @0.10 fill + @0.28 inside
 *                        stroke, r7. Risk: read-only green, a pending request
 *                        orange, an active effect purple.
 * - BannerPill           statusPill (:213-221): 9pt semibold monospaced,
 *                        padding 6/2, colour @0.14 capsule, colour text.
 *                        `icon` gives the transport label (:244-273): same
 *                        type, colour @0.16, direct = green +
 *                        point.3.connected.trianglepath.dotted.
 * - BannerButton         Button(...).buttonStyle(.borderless).font(.caption).
 *                        CALIBRATE: drawn in the theme accent (liveTheme sets
 *                        .tint and .accentColor at every hosting root).
 * - AccessRequestCard    PersonalLiveSharePanel.swift:254-325: VStack spacing
 *                        7, padding 10, quaternary @0.35 r8: name callout
 *                        semibold · email caption · "Account <id>" caption2
 *                        monospaced secondary · "Device <fingerprint>" + Copy
 *                        key (borderless, mini) · "Request expires …"
 *                        caption2 secondary · orange caption2 shield warning
 *                        · Deny (destructive) · Spacer · Read only · Read &
 *                        write (.borderedProminent) (:538-565).
 */

/** SwiftUI dark system colours used by SessionBannerView. */
export const LIVE_SHARE_COLORS = {
  green: "var(--tu-success)",
  orange: "var(--tu-warning)",
  purple: "#bf5af2",
  /** The app hard-codes SwiftUI .blue here; the docs use the theme accent. */
  blue: "var(--tu-accent)",
} as const;

export function SessionBanner({
  title,
  tone,
  live = true,
  children,
  style,
}: {
  title: string;
  /** Risk colour (CSS). */
  tone: string;
  live?: boolean;
  /** Pills, buttons and the trailing items, in order; put <BannerSpacer/> before the trailing ones. */
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.banner} style={{ ["--ls-tone" as string]: tone, ...style }}>
      <span className={styles.dot} data-live={live ? "true" : undefined} />
      <span className={styles.bannerTitle}>{title}</span>
      {children}
    </div>
  );
}

export function BannerSpacer() {
  return <span className={styles.spacer} />;
}

export function BannerPill({ label, color, icon }: { label: string; color: string; icon?: GlyphName }) {
  return (
    <span className={styles.pill} data-transport={icon ? "true" : undefined} style={{ ["--ls-pill" as string]: color }}>
      {icon ? <Glyph name={icon} size={10} weight="semibold" /> : null}
      {label}
    </span>
  );
}

export function BannerButton({ label }: { label: string }) {
  return <span className={styles.borderless}>{label}</span>;
}

export function AccessRequestCard({
  name,
  email,
  account,
  device,
  expires,
}: {
  name: string;
  email?: string;
  account: string;
  device: string;
  expires: string;
}) {
  return (
    <div className={styles.request}>
      <span className={styles.requestName}>{name}</span>
      {email ? <span className={styles.requestEmail}>{email}</span> : null}
      <span className={styles.mono}>Account {account}</span>
      <span className={styles.deviceRow}>
        <span className={`${styles.mono} ${styles.truncate}`}>Device {device}</span>
        <span className={styles.spacer} style={{ minWidth: 4 }} />
        <span className={styles.copyKey}>Copy key</span>
      </span>
      <span className={styles.secondary}>Request expires {expires}</span>
      <span className={styles.warning}>
        <Glyph name="exclamationmark.shield.fill" size={11} style={{ ["--tu-glyph-knockout" as string]: "var(--tu-panel)" }} />
        <span>
          Read &amp; write lets this guest message agents. This Mac’s current agent and tool configuration still
          governs execution, including Admin mode.
        </span>
      </span>
      <span className={styles.actions}>
        <span className={styles.push} data-role="destructive">
          Deny
        </span>
        <span className={styles.spacer} />
        <span className={styles.push}>Read only</span>
        <span className={styles.push} data-prominent="true">
          Read &amp; write
        </span>
      </span>
    </div>
  );
}
