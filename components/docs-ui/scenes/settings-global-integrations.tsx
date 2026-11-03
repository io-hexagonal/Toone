import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow, Switch } from "../SettingsForm";

/**
 * Settings → MCPs, scrolled to the bottom of the page: two rows of the
 * "Global Integrations" section, Product Hunt (on) and Figma (switched off,
 * so its name turns tertiary).
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
  caption: "Settings → MCPs → Global Integrations: every project can use these website integrations; switch one off here.",
  Component: SettingsGlobalIntegrations,
};
