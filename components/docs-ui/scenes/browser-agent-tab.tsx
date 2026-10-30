import { BrowserContent, BrowserHeader, BrowserTabBar, BrowserToolbar } from "../BrowserChrome";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The browser panel while Launch Planner works in a tab of its own: you are
 * on your tab (acme.com); the agent's tab carries its name capsule and the
 * pulsing activity dot each time the agent acts on it in the background.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - panel order: APP/Features/InAppBrowser/Views/InAppBrowserPanel.swift:37-66
 *   (header, toolbar, tab bar, web view), header :115-145;
 * - tab bar: APP/Features/InAppBrowser/Views/BrowserTabBarView.swift:27-119
 *   (agent capsule 9pt medium white on accent @0.6; pulse only when
 *   `hasActivity && !isActive`, with the tab's accent @0.08 capsule);
 * - activity: APP/Features/InAppBrowser/Models/BrowserTab.swift:70-82
 *   (signalActivity: an agent command on a background tab lights it 1.5 s);
 * - dot: APP/Features/Chat/Views/PulsingDot.swift (6pt, accent, 0.6 s,
 *   opacity 0.3 ↔ 1, glow radius 3);
 * - chrome: BrowserChrome.tsx.
 *
 * Code vs plan: the plan has the agent's tab active with the pulsing dot and
 * the URL bar on "producthunt.com/…". The dot never shows on the active tab
 * (BrowserTabBarView.swift:59), so the figure shows the one state with both
 * signals: your tab active (the URL bar follows it: acme.com), the agent's
 * tab in the background, badge + dot. There is no "agent is driving"
 * banner; the tab is the only signal, so nothing else is drawn.
 *
 * Drawn at MAGNIFY × the app's points so the 9pt agent capsule reads at the
 * guide column. Motion: the dot pulses only with
 * prefers-reduced-motion: no-preference (BrowserChrome.module.css); reduced
 * motion shows it lit.
 */

const PANEL_W = 420;
const MAGNIFY = 1.2;

function BrowserAgentTab() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <BrowserHeader />
      <BrowserToolbar url={DEMO.browser.url} />
      <BrowserTabBar
        tabs={[
          { title: DEMO.browser.pageTitle, active: true },
          { title: DEMO.browser.agentTab.pageTitle, agent: DEMO.browser.agentTab.agent, activity: true },
        ]}
      />
      <BrowserContent height={36} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "browser-agent-tab",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `Toone's browser panel on ${DEMO.browser.url}. The tab bar shows your tab, ${DEMO.browser.pageTitle}, active, and a second tab, ${DEMO.browser.agentTab.pageTitle}, marked with the agent name ${DEMO.browser.agentTab.agent} and a pulsing dot while the agent works in it.`,
  caption: "A tab an agent works in carries its name, and a dot pulses while it acts there in the background.",
  Component: BrowserAgentTab,
};
