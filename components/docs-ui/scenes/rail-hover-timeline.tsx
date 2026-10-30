import { AgentRow, AgentSectionHeader, AgentsDestination } from "../AgentRow";
import { DEMO } from "../demo";
import { NavRail } from "../NavRail";
import { RailHoverCard } from "../RailHoverCard";
import type { SceneDefinition } from "../scene";

/**
 * The navigation rail with the pointer on Timeline: the button takes the
 * hover state (accent icon on an accent .10 fill, scale 1.07) and its hover
 * card opens beside the rail, over the Agents list: "Timeline" /
 * "Set up or review the workspace Git timeline."
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/LeftOrchestratorView.swift:2603-2660 (rail order; Timeline
 *   only outside the App Store build), :3082-3191 (railButton hover),
 *   :2726-2752 (destination hover card placement: left edge at rail + 8,
 *   centred on the item), :2340-2378 (NavigationRailHoverCard), :2308-2337
 *   (railDetail "Set up or review the workspace Git timeline."),
 *   :2236-2256 (title), :2280-2297 (surface);
 * - APP/Core/Services/Window/PanelWindowService.swift:52,71 (title
 *   "Timeline", `arrow.triangle.branch`).
 * - Behind the card: the Agents destination as in agents-roster.
 *
 * Code vs plan: as planned. The card appears after the shared hover delay
 * (HoverPreviewCoordinator); a still figure shows it open.
 *
 * CALIBRATE: the .regularMaterial fill of the card. Drawn at MAGNIFY × the
 * app's points.
 */

const PANEL_W = 380;
const HEIGHT = 392;
const MAGNIFY = 1.15;
// Rail geometry (NavRail.tsx): padding 8, items 32 + gap 4, divider 5.
const TIMELINE_MID_Y = 325;
const CARD_H = 77;

function RailHoverTimeline() {
  const { research, launch } = DEMO.agents;
  return (
    <div style={{ zoom: MAGNIFY, position: "relative", width: PANEL_W, height: HEIGHT, display: "flex", overflow: "hidden" }}>
      <NavRail hovered="timeline" selected="agents" />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <AgentsDestination bottomBar={false}>
          <AgentSectionHeader title="Today" />
          <AgentRow
            agent={{
              name: research.name,
              department: research.department,
              preview: `${research.name}: ${DEMO.spotlightChat.agent}`,
              activity: "completed",
              threads: 1,
            }}
          />
          <AgentRow
            agent={{ name: launch.name, department: launch.department, preview: "You: Draft the launch week plan.", threads: 1 }}
          />
        </AgentsDestination>
      </div>
      <RailHoverCard
        detail="Set up or review the workspace Git timeline."
        icon="arrow.triangle.branch"
        style={{ left: 52, top: TIMELINE_MID_Y - CARD_H / 2 }}
        title="Timeline"
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "rail-hover-timeline",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label:
    "The left panel's navigation rail with the pointer on the Timeline button, near the bottom of the rail. A card beside it reads Timeline, Set up or review the workspace Git timeline.",
  caption: "Timeline sits in the navigation rail; hover it to see what it opens.",
  Component: RailHoverTimeline,
};
