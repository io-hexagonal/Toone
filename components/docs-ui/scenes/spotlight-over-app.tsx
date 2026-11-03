import { DEMO } from "../demo";
import { Callout, Desktop, Miniature, SCREEN, ScreenPanel, panelFrames } from "../Miniature";
import type { SceneDefinition } from "../scene";
import { ChatPanelContent, GenericAppWindow } from "../WindowParts";

/**
 * The Spotlight layout over the work already on screen: another
 * application's document window (neutral grey placeholder lines) fills the
 * desktop and the Spotlight chat panel floats centred over it, Project
 * Explorer hidden. The panel carries the same contents as
 * spotlight-chat-panel (project strip, rail, "Research Assistant · Growth"
 * header, one exchange, composer).
 *
 * The other app is a generic shape, not a real application.
 */

const S = 640 / SCREEN.width;
const F = panelFrames("spotlight");
const DOC = { x: 230, y: 64, w: 980, h: 772 };

function SpotlightOverApp() {
  return (
    <div style={{ position: "relative" }}>
      <Miniature height={SCREEN.height} scale={S} width={SCREEN.width}>
        <Desktop>
          <GenericAppWindow rect={DOC} />
          <ScreenPanel rect={F.chat}>
            <ChatPanelContent recentThreads={false} transcriptAlign="bottom" />
          </ScreenPanel>
        </Desktop>
      </Miniature>
      <Callout pointer="down" x={(F.chat.x + F.chat.w / 2) * S} y={(F.chat.y - 10) * S}>
        Spotlight
      </Callout>
      <Callout x={(DOC.x + DOC.w / 2) * S} y={(F.chat.y + F.chat.h + 110) * S}>
        The app you are working in
      </Callout>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "spotlight-over-app",
  width: 640,
  radius: 16,
  label: `A desktop with another application's document window. Centred over it floats the Spotlight chat panel: the project strip with ${DEMO.projects[0]} active, the navigation rail and a conversation titled ${DEMO.spotlightChat.title} with ${DEMO.agents.research.name} · ${DEMO.agents.research.department}. Project Explorer is hidden.`,
  caption: "Spotlight floats one chat panel over the app you are working in. Press ⌥L to cycle to it.",
  Component: SpotlightOverApp,
};
