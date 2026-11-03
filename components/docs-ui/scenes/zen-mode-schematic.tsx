import { Callout, Desktop, Miniature, SCREEN, ScreenPanel, panelFrames } from "../Miniature";
import type { SceneDefinition } from "../scene";
import { ChatPanelContent, ProjectPanelContent, ZenBackdrop } from "../WindowParts";

/**
 * Zen Mode on: the ambient video fills the whole screen behind the panels,
 * which stay in their usual places (here the default Full Height layout:
 * chat left, Project Explorer right). The video is a flat warm-grey still in
 * the style of zen-video-grid's "Mountain Wilds" thumbnail, not real art.
 *
 * Calibrate: real panels are glass and would show the video blurred through
 * them; drawn with the kit's frozen panel fill.
 */

const S = 640 / SCREEN.width;
const F = panelFrames("fullHeight");

function ZenModeSchematic() {
  return (
    <div style={{ position: "relative" }}>
      <Miniature height={SCREEN.height} scale={S} width={SCREEN.width}>
        <Desktop backdrop={<ZenBackdrop />}>
          <ScreenPanel rect={F.chat}>
            <ChatPanelContent />
          </ScreenPanel>
          <ScreenPanel rect={F.project!}>
            <ProjectPanelContent />
          </ScreenPanel>
        </Desktop>
      </Miniature>
      <Callout x={(SCREEN.width / 2 + 30) * S} y={250 * S}>
        Ambient video
      </Callout>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "zen-mode-schematic",
  width: 640,
  radius: 16,
  label:
    "Zen Mode on a desktop: a calm mountain landscape fills the whole screen as the ambient video, and the Toone chat panel on the left and Project Explorer on the right stay in their usual places in front of it.",
  caption: "Zen Mode puts an ambient video behind your panels; the panels stay where they are.",
  Component: ZenModeSchematic,
};
