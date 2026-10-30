import { Button } from "../Button";
import { DEMO } from "../demo";
import { Glyph, type GlyphName } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * The left panel's chat header while a new agent is being named: the title
 * is replaced by the name field, "Research Assistant" is typed (caret at the
 * end) and the helper reads "Press Return to create agent". The chat body
 * under the header stays clear and the composer is hidden until the agent
 * exists.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/LeftOrchestratorView.swift:11-84 (OrganizationCreatorTitleField:
 *   VStack spacing 1; TextField .headline in the accent; caption2 .secondary
 *   helper; padding 8/4; accent .1 fill, r7; 1pt accent .35 stroke);
 *   :1362-1405 (destinationHeaderContent: sidebar.left / sidebar.right icon
 *   buttons, HStack 8, padding 8, min height 44, separator below);
 *   :1446-1462 (naming state uses the field as the title);
 *   :1784-1817 (header actions: Copy Entire Conversation, Close Thread).
 * - Features/Chat/Views/ChatPanelView.swift:882-891 (body kept clear while
 *   naming).
 * - Core/Services/AgentSession/AgentSessionManager.swift:6416-6474
 *   (beginAgentDraft: thread titled "Create Agent").
 *
 * Code vs plan: the header does not show a "Create Agent" title in this
 * state. "Create Agent" is the thread's custom title (thread lists); the
 * header shows only the name field (LeftOrchestratorView.swift:1450-1462).
 */

const WIDTH = 420;

function HeaderIcon({ name }: { name: GlyphName }) {
  return (
    <Button label={<Glyph name={name} size={15} weight="medium" />} variant="icon" />
  );
}

function AgentNameField() {
  return (
    <div style={{ height: 76 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
          padding: "3px 8px",
          borderBottom: "1px solid var(--tu-sep)",
        }}
      >
        <HeaderIcon name="sidebar.left" />
        <div
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            padding: "4px 8px",
            borderRadius: 7,
            background: "color-mix(in srgb, var(--tu-accent) 10%, transparent)",
            outline: "1px solid color-mix(in srgb, var(--tu-accent) 35%, transparent)",
            outlineOffset: -0.5,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              fontWeight: 700,
              lineHeight: "16px",
              color: "var(--tu-accent)",
            }}
          >
            {DEMO.agents.research.name}
            {/* insertion point, focused field (static: figures don't blink) */}
            <span
              style={{ width: 1, height: 15, marginLeft: 1, background: "var(--tu-accent)" }}
            />
          </span>
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>
            Press Return to create agent
          </span>
        </div>
        <span style={{ width: 4, flex: "none" }} />
        <HeaderIcon name="doc.on.doc" />
        <HeaderIcon name="xmark" />
        <HeaderIcon name="sidebar.right" />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "agent-name-field",
  width: WIDTH,
  radius: 16,
  label: `Naming a new agent. The chat header holds a name field with ${DEMO.agents.research.name} typed in and the hint Press Return to create agent; the conversation below is still empty.`,
  caption: "Type the agent's name in the header and press Return to create it.",
  Component: AgentNameField,
};
