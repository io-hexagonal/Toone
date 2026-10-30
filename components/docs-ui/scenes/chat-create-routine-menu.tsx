import { ChatBubble, ChatListItem, ChatMessage, ChatMeta, ChatParagraph, ChatProse, ChatStrong, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { Menu } from "../Menu";
import type { SceneDefinition } from "../scene";

/**
 * A chat with the Research Assistant: the user's one-off ask, the agent's
 * brief, and that message hovered with its branch menu open on
 * "Create routine".
 *
 * Sources (desktop app, main repo, APP = apps/toone-desktop/Toone/Toone/):
 * - transcript spacing/padding: APP/Features/Chat/Views/ChatPanelView.swift:1502-1512, 1584-1586;
 * - bubble + 60pt gutter: APP/Features/Chat/Views/RichMessageBubble.swift:90-187;
 * - surface: APP/Features/Chat/Views/TranscriptMessagePresentation.swift:62-87;
 * - meta row: RichMessageBubble.swift:428-452; actions + menu items :205-263
 *   ("Fork conversation" arrow.triangle.branch, "Create routine"
 *   point.3.connected.trianglepath.dotted);
 * - markdown run: APP/Features/Chat/Views/MarkdownTextView.swift:246-318.
 *
 * Code vs plan: message text is .body 13pt (the view sets no font), not the
 * 15pt Typography.Chat.message (plan §2.1 "Chat message 15 / 400"). The meta
 * row shows a clock time (Text(style: .time)), not a relative time.
 *
 * CALIBRATE: the open NSMenu (P19, every value), its offset under the
 * borderless menu button, and the highlight colour (system accent).
 */

const WIDTH = 480;

function ChatCreateRoutineMenu() {
  return (
    <ChatTranscript style={{ paddingBottom: 84 }}>
      <ChatMessage meta={<ChatMeta canEdit side="user" time="10:41 AM" />} side="user">
        <ChatBubble side="user">
          Research how acme.com compares to its two main competitors on pricing and write me a brief.
        </ChatBubble>
      </ChatMessage>
      <ChatMessage
        meta={
          <ChatMeta
            actions="visible"
            branchMenu={
              <Menu
                items={[
                  { label: "Fork conversation", icon: "arrow.triangle.branch" },
                  { label: "Create routine", icon: "point.3.connected.trianglepath.dotted", highlighted: true },
                ]}
              />
            }
            side="agent"
            time="10:42 AM"
          />
        }
        side="agent"
      >
        <ChatBubble side="agent">
          <ChatProse>
            <ChatParagraph>
              <ChatStrong>Pricing brief: acme.com vs. two competitors</ChatStrong>
            </ChatParagraph>
            <ChatListItem>acme.com&apos;s entry plan costs about 20% more than both.</ChatListItem>
            <ChatListItem>Both competitors include onboarding for free.</ChatListItem>
            <ChatListItem>Only acme.com offers a free tier.</ChatListItem>
          </ChatProse>
        </ChatBubble>
      </ChatMessage>
    </ChatTranscript>
  );
}

export const scene: SceneDefinition = {
  id: "chat-create-routine-menu",
  width: WIDTH,
  radius: 16,
  label: `A chat with the ${DEMO.agents.research.name}. Below the agent's pricing brief, the message actions Quote, Copy and Branch are showing, and the Branch menu is open with Fork conversation and a highlighted Create routine.`,
  caption: "Hover an agent's reply, open the branch menu and choose Create routine to turn that result into a routine.",
  Component: ChatCreateRoutineMenu,
};
