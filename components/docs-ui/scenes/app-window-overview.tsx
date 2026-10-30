import { DEMO } from "../demo";
import { Callout, Desktop, Miniature, SCREEN, ScreenPanel, panelFrames } from "../Miniature";
import type { SceneDefinition } from "../scene";
import { ChatPanelContent, ProjectPanelContent, RoutinesPanelContent } from "../WindowParts";

/**
 * The whole Toone workspace on one screen, Full Height layout, for a
 * newcomer: the chat panel on the left (project strip, navigation rail,
 * a conversation with Research Assistant), the Routines panel in the middle
 * (Run #3 of the research-brief routine, its graph lit) and Project Explorer
 * on the right (the brief the run just wrote, marked fresh). Five short
 * callouts name the parts; the UI underneath is the real kit at real
 * points, scaled to 640 / 1440.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - geometry: UI/Windows/FloatingPanel.swift:31-120 (chat 28% and project
 *   24% of the width, full height, padding 8), :296-326 (Routines =
 *   `.routineCreator`, the middle area between them with 8pt gaps).
 * - panel contents: WindowParts.tsx (header comment lists every source):
 *   rail LeftOrchestratorView.swift:2517-2780, header :1364-1444, composer
 *   ChatPanelView.swift:2421-2596, Routines RoutineCreatorPanelView.swift
 *   :178-191, right panel RightProjectPanelView.swift:160-200.
 *
 * Code vs plan:
 * - The audit draws two panels (chat + Project Explorer). The overview hub
 *   also names routines and the graph, and the Routines panel opens in the
 *   middle of the same screen (FloatingPanel `.routineCreator`), so it is
 *   drawn there; with no middle panel open the centre shows the desktop.
 * - The chat's title is the thread's generated title ("Compare pricing
 *   pages"), not "Research Assistant" (see spotlight-chat-panel).
 * - Screen = 1440 × 900 (menu bar ignored), as panel-layouts.
 *
 * Calibrate: the frozen panel fill over a real grey desktop; the bordered
 * toolbar buttons (native); the graph's zoom (drawn framed on step 2 and its
 * sub-routine, as Focus selection would, not fit-to-view).
 */

const S = 640 / SCREEN.width;
const F = panelFrames("fullHeight");
const middle = F.middle!;
const project = F.project!;

function AppWindowOverview() {
  return (
    <div style={{ position: "relative" }}>
      <Miniature height={SCREEN.height} scale={S} width={SCREEN.width}>
        <Desktop>
          <ScreenPanel rect={F.chat}>
            <ChatPanelContent />
          </ScreenPanel>
          <ScreenPanel rect={middle}>
            <RoutinesPanelContent width={middle.w} />
          </ScreenPanel>
          <ScreenPanel rect={project}>
            <ProjectPanelContent />
          </ScreenPanel>
        </Desktop>
      </Miniature>
      <Callout pointer="up" x={(F.chat.x + 352) * S} y={54 * S}>
        Project strip
      </Callout>
      <Callout pointer="left" x={(F.chat.x + 46) * S} y={560 * S}>
        Navigation rail
      </Callout>
      <Callout pointer="up" x={(F.chat.x + 240) * S} y={262 * S}>
        Chat
      </Callout>
      <Callout pointer="up" x={(middle.x + 285 + (middle.w - 285) / 2) * S} y={612 * S}>
        Routines and graph
      </Callout>
      <Callout pointer="up" x={(project.x + project.w / 2) * S} y={612 * S}>
        Project Explorer
      </Callout>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "app-window-overview",
  width: 640,
  radius: 16,
  label: `The whole Toone workspace on a desktop, in the Full Height layout. Left: the chat panel, with the project strip on top (${DEMO.projects[0]} active), the navigation rail down its left edge and a conversation with ${DEMO.agents.research.name}. Middle: the Routines panel, with ${DEMO.routine.name} running and its graph. Right: Project Explorer showing the ${DEMO.activeProject} folder, where the new brief is marked. Labels name the project strip, navigation rail, chat, routines and graph, and Project Explorer.`,
  caption: "One workspace: chat on the left, a working panel such as Routines in the middle, and Project Explorer on the right.",
  Component: AppWindowOverview,
};
