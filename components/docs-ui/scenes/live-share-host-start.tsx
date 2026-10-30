import { Glyph } from "../glyphs";
import { NativeSegmented } from "../NativeSegmented";
import { PopUpButton, PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { DEMO } from "../demo";

/**
 * Live Share, host side before sharing: the Personal tab's "Share from this
 * Mac" section with the Organization picker on the active project and the
 * prominent "Start Personal Live Share". The crop ends at the Divider above
 * "Join a Personal Live Share".
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/Features/Business/Views/):
 * - TeamHoverButton.swift:130-178 (LiveShareDestinationView: segmented
 *   Personal / Business picker, labels hidden, padding 12, then Divider and
 *   PersonalLiveSharePanel); :218-224 (a tab title gains " (N)" only with
 *   pending requests).
 * - PersonalLiveSharePanel.swift:24-68 (ScrollView, VStack spacing 14,
 *   padding 14; the sign-in row only when signed out; host section, Divider,
 *   join section); :102-140 (hostSection: VStack leading spacing 10; Label
 *   "Share from this Mac" macbook.and.iphone .headline; caption .secondary;
 *   with no seat yet: Picker "Organization" (menu) over the local org
 *   candidates, then Button Label("Start Personal Live Share",
 *   dot.radiowaves.left.and.right) .borderedProminent).
 * - BusinessRosterStore.swift:35-45 (candidates are local organizations,
 *   named like the workspace).
 *
 * Code vs plan: none. Signed in, so the "Sign in to start or join" row is
 * absent and Start is enabled.
 *
 * Calibrate: the segmented control, the menu pop-up and the prominent push
 * button (fill, height). Drawn at MAGNIFY × the app's points, like
 * live-share-access-requests.
 */

const PANEL_W = 360;
const MAGNIFY = 1.15;

function LiveShareHostStart() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <div style={{ padding: 12 }}>
        <NativeSegmented fill segments={["Personal", "Business"]} selected={0} />
      </div>
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "14px 14px 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "16px", fontWeight: 700, color: "var(--tu-text-1)" }}>
            <Glyph name="macbook.and.iphone" size={15} />
            Share from this Mac
          </span>
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>
            Share an exact local organization with signed-in teammates. Every person and device still requires your approval.
          </span>
          <PopUpButton label="Organization" value={DEMO.activeProject} />
          <PushButton icon="dot.radiowaves.left.and.right" label="Start Personal Live Share" prominent />
        </div>
        <div style={{ height: 1, background: "var(--tu-sep)" }} />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "live-share-host-start",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `The Live Share panel on its Personal tab. Under Share from this Mac, a note says you share an exact local organization with signed-in teammates and every person and device still needs your approval. The Organization picker is set to ${DEMO.activeProject}, above a Start Personal Live Share button.`,
  caption: "Live Share → Personal: pick the project and start sharing; every guest still needs your approval.",
  Component: LiveShareHostStart,
};
