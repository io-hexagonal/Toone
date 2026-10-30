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
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - card: APP/Features/InAppBrowser/Views/BrowserSessionImportView.swift:19-81
 *   (VStack spacing 8, padding 8, r16 inputBackground .72 + 1pt
 *   threadCardBorder, `.tint(accent)`; icon `globe.badge.chevron.backward`
 *   18 medium accent in 24×24; title .subheadline semibold primary, one line;
 *   subtitle .caption secondary; privacy note .caption2 tertiary), copy
 *   :83-127, controls :129-218 (`.firstBrowserOpen`, one source);
 * - placement: APP/Features/InAppBrowser/Views/InAppBrowserPanel.swift:37-100
 *   (header, toolbar, card padding 8 / bottom 8, then the tab bar);
 * - chrome: BrowserChrome.tsx (toolbar InAppBrowserView.swift:102-180,
 *   tab bar BrowserTabBarView.swift:27-119).
 *
 * Code vs plan (§1, browser-login-import), the code wins:
 * - With exactly one browser source, "Import all sites from Safari" is a
 *   `.borderedProminent` button too (importMenu :202-210), so two buttons are
 *   prominent, not only "Use as needed".
 * - The card is tinted with the theme accent, not `controlTint`, so in Smoky
 *   Quartz the prominent fills are the 0.72 grey with AppKit's white label
 *   (the low-contrast case LayoutStyle.swift:342-348 describes).
 * - The URL field shows `currentURL.absoluteString` ("https://acme.com/"),
 *   not a bare "acme.com".
 * - Direct edition only: the App Store build shows no import card
 *   (EditionCapabilities .browserCookieImport).
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
