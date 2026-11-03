import { BrowserContent, BrowserHeader, BrowserTabBar, BrowserToolbar } from "../BrowserChrome";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The browser panel while Launch Planner works in a tab of its own: you are
 * on your tab (acme.com); the agent's tab carries its name capsule and the
 * pulsing activity dot each time the agent acts on it in the background.
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
