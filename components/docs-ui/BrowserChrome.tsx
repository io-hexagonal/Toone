import type { ReactNode } from "react";
import styles from "./BrowserChrome.module.css";
import { Glyph } from "./glyphs";
import { PanelHeader } from "./PanelHeader";

/**
 * The in-app browser panel's chrome, shared by the browser figures.
 *
 * CALIBRATE: the small bordered "Open" button (native control).
 */

/**
 * `appStore`: the App Store edition's browser privacy button (`hand.raised`
 * 10 bold secondary, before the collapse button).
 */
export function BrowserHeader({ appStore = false }: { appStore?: boolean } = {}) {
  return (
    <PanelHeader
      icon="globe"
      title="Browser"
      trailing={
        <>
          {appStore ? (
            <span className={styles.iconButton}>
              <Glyph name="hand.raised" size={11} weight="bold" />
            </span>
          ) : null}
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
  /** Background activity on an inactive tab: pulsing dot. */
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

/** The web view area under the tab bar (inner fill while blank). */
export function BrowserContent({ height, children }: { height: number; children?: ReactNode }) {
  return (
    <div className={styles.content} style={{ height }}>
      {children}
    </div>
  );
}
