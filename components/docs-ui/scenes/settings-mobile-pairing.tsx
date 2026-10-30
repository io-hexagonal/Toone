import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Mobile while the cloud relay waits for the phone: the orange
 * "Waiting for mobile" label, the six code cells, Copy Code / Cancel. The
 * crop ends at the Cloud Relay footer: the "Approved Devices" section below
 * it is its own figure, settings-mobile-devices (placed where the guide
 * talks about revoking), so the two do not repeat. The sidebar band is
 * scrolled (a window shorter than its list) so the Mobile row stays in
 * view.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:1855-1887 (the page: only
 *   "Cloud Relay" and "Approved Devices", with their footers); :1920-1960
 *   (.waitingForMobile: VStack spacing 12; Label "Waiting for mobile"
 *   icloud.and.arrow.down in orange; code cells 28pt bold monospaced, frame
 *   36×44, accent .1 fill, r6, padding h2; Copy Code with doc.on.doc and
 *   Cancel, both .bordered .small).
 *
 * Code vs plan: matches the plan. As verified (plan "Verification results"
 * item 5) the page has no local-network pairing on main: cloud relay only.
 *
 * CALIBRATE: grouped Form geometry; the small bordered buttons.
 */

function CodeCells({ code }: { code: string }) {
  return (
    <div style={{ display: "flex" }}>
      {code.split("").map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 44,
            margin: "0 2px",
            borderRadius: 6,
            background: "color-mix(in srgb, var(--tu-accent) 10%, transparent)",
            fontFamily: "var(--tu-font-mono)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--tu-text-1)",
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

function SettingsMobilePairing() {
  return (
    <SettingsWindow selected="mobile" sidebarOffset={250}>
      <SettingsSection
        footer="Connect your iPhone to control Toone remotely via the cloud relay."
        header="Cloud Relay"
      >
        <SettingsRow style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, padding: "10px 10px 12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--tu-warning)" }}>
            <Glyph name="icloud.and.arrow.down" size={15} />
            Waiting for mobile
          </span>
          <CodeCells code={DEMO.pairingCode} />
          <span style={{ display: "inline-flex", gap: 8 }}>
            <PushButton icon="doc.on.doc" label="Copy Code" small />
            <PushButton label="Cancel" small />
          </span>
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-mobile-pairing",
  width: 640,
  radius: 24,
  label: `Settings, Mobile page. Cloud Relay shows Waiting for mobile in orange, the pairing code ${DEMO.pairingCode.split("").join(" ")} in six large cells, and Copy Code and Cancel buttons. The footer says to connect your iPhone to control Toone remotely via the cloud relay.`,
  caption: "Settings → Mobile → Cloud Relay: enter this code on your iPhone.",
  Component: SettingsMobilePairing,
};
