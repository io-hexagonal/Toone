import {
  ChatBubble,
  ChatCode,
  ChatListItem,
  ChatMessage,
  ChatMeta,
  ChatParagraph,
  ChatProse,
  ChatStrong,
  ChatTranscript,
} from "../Chat";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * After a captured meeting: you ask the agent to organize it, and its reply
 * lists decisions, open questions and next actions, then names the project
 * file it saved them to.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/RichMessageBubble.swift:90-187 (bubbles, meta).
 * - APP/Features/Chat/Views/MarkdownTextView.swift:246-318 (one merged run:
 *   blocks joined by a blank line, consecutive list items by one newline,
 *   "•  " bullets in textSecondary, `code` monospaced on white 0.10);
 *   "**Decisions**" is a bold run (.body.bold(), :753-765).
 * - Chat.tsx (ChatProse / ChatListItem / ChatStrong / ChatCode).
 *
 * Code vs spec: none. The headings are bold paragraphs (as an agent writes
 * "**Decisions**"); a markdown "###" heading would render title3 semibold.
 */

const WIDTH = 480;
const MAGNIFY = 1.1;

function MeetingSummaryReply() {
  const { you, guest } = DEMO.people;
  return (
    <div style={{ zoom: MAGNIFY, width: WIDTH }}>
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="user" time="11:31 AM" />} side="user">
          <ChatBubble side="user">
            Organize this meeting into decisions, open questions and next actions.
          </ChatBubble>
        </ChatMessage>
        <ChatMessage meta={<ChatMeta side="agent" time="11:31 AM" />} side="agent">
          <ChatBubble side="agent">
            <ChatProse>
              <ChatParagraph>
                <ChatStrong>Decisions</ChatStrong>
              </ChatParagraph>
              <ChatListItem>Ship the new pricing page on Friday — owner {you}</ChatListItem>
              <ChatListItem>Keep the free tier for this quarter</ChatListItem>
              <ChatParagraph>
                <ChatStrong>Open questions</ChatStrong>
              </ChatParagraph>
              <ChatListItem>Do we match the competitors&apos; free onboarding?</ChatListItem>
              <ChatListItem>Who signs off on the new copy?</ChatListItem>
              <ChatParagraph>
                <ChatStrong>Next actions</ChatStrong>
              </ChatParagraph>
              <ChatListItem>{you}: update the pricing page draft by Thursday</ChatListItem>
              <ChatListItem>{guest}: collect onboarding costs from support</ChatListItem>
              <ChatParagraph>
                Saved to <ChatCode>{DEMO.meetingNotes}</ChatCode>.
              </ChatParagraph>
            </ChatProse>
          </ChatBubble>
        </ChatMessage>
      </ChatTranscript>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "meeting-summary-reply",
  width: Math.round(WIDTH * MAGNIFY),
  radius: 16,
  label: `A chat after a meeting. You ask the agent to organize the meeting into decisions, open questions and next actions. The agent replies under three bold headings, Decisions, Open questions and Next actions, with two bullets each (for example: ship the new pricing page on Friday, owner ${DEMO.people.you}), and says it saved them to ${DEMO.meetingNotes}.`,
  caption: "Ask for decisions, questions and actions, and keep them as a file.",
  Component: MeetingSummaryReply,
};
