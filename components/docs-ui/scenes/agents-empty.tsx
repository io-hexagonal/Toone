import { Button } from "../Button";
import { DestinationHeader } from "../DestinationHeader";
import { Glyph } from "../glyphs";
import { NavRail } from "../NavRail";
import type { SceneDefinition } from "../scene";

/**
 * The left panel of a brand-new project: the navigation rail with Agents
 * selected, and the empty Agents roster ("No agents yet") above its
 * "Create agent" bottom bar.
 *
 * CALIBRATE: the borderedProminent bezel (height, radius, label colour) and
 * the .ultraThinMaterial bar fill.
 */

const WIDTH = 400;
const HEIGHT = 432;

function AgentsEmpty() {
  return (
    <div style={{ display: "flex", height: HEIGHT }}>
      <NavRail selected="agents" />
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <DestinationHeader title="Agents" />
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 24,
            textAlign: "center",
          }}
        >
          <Glyph color="var(--tu-label-2)" name="person.crop.circle.badge.plus" size={40} weight="light" />
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: "16px", color: "var(--tu-label-1)" }}>
            No agents yet
          </span>
          <span style={{ maxWidth: 280, fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>
            Create your first agent to start building this organization.
          </span>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--tu-sep)",
            padding: 16,
            minHeight: 32,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <Button
            icon="person.badge.plus"
            iconSize={14}
            label="Create agent"
            style={{ display: "flex", width: "100%", gap: 6 }}
            variant="prominent"
          />
        </div>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "agents-empty",
  width: WIDTH,
  radius: 24,
  label:
    "The left panel of a new project. The navigation rail has Agents selected; the Agents list is empty and reads No agents yet, Create your first agent to start building this organization, with a Create agent button at the bottom.",
  caption: "A new project starts with an empty Agents list. Routines sit in the same rail.",
  Component: AgentsEmpty,
};
