import { DEMO } from "../demo";
import { AccessRequestCard } from "../LiveShare";
import type { SceneDefinition } from "../scene";
import styles from "../LiveShare.module.css";

/**
 * Live Share, host side: Sam Rivera's Personal Live Share panel with one
 * pending access request from Alex Kim. The host decides the access level:
 * Deny, Read only, or Read & write.
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/Features/Business/Views/):
 * - PersonalLiveSharePanel.swift:24-68 (ScrollView, VStack spacing 14,
 *   padding 14), :102-160 (host section VStack spacing 10), :251-325
 *   ("ACCESS REQUESTS" caption2 semibold secondary + the request card),
 *   :538-565 (Deny destructive · Spacer · Read only · Read & write
 *   .borderedProminent; ViewThatFits stacks them when narrow), :567-572
 *   (device fingerprint = first 12 + "…" + last 8 characters of the key).
 * - TeamHoverButton.swift:130-178 (Live Share destination: Personal /
 *   Business segmented picker above this panel).
 *
 * Code vs plan:
 * - The card also shows the guest's email, account id, device fingerprint,
 *   expiry and the orange Read & write warning; all are in the code. The
 *   email uses the reserved example.com domain; the ids are made up.
 * - The expiry is an absolute date (.abbreviated date, .standard time).
 *
 * Calibrate: the three native push buttons (bezel, height, destructive red
 * title, prominent fill), the card's quaternary @0.35 fill, Copy key (mini).
 * Drawn at MAGNIFY × the app's points.
 */

const PANEL_W = 360;
const MAGNIFY = 1.15;

function LiveShareAccessRequests() {
  const ls = DEMO.liveShare;
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <span className={styles.secondary} style={{ fontWeight: 600 }}>
        ACCESS REQUESTS
      </span>
      <AccessRequestCard
        account={ls.guestAccount}
        device={ls.guestDevice}
        email={ls.guestEmail}
        expires={ls.requestExpires}
        name={DEMO.people.guest}
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "live-share-access-requests",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `The host's Live Share panel under Access requests: ${DEMO.people.guest} asks to join, with an email, account id, device fingerprint and expiry time, an orange note that Read & write lets the guest message agents, and three buttons: Deny, Read only, and Read & write.`,
  caption: "Each guest waits for your decision; Read only lets them watch, Read & write lets them message agents.",
  Component: LiveShareAccessRequests,
};
