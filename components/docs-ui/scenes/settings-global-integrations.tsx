import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → MCPs, scrolled to the bottom of the page: two rows of the
 * "Global Integrations" section, Product Hunt (on) and Figma (switched off,
 * so its name turns tertiary).
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/MCPIntegrationsSettingsView.swift:56-72 (Section
 *   "Global Integrations": scopeBanner(globe, …), then one integrationRow per
 *   site map, or "No global site maps yet."); :128-170 (integrationRow: logo
 *   AsyncImage or the `network` symbol .secondary in an 18×18 r4 frame;
 *   name, .tertiary when disabled; "<domain> · N page(s)" .caption
 *   .tertiary; labels-hidden switch = !isDisabled).
 * - SettingsView.swift:271 (the MCPs page is hidden in the App Store
 *   edition).
 *
 * Code vs plan: the crop deliberately starts just BELOW the section's scope
 * banner. Its copy still reads "Global site maps — browser integrations
 * every organization can use. Promote maps here from an org's Integrations
 * section." (MCPIntegrationsSettingsView.swift:59), which is stale: since
 * 2026-09-30 site maps are one per-user collection shared by every project,
 * and there is no promote action (plan "Verification results" item 7; audit
 * Part 3 item 7). The section title is named in the caption instead. Redraw
 * with the banner once the app copy is fixed. Logos are drawn as the
 * `network` fallback symbol (no third-party artwork). Domains and page
 * counts are demo data.
 *
 * CALIBRATE: switches and grouped Form geometry.
 */

function IntegrationRow({ name, domain, pages, on }: { name: string; domain: string; pages: number; on: boolean }) {
  return (
    <SettingsRow>
      <span style={{ display: "inline-flex", justifyContent: "center", width: 18, flex: "none", color: "var(--tu-label-2)" }}>
        <Glyph name="network" size={15} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ color: on ? "var(--tu-label-1)" : "var(--tu-label-3)" }}>{name}</span>
        <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-3)" }}>
          {domain} · {pages} page{pages === 1 ? "" : "s"}
        </span>
      </span>
      <Switch on={on} />
    </SettingsRow>
  );
}

function SettingsGlobalIntegrations() {
  return (
    <SettingsWindow formPaddingTop={0} selected="mcps" showClose={false} sidebarOffset={392}>
      <SettingsSection cutTop>
        {/* the last few points of the banner row the crop starts below */}
        <SettingsRow style={{ minHeight: 0, height: 6, padding: 0 }}>{null}</SettingsRow>
        <IntegrationRow domain="producthunt.com" name="Product Hunt" on pages={4} />
        <IntegrationRow domain="figma.com" name="Figma" on={false} pages={2} />
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-global-integrations",
  width: 640,
  radius: 24,
  label:
    "Settings, MCPs page, the Global Integrations list at the bottom of the page. Product Hunt, producthunt.com, 4 pages, is switched on. Figma, figma.com, 2 pages, is switched off and its name is dimmed.",
  caption: "Settings → MCPs → Global Integrations: every project shares these site maps; switch one off here.",
  Component: SettingsGlobalIntegrations,
};
