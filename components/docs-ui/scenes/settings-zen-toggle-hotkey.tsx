import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Zen Mode, scrolled to the bottom of the page: the end of the
 * Ambient Video section (its footer), then the "Hotkey" section with
 * "Toggle Zen Mode ⌥Z" and the footer "… ESC also exits.".
 *
 * CALIBRATE: grouped Form geometry and the bordered push button.
 */

function SettingsZenToggleHotkey() {
  return (
    <SettingsWindow formPaddingTop={12} selected="zenMode" showClose={false} sidebarOffset={262}>
      <div style={{ padding: "0 4px", fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)", marginBottom: -2 }}>
        The video displayed behind your panels when Zen Mode is active.
      </div>
      <SettingsSection
        footer="Press this shortcut to activate or deactivate Zen Mode. ESC also exits."
        header="Hotkey"
      >
        <SettingsRow label="Toggle Zen Mode">
          <PushButton label="⌥Z" style={{ minWidth: 124 }} />
        </SettingsRow>
      </SettingsSection>
    </SettingsWindow>
  );
}

export const scene: SceneDefinition = {
  id: "settings-zen-toggle-hotkey",
  width: 640,
  radius: 24,
  label:
    "Settings, Zen Mode page, Hotkey section at the bottom of the page: Toggle Zen Mode with the shortcut Option Z. The footer reads: Press this shortcut to activate or deactivate Zen Mode. ESC also exits.",
  caption: "Settings → Zen Mode → Hotkey: ⌥Z turns Zen mode on and off; Esc also leaves it.",
  Component: SettingsZenToggleHotkey,
};
