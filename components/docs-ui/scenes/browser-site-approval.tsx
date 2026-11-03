import { BrowserContent, BrowserHeader, BrowserTabBar, BrowserToolbar } from "../BrowserChrome";
import { BrowserPromptCard, PromptStrong, SmallButton } from "../BrowserPromptCard";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * Direct edition: an agent asks to reuse your Safari login for one site.
 * Nothing is read from Safari unless you approve this card.
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
        note="Nothing is copied from Safari unless you approve it. Saved passwords and browser history are never imported."
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
  label: `Toone's browser panel showing the card "An agent wants to use your Safari logins": it copies only cookies for ${DOMAIN} and its subdomains from Safari into Toone's browser. Buttons Import ${DOMAIN} from Safari and Sign in manually instead; nothing is copied from Safari unless you approve it, and saved passwords and browser history are never imported. The tab bar shows your tab and ${DEMO.browser.agentTab.agent}'s ${DEMO.browser.agentTab.pageTitle} tab.`,
  caption: "An agent can ask for one site's login. You approve each import.",
  Component: BrowserSiteApproval,
};
