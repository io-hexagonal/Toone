import { AgentRow, AgentSectionHeader, AgentsDestination } from "../AgentRow";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import { NavRail, RAIL_ITEMS, type NavRailItem } from "../NavRail";
import railStyles from "../NavRail.module.css";
import { RailHoverCard } from "../RailHoverCard";
import type { SceneDefinition } from "../scene";

/**
 * The navigation rail with the Routines menu open: under the Routines button
 * the two options, Routines (`list.bullet.rectangle`) and Explore
 * (`safari`). The pointer is on Explore (accent icon on an accent .10 fill,
 * scale 1.08) and its card reads "Explore" / "Routines and bundles reviewed
 * by Toone."
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/LeftOrchestratorView.swift:2140-2187 (RoutineRailOption:
 *   titles, details, symbols; Direct shows both options), :2905-2926
 *   (routineMenu: the options in a VStack(spacing 0) under the Routines
 *   button), :2928-3021 (routineOptionButton: 28², 11pt semibold;
 *   hover accent + accent .10, scale 1.08), :2190-2232
 *   (RoutineRailOptionHoverCard, width 250), :2704-2722 (placement: left
 *   edge at rail + 8, centred on the option), :2236-2297 (title, surface).
 * - Behind the card: the Agents destination as in agents-roster.
 *
 * Code vs plan: as planned. Option hover cards only arm 300 ms after the
 * menu opens (:3046-3058); a still figure shows the settled state.
 *
 * CALIBRATE: the .regularMaterial fill of the card. Drawn at MAGNIFY × the
 * app's points.
 */

const PANEL_W = 380;
const HEIGHT = 452;
const MAGNIFY = 1.15;
// Rail geometry (NavRail.tsx): padding 8, items 32 + gap 4, divider 5;
// the option group sits at 273 (two 28pt options, no gap).
const EXPLORE_MID_Y = 315;
const CARD_H = 76;

const OPTIONS: NavRailItem = {
  id: "routineOptions",
  kind: "custom",
  node: (
    <span className={railStyles.optionGroup}>
      <span className={railStyles.option}>
        <Glyph name="list.bullet.rectangle" size={13} weight="semibold" />
      </span>
      <span className={railStyles.option} data-state="hover">
        <Glyph name="safari" size={13} weight="semibold" />
      </span>
    </span>
  ),
};

const ITEMS: NavRailItem[] = RAIL_ITEMS.flatMap((item) => (item.id === "routines" ? [item, OPTIONS] : [item]));

function RailRoutinesExplore() {
  const { research, launch } = DEMO.agents;
  return (
    <div style={{ zoom: MAGNIFY, position: "relative", width: PANEL_W, height: HEIGHT, display: "flex", overflow: "hidden" }}>
      <NavRail items={ITEMS} selected="agents" />
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
        detail="Routines and bundles reviewed by Toone."
        icon="safari"
        style={{ left: 52, top: EXPLORE_MID_Y - CARD_H / 2 }}
        title="Explore"
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "rail-routines-explore",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label:
    "The navigation rail with the Routines menu open. Two small options sit under the Routines button: Routines and Explore. The pointer is on Explore, and a card beside it reads Explore, Routines and bundles reviewed by Toone.",
  caption: "Click Routines in the rail, then Explore, to browse reviewed routines and bundles.",
  Component: RailRoutinesExplore,
};
