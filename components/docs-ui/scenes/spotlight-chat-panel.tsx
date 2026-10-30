import { Button } from "../Button";
import { ChatBubble, ChatComposer, ChatMessage, ChatMeta, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { DestinationHeader } from "../DestinationHeader";
import { NavRail } from "../NavRail";
import type { SceneDefinition } from "../scene";
import { WorkspaceStrip } from "../WorkspaceStrip";

/**
 * The chat panel in the Spotlight layout: one wide, short panel centred on
 * the screen (Project Explorer hidden), showing the project strip, the
 * navigation rail, a conversation with Research Assistant and the composer.
 * The project (strip) and the agent · department (header subtitle) say
 * where the conversation belongs.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - geometry: UI/Windows/FloatingPanel.swift:65-68, :105-111 (Spotlight chat
 *   = 53% of the visible width × 1/3 of its height, centred);
 *   UI/Windows/PanelLayout.swift:20-33 (project panel hidden). Drawn for a
 *   1440 × 876 visible frame → 763 × 292pt, then scaled by ZOOM to the
 *   640px figure limit.
 * - UI/Layout/LeftOrchestratorView.swift:727-734 (strip + separator when
 *   several projects are open), :891-929 (rail + 1pt divider + destination),
 *   :1364-1444 (destination header), :1446-1471 (chat: title =
 *   currentChatTitle, subtitle = ConversationHeaderMetadata.label),
 *   :1729-1817 (thread actions: doc.on.doc "Copy Entire Conversation",
 *   xmark "Close Thread"; "LIVE" only while running), :1936-1974.
 * - Features/Chat/Views/ConversationHeaderMetadata.swift:12 ("agent · department").
 * - Features/Organization/Models/RoutineExecution.swift:1061-1083 (a chat's
 *   title is its generated customTitle, else the last user message).
 * - Composer: Chat.tsx <ChatComposer> (ChatPanelView.swift:2421-2596,
 *   ChatInputView.swift:14-113); bubbles: Chat.tsx.
 * - Rail: NavRail.tsx; Conversations is selected while a conversation is
 *   open (selectedOverride, LeftOrchestratorView.swift:2625-2628).
 *
 * Code vs plan:
 * - The plan's header title is "Research Assistant". With a thread open the
 *   title is the thread's name (RoutineExecution.displayName), here its
 *   generated title; "Chat with Research Assistant" only shows with no
 *   thread selected. The subtitle "Research Assistant · Growth" is as planned.
 * - The plan's crop is only the chat; the Spotlight panel also carries the
 *   project strip (multi-project on) and the rail (visible by default), so
 *   both are drawn.
 *
 * calibrate:
 * - Rail overflow: a 292pt panel is shorter than the rail's fixed buttons
 *   (≈390pt). The rail's VStack sits in a GeometryReader and is drawn
 *   clipped at the panel's bottom; the recent-thread strip gets 0 slots
 *   (LeftNavigationRailMetrics.visibleRecentSlots, :1985-2000).
 * - Send button (.glassProminent circle, disabled while the field is empty)
 *   and the placeholder colour are native.
 * - The transcript is scrolled to its end, so its top padding is out of view.
 */

const SCREEN_W = 1440;
const SCREEN_H = 876;
const PANEL_W = Math.round(SCREEN_W * 0.53); // 763
const PANEL_H = Math.round(SCREEN_H / 3); // 292
const FIGURE_W = 640;
const ZOOM = FIGURE_W / PANEL_W;

function SpotlightChatPanel() {
  const chat = DEMO.spotlightChat;
  const agent = DEMO.agents.research;
  return (
    <div
      style={{
        zoom: ZOOM,
        width: PANEL_W,
        height: PANEL_H,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <WorkspaceStrip
        pills={[
          { index: 1, name: DEMO.projects[0], active: true },
          { index: 2, name: DEMO.projects[1] },
          { index: 3, name: DEMO.projects[2] },
        ]}
      />
      <div style={{ height: 1, flex: "none", background: "var(--tu-sep)" }} />
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex" }}>
        <NavRail selected="conversations" style={{ overflow: "hidden" }} />
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <DestinationHeader
            actions={
              <>
                <Button icon="doc.on.doc" iconSize={15} variant="icon" />
                <Button icon="xmark" iconSize={15} variant="icon" />
              </>
            }
            subtitle={`${agent.name} · ${agent.department}`}
            title={chat.title}
          />
          <div
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <ChatTranscript style={{ flex: "none" }}>
              <ChatMessage meta={<ChatMeta side="user" time={chat.userTime} />} side="user">
                <ChatBubble side="user">{chat.user}</ChatBubble>
              </ChatMessage>
              <ChatMessage meta={<ChatMeta side="agent" time={chat.agentTime} />} side="agent">
                <ChatBubble side="agent">{chat.agent}</ChatBubble>
              </ChatMessage>
            </ChatTranscript>
          </div>
          <ChatComposer chip={chat.chip} />
        </div>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "spotlight-chat-panel",
  width: FIGURE_W,
  radius: 24,
  label: `The chat panel in the Spotlight layout: a wide, short panel. At the top the project strip shows ${DEMO.projects[0]} active. Below, the navigation rail and a conversation titled ${DEMO.spotlightChat.title}, with the subtitle ${DEMO.agents.research.name} · ${DEMO.agents.research.department}. You asked to compare acme.com's pricing page with two competitors and the agent replied it will save the comparison as a brief. The composer reads Type a message... with the model chip ${DEMO.spotlightChat.chip}.`,
  caption: "Spotlight: a minimal chat panel over your other apps. The strip and header show the project and the agent.",
  Component: SpotlightChatPanel,
};
