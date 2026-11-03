import { BrowserContent, BrowserHeader, BrowserTabBar, BrowserToolbar } from "../BrowserChrome";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import styles from "./browser-login-import.module.css";

/**
 * The browser panel on its first open: the "Use your browser logins in
 * Toone" card between the toolbar and the tab bar (Safari is the only
 * supported browser found).
 *
 * CALIBRATE: the small prominent / borderless buttons (native controls) and
 * the borderless "Not now" label colour.
 */

const WIDTH = 480;

function BrowserLoginImport() {
  return (
    <div>
      <BrowserHeader />
      <BrowserToolbar url={DEMO.browser.url} />
      <div className={styles.cardWrap}>
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.icon}>
              <Glyph name="globe.badge.chevron.backward" size={20} weight="medium" />
            </span>
            <span className={styles.copy}>
              <span className={styles.title}>Use your browser logins in Toone</span>
              <span className={styles.subtitle}>
                Recommended: import only the current site when you need it. You can also explicitly import every
                cookie from one browser.
              </span>
            </span>
          </div>
          <div className={styles.controls}>
            <span className={styles.prominent}>Use as needed</span>
            <span className={styles.prominent}>Import all sites from Safari</span>
            <span className={styles.borderless}>Not now</span>
          </div>
          <span className={styles.privacy}>
            “Import all sites” copies every cookie from the selected browser into Toone’s shared WebKit store. Saved
            passwords and browser history are never imported.
          </span>
        </div>
      </div>
      <BrowserTabBar tabs={[{ title: DEMO.browser.pageTitle, active: true }]} />
      <BrowserContent height={28} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "browser-login-import",
  width: WIDTH,
  radius: 24,
  label: `Toone's browser panel open on ${DEMO.browser.url}, showing the card "Use your browser logins in Toone" with the buttons Use as needed, Import all sites from Safari and Not now, above the tab bar.`,
  caption: "The first time you open the browser, choose how Toone may reuse the logins from your own browser.",
  Component: BrowserLoginImport,
};
