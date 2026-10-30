import { Button } from "../Button";
import {
  ChatBubble,
  ChatComposer,
  ChatListItem,
  ChatMessage,
  ChatMeta,
  ChatParagraph,
  ChatProse,
  ChatStrong,
  ChatTranscript,
} from "../Chat";
import { DEMO } from "../demo";
import { DestinationHeader } from "../DestinationHeader";
import { Glyph } from "../glyphs";
import type { SceneDefinition } from "../scene";

/**
 * The new agent's thread just after you answer its first question: the
 * agent's "has been created … what would you like it to focus on?", your
 * reply with three responsibilities and a project doc to use as context, the
 * status panel working the purpose in, and the empty composer.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Core/Services/AgentSession/AgentSessionManager.swift:6559-6574 (the
 *   agent message), :7316-7341 (after naming the thread runs as the new
 *   agent and is titled with its name).
 * - APP/UI/Layout/LeftOrchestratorView.swift:1446-1471, :1936-1973 (header
 *   title = thread name, subtitle = "agent · department"), :1729-1817
 *   (copy / close actions).
 * - APP/Features/Chat/Views/ChatPanelView.swift:3014-3140
 *   (OrganizationCreationStatusPanel): while the background composer works
 *   the reply into the agent's role, a registered agent reads "Updating
 *   Research Assistant" / "Updating purpose in background" with a small
 *   ProgressView in the accent instead of the icon; padding 16,
 *   inputBackground @0.82, r12, 1pt separator stroke; xmark 24² dismiss.
 *   Panel padding h16 v8 above the composer's Divider (:1276-1287).
 * - Composer: Chat.tsx <ChatComposer> (all-inherited chip = chevron only).
 * - Context lives in the agent's Instructions, written from this chat
 *   (plan "Verification results" #2), so the doc is named by its project path.
 *
 * Code vs spec: the spec ends at "the composer below, empty"; the status
 * panel is on screen at that moment too (the purpose is being applied), so
 * it is drawn. No attachment chip (unverified for creation threads).
 *
 * calibrate: the ProgressView spinner (drawn static: 8 spokes).
 */

const WIDTH = 460;

function Spinner() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16">
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          stroke="var(--tu-accent)"
          strokeLinecap="round"
          strokeOpacity={0.25 + (i / 7) * 0.75}
          strokeWidth="1.6"
          transform={`rotate(${i * 45} 8 8)`}
          x1="8"
          x2="8"
          y1="1.8"
          y2="4.6"
        />
      ))}
    </svg>
  );
}

function AgentPurposeReply() {
  const agent = DEMO.agents.research;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <DestinationHeader
        actions={
          <>
            <Button icon="doc.on.doc" iconSize={15} variant="icon" />
            <Button icon="xmark" iconSize={15} variant="icon" />
          </>
        }
        subtitle={`${agent.name} · ${agent.department}`}
        title={agent.name}
      />
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="agent" time="10:24 AM" />} side="agent">
          <ChatBubble side="agent">
            <ChatStrong>{agent.name}</ChatStrong> has been created. What would you like it to focus on? You can also
            start working with it now.
          </ChatBubble>
        </ChatMessage>
        <ChatMessage meta={<ChatMeta side="user" time="10:25 AM" />} side="user">
          <ChatBubble side="user">
            <ChatProse>
              <ChatParagraph>Research for the acme.com growth team:</ChatParagraph>
              <ChatListItem>investigate the topic you receive</ChatListItem>
              <ChatListItem>separate supported findings from assumptions</ChatListItem>
              <ChatListItem>produce a concise, structured brief</ChatListItem>
              <ChatParagraph>Use {DEMO.positioningDoc} for product and audience context.</ChatParagraph>
            </ChatProse>
          </ChatBubble>
        </ChatMessage>
      </ChatTranscript>
      <div style={{ padding: "8px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 16,
            borderRadius: 12,
            background: "color-mix(in srgb, var(--tu-input) 82%, transparent)",
            boxShadow: "inset 0 0 0 1px var(--tu-sep)",
          }}
        >
          <Spinner />
          <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: "1 1 auto", minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, lineHeight: "15px", color: "var(--tu-text-1)" }}>
              Updating {agent.name}
            </span>
            <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-text-2)" }}>
              Updating purpose in background
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
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <ChatComposer />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "agent-purpose-reply",
  width: WIDTH,
  radius: 24,
  label: `The ${DEMO.agents.research.name} thread right after naming the agent. The agent says it has been created and asks what it should focus on. Your reply lists three responsibilities (investigate the topic it receives, separate supported findings from assumptions, produce a concise structured brief) and asks it to use ${DEMO.positioningDoc} for context. A status panel reads Updating ${DEMO.agents.research.name}, Updating purpose in background, above an empty message box.`,
  caption: "Answer with the agent's responsibilities and the docs it should use.",
  Component: AgentPurposeReply,
};
