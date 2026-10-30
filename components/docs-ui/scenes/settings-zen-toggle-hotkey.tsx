import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Zen Mode, scrolled to the bottom of the page: the end of the
 * Ambient Video section (its footer), then the "Hotkey" section with
 * "Toggle Zen Mode ⌥Z" and the footer "… ESC also exits.".
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/ZenMode/Views/ZenModeSettingsView.swift:21-27 (first Section:
 *   Button Label("Toggle Zen Mode", sparkles.tv)); :50-54 (Ambient Video
 *   footer); :57-68 (Hotkey section: HStack Text · Spacer ·
 *   HotkeyRecorderButton; footer copy).
 * - Features/Settings/Views/HotkeyRecorderButton.swift:19-24 (.bordered,
 *   title frame minWidth 100); Core/Models/HotkeyBinding.swift:73-77 (default
 *   ⌥Z).
 *
 * Code vs plan: the plan pairs the "Toggle Zen Mode" button row with the
 * Hotkey section, but the page puts the whole Ambient Video grid (six
 * categories of cards) between them, so no single crop holds both. This
 * figure shows the Hotkey section, which carries the shortcut and the "ESC
 * also exits" copy the guide paragraph describes; the button stays at the
 * top of the page above `zen-video-grid`. The sidebar band is a crop of a
 * window shorter than its list, scrolled so "Zen Mode" stays in view.
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
