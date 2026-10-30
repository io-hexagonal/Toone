import { BrowserContent, BrowserHeader, BrowserTabBar, BrowserToolbar } from "../BrowserChrome";
import { BrowserPromptCard, PromptStrong, SmallButton } from "../BrowserPromptCard";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * Direct edition: an agent asks to reuse your Safari login for one site.
 * Nothing is read from Safari unless you approve this card.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - card: APP/Features/InAppBrowser/Views/BrowserSessionImportView.swift:409-545
 *   (title "An agent wants to use your <browser> logins"; `.domain` scope
 *   line with the bold domain; "Import <domain> from <browser>"
 *   .borderedProminent + "Sign in manually instead" .bordered, small; note =
 *   the source's permissionNote + " Saved passwords and browser history are
 *   never imported.");
 * - Safari's permission note: APP/Core/Services/BrowserSessionImport/BrowserImportTypes.swift:31-38;
 * - flow: BrowserSessionImportCoordinator.swift:286-346 (requestAgentImport:
 *   the only entry for agent-requested imports, from the
 *   browser_import_cookies tool; it waits for this decision; the cookies go
 *   into WKWebsiteDataStore.default(), :143);
 * - surface + placement: BrowserPromptCard.tsx;
 *   APP/Features/InAppBrowser/Views/InAppBrowserPanel.swift:73-82 (the
 *   approval takes priority over the other import cards; Direct only:
 *   `.browserCookieImport` is not in the App Store ceiling);
 * - tab bar with the agent's tab: BrowserChrome.tsx, as in browser-agent-tab.
 *
 * Code vs plan (coverage audit C6):
 * - The icon is Safari's own application icon (BrowserSourceAppIcon, 24pt).
 *   It is drawn as the app's own fallback, the `safari` symbol in
 *   textSecondary (:367-379), so no third-party icon art (or its blue)
 *   appears in the figure.
 * - The caption is the full note: Safari's Full Disk Access sentence comes
 *   first.
 */

const PANEL_W = 440;
const MAGNIFY = 1.15;
const DOMAIN = DEMO.setup.loginDomain;

function BrowserSiteApproval() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <BrowserHeader />
      <BrowserToolbar url={DEMO.browser.url} />
      <BrowserPromptCard
        controls={
          <>
            <SmallButton kind="prominent" label={`Import ${DOMAIN} from Safari`} />
            <SmallButton kind="bordered" label="Sign in manually instead" />
          </>
        }
        copy={
          <>
            Copies only cookies for <PromptStrong>{DOMAIN}</PromptStrong> and its subdomains from Safari into Toone’s
            browser.
          </>
        }
        icon={<Glyph color="var(--tu-text-2)" name="safari" size={24} />}
        note="macOS protects Safari’s cookies. Toone needs Full Disk Access, granted in System Settings. Saved passwords and browser history are never imported."
        title="An agent wants to use your Safari logins"
      />
      <BrowserTabBar
        tabs={[
          { title: DEMO.browser.pageTitle, active: true },
          { title: DEMO.browser.agentTab.pageTitle, agent: DEMO.browser.agentTab.agent },
        ]}
      />
      <BrowserContent height={24} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "browser-site-approval",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `Toone's browser panel showing the card "An agent wants to use your Safari logins": it copies only cookies for ${DOMAIN} and its subdomains from Safari into Toone's browser. Buttons Import ${DOMAIN} from Safari and Sign in manually instead; saved passwords and browser history are never imported. The tab bar shows your tab and ${DEMO.browser.agentTab.agent}'s ${DEMO.browser.agentTab.pageTitle} tab.`,
  caption: "An agent can ask for one site's login. Nothing is copied from Safari unless you approve it.",
  Component: BrowserSiteApproval,
};
