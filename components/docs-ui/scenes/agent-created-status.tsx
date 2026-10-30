import { ChatBubble, ChatMessage, ChatMeta, ChatStrong, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * The new agent's thread right after naming: the agent's first message
 * ("Research Assistant has been created. …") and, above the composer, the
 * creation status panel "Research Assistant created · Ready · Purpose is
 * optional". Cropped just above the composer's divider.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Core/Services/AgentSession/AgentSessionManager.swift:6555-6574
 *   (finishOrganizationDraftNaming: status → awaitingPurpose, appends the
 *   assistant message "**\(name)** has been created. What would you like it
 *   to focus on? You can also start working with it now.");
 * - APP/Features/Chat/Views/ChatPanelView.swift:893-897 (the panel shows
 *   once the draft leaves .naming), :1276-1287 (padding h16 v8, then the
 *   composer's Divider), :3010-3133 (OrganizationCreationStatusPanel:
 *   registered agent, no worker running, empty purpose → headline
 *   "\(name) created", status "Ready · Purpose is optional"; HStack spacing
 *   8; person.crop.circle.badge.plus .title3 in the accent; VStack spacing
 *   2: callout semibold textPrimary / caption textSecondary; xmark caption
 *   semibold textSecondary in a 24² frame; padding 16; inputBackground
 *   @0.82, r12, 1pt separator stroke);
 * - bubble + meta: P10 Chat (RichMessageBubble.swift:90-187, 428-452;
 *   TranscriptMessagePresentation.swift:62-87).
 *
 * Code vs plan: none. The meta row shows a clock time (Text(style: .time)).
 */

const WIDTH = 420;

function AgentCreatedStatus() {
  const name = DEMO.agents.research.name;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <ChatTranscript style={{ paddingBottom: 28 }}>
        <ChatMessage meta={<ChatMeta side="agent" time="10:24 AM" />} side="agent">
          <ChatBubble side="agent">
            <ChatStrong>{name}</ChatStrong> has been created. What would you like it to focus on? You can also start
            working with it now.
          </ChatBubble>
        </ChatMessage>
      </ChatTranscript>
      <div style={{ padding: "8px 16px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 16,
            borderRadius: 12,
            background: "color-mix(in srgb, var(--tu-input) 82%, transparent)",
            outline: "1px solid var(--tu-sep)",
            outlineOffset: -0.5,
          }}
        >
          <Glyph color="var(--tu-accent)" name="person.crop.circle.badge.plus" size={18} />
          <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 auto", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, lineHeight: "15px", color: "var(--tu-text-1)" }}>
              {name} created
            </span>
            <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-text-2)" }}>
              Ready · Purpose is optional
            </span>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              marginLeft: 8,
              color: "var(--tu-text-2)",
            }}
          >
            <Glyph name="xmark" size={10} weight="semibold" />
          </span>
        </div>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "agent-created-status",
  width: WIDTH,
  radius: 16,
  label: `The new agent's thread. ${DEMO.agents.research.name} says it has been created and asks what it should focus on; a status panel above the message box reads ${DEMO.agents.research.name} created, Ready, Purpose is optional.`,
  caption: "Once named, the agent exists. Telling it what to focus on is optional.",
  Component: AgentCreatedStatus,
};
