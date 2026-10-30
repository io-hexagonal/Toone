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
 * Reviewing the meeting record: in the same thread as
 * `meeting-summary-reply`, you correct the owner of one action item and the
 * agent replies with the corrected Next actions and updates the saved file.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/RichMessageBubble.swift:90-187 (bubbles, meta).
 * - APP/Features/Chat/Views/MarkdownTextView.swift:246-318 (one merged run:
 *   blocks joined by a blank line, consecutive list items by one newline,
 *   "•  " bullets in textSecondary, `code` monospaced on white 0.10);
 *   "**Next actions**" is a bold run (.body.bold(), :753-765).
 * - Chat.tsx (ChatProse / ChatListItem / ChatStrong / ChatCode), used
 *   exactly as meeting-summary-reply uses them.
 *
 * Code vs spec: none. Times continue meeting-summary-reply's 11:31 AM.
 */

const WIDTH = 480;
const MAGNIFY = 1.1;

function MeetingReviewCorrection() {
  const { you, guest } = DEMO.people;
  const youFirst = you.split(" ")[0];
  const guestFirst = guest.split(" ")[0];
  return (
    <div style={{ zoom: MAGNIFY, width: WIDTH }}>
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="user" time="11:34 AM" />} side="user">
          <ChatBubble side="user">
            {guestFirst} owns the pricing page update, not {youFirst} — fix the action items.
          </ChatBubble>
        </ChatMessage>
        <ChatMessage meta={<ChatMeta side="agent" time="11:34 AM" />} side="agent">
          <ChatBubble side="agent">
            <ChatProse>
              <ChatParagraph>
                <ChatStrong>Next actions</ChatStrong>
              </ChatParagraph>
              <ChatListItem>{guest}: update the pricing page draft by Thursday</ChatListItem>
              <ChatListItem>{guest}: collect onboarding costs from support</ChatListItem>
              <ChatParagraph>I also made {guest} the owner of the Friday pricing page decision.</ChatParagraph>
              <ChatParagraph>
                Updated <ChatCode>{DEMO.meetingNotes}</ChatCode>.
              </ChatParagraph>
            </ChatProse>
          </ChatBubble>
        </ChatMessage>
      </ChatTranscript>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "meeting-review-correction",
  width: Math.round(WIDTH * MAGNIFY),
  radius: 16,
  label: `The same meeting chat, a moment later. You write: ${DEMO.people.guest.split(" ")[0]} owns the pricing page update, not ${DEMO.people.you.split(" ")[0]}, fix the action items. The agent replies with the corrected Next actions: ${DEMO.people.guest}: update the pricing page draft by Thursday; ${DEMO.people.guest}: collect onboarding costs from support. It adds that it made ${DEMO.people.guest} the owner of the Friday pricing page decision and updated ${DEMO.meetingNotes}.`,
  caption: "Correct what the record got wrong; the agent fixes the list and the saved file.",
  Component: MeetingReviewCorrection,
};
