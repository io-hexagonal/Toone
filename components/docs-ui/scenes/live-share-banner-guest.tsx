import { DEMO } from "../demo";
import { BannerButton, BannerPill, BannerSpacer, LIVE_SHARE_COLORS, SessionBanner } from "../LiveShare";
import type { SceneDefinition } from "../scene";

/**
 * Live Share, guest side: the banner at the top of Alex Kim's left panel
 * while connected to Sam Rivera's project with read-only access, following
 * the host, over a direct peer-to-peer path.
 *
 * Calibrate: the borderless "Stop following" / "Leave" label colour (drawn
 * in the theme accent).
 * Drawn at the width of a wide left panel: in a ~380pt panel the row is
 * crowded and SwiftUI truncates the title first.
 */

const PANEL_W = 640;

function LiveShareBannerGuest() {
  const { you } = DEMO.people;
  return (
    <div style={{ width: PANEL_W }}>
      <div style={{ padding: "12px 8px 6px" }}>
        <SessionBanner title={`In ${you}'s ${DEMO.activeProject}`} tone={LIVE_SHARE_COLORS.green}>
          <BannerPill color={LIVE_SHARE_COLORS.blue} label="READ ONLY" />
          <BannerPill color={LIVE_SHARE_COLORS.green} icon="point.3.connected.trianglepath.dotted" label="DIRECT P2P" />
          <BannerPill color={LIVE_SHARE_COLORS.blue} label="FOLLOWING HOST" />
          <BannerButton label="Stop following" />
          <BannerSpacer />
          <BannerButton label="Leave" />
        </SessionBanner>
      </div>
      <div style={{ height: 1, background: "var(--tu-sep)", marginBottom: 8 }} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "live-share-banner-guest",
  width: PANEL_W,
  radius: 16,
  label: `The Live Share banner a guest sees: a green dot and "In ${DEMO.people.you}'s ${DEMO.activeProject}", then the pills READ ONLY, DIRECT P2P and FOLLOWING HOST, a Stop following button and, at the far end, Leave.`,
  caption: `A guest starts read-only: the banner names the host's project, the access level, and whether they follow the host.`,
  Component: LiveShareBannerGuest,
};
