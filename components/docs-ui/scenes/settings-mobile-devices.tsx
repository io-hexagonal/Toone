import { Button } from "../Button";
import { DEMO } from "../demo";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Mobile, the "Approved Devices" section: one paired iPhone with
 * its id prefix, "Last seen", the per-device trash button, and "Revoke All
 * Devices". The Cloud Relay section above it is `settings-mobile-pairing`.
 *
 * CALIBRATE: grouped Form geometry; the borderless trash (drawn in the
 * accent tint the Form sets); whether AppKit tints the destructive "Revoke
 * All Devices" title red (drawn neutral, like settings-mobile-pairing).
 */

function SettingsMobileDevices() {
  return (
    <SettingsWindow formPaddingTop={10} selected="mobile" showClose={false} sidebarOffset={338}>
      <div style={{ padding: "0 4px", fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)", marginBottom: -2 }}>
        Connect your iPhone to control Toone remotely via the cloud relay.
      </div>
      <SettingsSection
        footer="Devices that have completed the cryptographic handshake. Revoke to require re-pairing."
        header="Approved Devices"
      >
        <SettingsRow>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 auto" }}>
            <span style={{ fontWeight: 500, color: "var(--tu-label-1)" }}>{DEMO.device}</span>
            <span style={{ fontFamily: "var(--tu-font-mono)", fontSize: 10, color: "var(--tu-label-3)" }}>
              {DEMO.deviceIdPrefix}...
            </span>
            <span style={{ fontSize: 10, color: "var(--tu-label-2)" }}>Last seen: 2 minutes ago</span>
          </span>
          <Button icon="trash" iconSize={15} style={{ color: "var(--tu-accent)" }} variant="plain" />
        </SettingsRow>
        <SettingsRow>
          <PushButton fontSize={10} label="Revoke All Devices" />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-mobile-devices",
  width: 640,
  radius: 24,
  label: `Settings, Mobile page, Approved Devices section. ${DEMO.device}, id ${DEMO.deviceIdPrefix}, last seen 2 minutes ago, with a trash button to revoke it, and a Revoke All Devices button below. The footer says devices must complete the cryptographic handshake and that revoking requires re-pairing.`,
  caption: "Settings → Mobile → Approved Devices: revoke one phone, or all of them.",
  Component: SettingsMobileDevices,
};
