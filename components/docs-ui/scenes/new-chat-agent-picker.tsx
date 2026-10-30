import { DEMO } from "../demo";
import { NavRail } from "../NavRail";
import { NewChatPicker } from "../RailHoverCard";
import type { SceneDefinition } from "../scene";

/**
 * The rail's New Chat button (speech bubble with a `plus.circle.fill`
 * badge) with its agent picker open: "New Chat", "Choose an agent to start a
 * new thread.", "Search agents" and the three agents with their departments,
 * the pointer on Research Assistant.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/UI/Layout/LeftOrchestratorView.swift:2808-2840 (createChatButton:
 *   highlighted while the picker is open; popover arrowEdge .trailing),
 *   :2842-2903 (creationButton: accent on accent .10, scale 1.07; the plus
 *   badge turns accent), :2408-2516 (NewChatAgentPicker: width 300, rows
 *   sorted by name, `person` + name + department, hover accent .10 r8).
 * - The panel behind the popover is left empty (the crop is about the picker).
 *
 * Code vs plan: as planned. The rows are sorted by name, so Growth Writer
 * comes first.
 *
 * CALIBRATE: the NSPopover silhouette (radius, arrow, hairline) and where
 * AppKit places it vertically: it is drawn inside the panel with its arrow
 * on the New Chat button. Drawn at MAGNIFY × the app's points.
 */

const PANEL_W = 368;
const HEIGHT = 310;
const MAGNIFY = 1.15;
// New Chat button centre in the rail (NavRail.tsx geometry): 8 + 32 + 4 + 32 + 4 + 0 + 4 + 16.
const NEW_CHAT_MID_Y = 100;
const POPOVER_TOP = 14;

function NewChatAgentPickerScene() {
  const agents = Object.values(DEMO.agents).map((a) => ({ name: a.name, department: a.department }));
  return (
    <div style={{ zoom: MAGNIFY, position: "relative", width: PANEL_W, height: HEIGHT, display: "flex", overflow: "hidden" }}>
      <NavRail hovered="createChat" selected="agents" />
      <NewChatPicker
        agents={agents}
        arrowTop={NEW_CHAT_MID_Y - POPOVER_TOP}
        hovered={DEMO.agents.research.name}
        style={{ left: 54, top: POPOVER_TOP }}
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "new-chat-agent-picker",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The New Chat button in the navigation rail with its picker open: New Chat, Choose an agent to start a new thread, a Search agents field, and three agents, ${DEMO.agents.writer.name} (${DEMO.agents.writer.department}), ${DEMO.agents.launch.name} (${DEMO.agents.launch.department}) and ${DEMO.agents.research.name} (${DEMO.agents.research.department}), with the pointer on ${DEMO.agents.research.name}.`,
  caption: "New Chat in the rail asks which agent to talk to, then opens a fresh thread with it.",
  Component: NewChatAgentPickerScene,
};
