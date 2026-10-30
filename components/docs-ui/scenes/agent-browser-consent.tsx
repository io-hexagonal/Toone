import { BrowserContent, BrowserHeader, BrowserTabBar, BrowserToolbar } from "../BrowserChrome";
import { BrowserPromptCard, SmallButton } from "../BrowserPromptCard";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * App Store edition: the first time an agent tries to use the browser, the
 * command is refused and the Browser panel asks once per AI provider.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/Features/InAppBrowser/):
 * - card: Views/AgentBrowserPrivacyViews.swift:12-90 (copy :12-23;
 *   `hand.raised.fill` 18 medium accent in 24×24; title .subheadline
 *   semibold; "<agent> asked to use the browser. " + explanation, .caption
 *   secondary, never truncated (`fixedSize`); "Allow" .borderedProminent /
 *   "Not now" .borderless, small; the isolation note .caption2 tertiary);
 * - surface + placement: BrowserPromptCard.tsx; Views/InAppBrowserPanel.swift:102-113
 *   (only when `edition == .appStore` and a request is pending);
 * - header privacy button (`hand.raised`): InAppBrowserPanel.swift:115-122;
 * - rule: Models/AgentBrowserPrivacy.swift:1-19, 64-110 (Store only: a
 *   page command needs a per-provider grant; refused before any tab exists).
 *
 * Code vs plan (coverage audit C5), the code wins:
 * - "OpenAI Codex", not "Claude": the card exists only in the App Store
 *   build, whose edition ceiling has no Claude provider
 *   (Core/Distribution/AppEdition.swift:84-97; consentProviders,
 *   AgentBrowserPrivacy.swift:123-125), and the provider's display name is
 *   "OpenAI Codex" (Core/Services/AIService/Models/AIProvider.swift:29-37).
 * - The explanation is shown in full (`fixedSize(horizontal: false,
 *   vertical: true)`), not cut to two lines.
 * - Direct builds never show this card: agents there need no grant.
 * The panel behind it stays on your own tab (the refused command opened
 * nothing).
 *
 * Drawn at MAGNIFY × the app's points so the 10pt copy reads at the guide
 * column.
 */

const PANEL_W = 440;
const MAGNIFY = 1.15;
const PROVIDER = "OpenAI Codex";

function AgentBrowserConsent() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <BrowserHeader appStore />
      <BrowserToolbar url={DEMO.browser.url} />
      <BrowserPromptCard
        controls={
          <>
            <SmallButton kind="prominent" label="Allow" />
            <SmallButton kind="borderless" label="Not now" />
          </>
        }
        copy={`${DEMO.agents.launch.name} asked to use the browser. This permission applies to ${PROVIDER} agents in all your Toone workspaces. They can open pages in their own browser tabs, read and extract page content, run scripts, click, type, upload files from their selected project folder, and take screenshots. Whatever those pages show — including content from sites you sign in to in an agent tab — may be sent to ${PROVIDER} to complete the task.`}
        icon={<Glyph name="hand.raised.fill" size={20} />}
        note="Agent tabs keep their own website data, separate from your tabs. Toone never copies your cookies into them. You can turn this off or clear agent website data at any time from the hand button in the Browser header."
        title={`Allow agents to browse with ${PROVIDER}?`}
      />
      <BrowserTabBar tabs={[{ title: DEMO.browser.pageTitle, active: true }]} />
      <BrowserContent height={24} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "agent-browser-consent",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `Toone's browser panel (App Store edition) showing the card "Allow agents to browse with ${PROVIDER}?": ${DEMO.agents.launch.name} asked to use the browser, what agents can do with it, Allow and Not now buttons, and a note that agent tabs keep their own website data, separate from your tabs.`,
  caption: "In the App Store edition, agents browse only after you allow it, in tabs with their own website data.",
  Component: AgentBrowserConsent,
};
