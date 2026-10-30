import type { ReactNode } from "react";
import styles from "./BrowserChrome.module.css";
import { Glyph } from "./glyphs";
import { PanelHeader } from "./PanelHeader";

/**
 * The in-app browser panel's chrome, shared by the browser figures.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - BrowserHeader: APP/Features/InAppBrowser/Views/InAppBrowserPanel.swift:115-145
 *   (PanelHeader "Browser" + `globe`; `chevron.up` and `xmark` 10 bold
 *   secondary icon buttons). The App Store edition adds a privacy button.
 * - BrowserToolbar: APP/Features/InAppBrowser/Views/InAppBrowserView.swift:102-180
 *   (HStack spacing 8, padding 16 / bottom 8; back `chevron.left` 13
 *   semibold, disabled without history; URL bar HStack spacing 4, `globe` in
 *   16×16 secondary, 13pt text, padding 8/4, min-h 32, inputBackground .88,
 *   r12, 0.5pt inputBorder; "Open" `.bordered` `.controlSize(.small)` with
 *   `arrow.up.forward.square`). The URL field shows `currentURL.absoluteString`.
 * - BrowserTabBar: APP/Features/InAppBrowser/Views/BrowserTabBarView.swift:27-119
 *   (min-h 32, innerBackground @ innerBackgroundOpacity×0.35; tabs HStack
 *   spacing 2, padding 8; tab HStack spacing 4, padding 8/4, active capsule
 *   white .12; agent name capsule 9 medium white on accent .6; `globe` 10 in
 *   14×14; title 11 (max 120); active `xmark` 8 bold in 14×14; `plus` 13 medium).
 *
 * CALIBRATE: the small bordered "Open" button (native control).
 */

export function BrowserHeader() {
  return (
    <PanelHeader
      icon="globe"
      title="Browser"
      trailing={
        <>
          <span className={styles.iconButton}>
            <Glyph name="chevron.up" size={11} weight="bold" />
          </span>
          <span className={styles.iconButton}>
            <Glyph name="xmark" size={11} weight="bold" />
          </span>
        </>
      }
    />
  );
}

export function BrowserToolbar({ url, canGoBack = false }: { url: string; canGoBack?: boolean }) {
  return (
    <div className={styles.toolbar}>
      <span className={styles.iconButton} data-disabled={canGoBack ? undefined : "true"}>
        <Glyph name="chevron.left" size={14} weight="semibold" />
      </span>
      <div className={styles.urlBar}>
        <span className={styles.urlIcon}>
          <Glyph name="globe" size={14} />
        </span>
        <span className={styles.urlText}>{url}</span>
      </div>
      <span className={styles.openButton}>
        <Glyph name="arrow.up.forward.square" size={12} />
        Open
      </span>
    </div>
  );
}

export type BrowserTab = {
  title: string;
  active?: boolean;
  /** Agent-owned tab: the agent's name capsule. */
  agent?: string;
  /** Background activity on an inactive tab: pulsing dot (PulsingDot.swift). */
  activity?: boolean;
};

export function BrowserTabBar({ tabs }: { tabs: BrowserTab[] }) {
  return (
    <div className={styles.tabBar}>
      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const pulse = tab.activity && !tab.active;
          return (
            <span
              className={styles.tab}
              data-active={tab.active ? "true" : undefined}
              data-pulse={pulse ? "true" : undefined}
              key={tab.title}
            >
              {tab.agent ? <span className={styles.agentBadge}>{tab.agent}</span> : null}
              {pulse ? <span className={styles.pulseDot} /> : null}
              <span className={styles.favicon}>
                <Glyph name="globe" size={11} />
              </span>
              <span className={styles.tabTitle}>{tab.title}</span>
              {tab.active ? (
                <span className={styles.tabClose}>
                  <Glyph name="xmark" size={9} weight="bold" />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      <span className={styles.iconButton} style={{ marginRight: 8 }}>
        <Glyph name="plus" size={14} weight="medium" />
      </span>
    </div>
  );
}

/** The web view area under the tab bar (innerBackgroundColor while blank). */
export function BrowserContent({ height, children }: { height: number; children?: ReactNode }) {
  return (
    <div className={styles.content} style={{ height }}>
      {children}
    </div>
  );
}
