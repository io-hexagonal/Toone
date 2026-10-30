import { DEMO } from "../demo";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { SettingsRow, SettingsSection, SettingsWindow } from "../SettingsForm";

/**
 * Settings → Account while you are signed in: the "Account" section with
 * your name and email, the Sign out button, and the footer. This is where
 * the app shows which Toone account it is using.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Features/Settings/Views/SettingsView.swift:12, :38, :64 (destination
 *   "Account", icon person.crop.circle), :290 (AccountSettingsView);
 *   :580-678 (AccountSettingsView: Section header "Account"; signed in =
 *   HStack [VStack(leading, spacing 2) name (or the email when the name is
 *   empty) .fontWeight(.medium); email Typography.caption .secondary] ·
 *   Spacer · Button(role: .destructive) "Sign out"; footer "Signing out
 *   returns you to the login screen.").
 * - Core/Services/AccountDeletion/AccountDeletionClient.swift:26-33: the
 *   "Danger Zone" section (Delete Account…) is offered only in the Mac App
 *   Store edition, so the Direct build drawn here has the one section.
 * - P17 SettingsForm (sidebar, grouped Form): see SettingsForm.tsx.
 *
 * Code vs spec: none. The guide's "an account" is a Toone account; this page
 * is the only place the desktop app names the signed-in identity.
 *
 * CALIBRATE: grouped Form geometry and the push button; whether AppKit tints
 * the destructive "Sign out" title red (drawn neutral, like the destructive
 * buttons in settings-mobile-devices / settings-mobile-pairing). Drawn at
 * MAGNIFY × the app's points so the caption email stays legible.
 */

const WIDTH = 580;
const MAGNIFY = 1.1;

function SettingsAccountSignedIn() {
  return (
    <div style={{ zoom: MAGNIFY, width: WIDTH }}>
      <SettingsWindow formPaddingTop={16} minHeight={129} selected="account">
        <SettingsSection footer="Signing out returns you to the login screen." header="Account">
          <SettingsRow>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 auto", minWidth: 0 }}>
              <span style={{ fontWeight: 500, color: "var(--tu-label-1)" }}>{DEMO.people.you}</span>
              <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>
                {DEMO.account.email}
              </span>
            </span>
            <PushButton label="Sign out" />
          </SettingsRow>
        </SettingsSection>
      </SettingsWindow>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "settings-account-signed-in",
  width: Math.round(WIDTH * MAGNIFY),
  radius: 24,
  label: `Settings, Account page, signed in. The Account section shows ${DEMO.people.you} with the email ${DEMO.account.email} and a Sign out button. The footer reads: Signing out returns you to the login screen.`,
  caption: "Settings → Account shows the Toone account you're signed in with.",
  Component: SettingsAccountSignedIn,
};
