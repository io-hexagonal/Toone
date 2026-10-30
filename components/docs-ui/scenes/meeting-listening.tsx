import { ChatMessage, ChatMeta, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { AudioMessageBubble, MeetingListeningCard } from "../Speech";

/**
 * Meeting capture in a thread: two transcribed segments already in the
 * conversation (one from your microphone, one from the room's system audio)
 * and the "Meeting mode active" card above the composer.
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/):
 * - Features/Chat/Views/ChatPanelView.swift:1286-1309 (Divider, then the
 *   listening card with padding h16 / top 16 while execution.isMeetingMode),
 *   :1795-1852 (card).
 * - Features/Chat/Views/RichMessageBubble.swift:90-187 (user messages sit on
 *   the right, metadata row under them), :125-128 + :1493-1566 (audio
 *   bubbles: "[USER]:" → Voice message in the accent, "[ROOM]:" → Room
 *   message in orange).
 * - App/Environment/AppEnvironment.swift:836-847 (each segment is appended
 *   as a .user message with isAudioMessage).
 * - Features/Chat/Views/PulsingDot.swift (PulsingDot).
 *
 * Code vs plan:
 * - The plan shows one Room message; the figure adds the Voice message the
 *   same capture produces from your microphone, since the guide's point is
 *   telling speakers apart. Room speaker labels stay nil until diarization
 *   ships (MeetingTranscriptionEngine.swift:13), so the bubble says "Room".
 * - The crop ends under the card; the composer below it is unchanged.
 *
 * Drawn at MAGNIFY × the app's points.
 */

const PANEL_W = 380;
const MAGNIFY = 1.15;

function MeetingListening() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="user" time="10:46 AM" />} side="user">
          <AudioMessageBubble source="voice" />
        </ChatMessage>
        <ChatMessage meta={<ChatMeta side="user" time="10:46 AM" />} side="user">
          <AudioMessageBubble source="room" />
        </ChatMessage>
      </ChatTranscript>
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <div style={{ padding: "16px 16px 14px" }}>
        <MeetingListeningCard locale={DEMO.voice.locale} segments={12} />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "meeting-listening",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `A chat during meeting capture. Two transcribed segments sit in the conversation: a grey Voice message from your microphone and an orange Room message from the system audio. Below them a red card reads "Meeting mode active, Listening to mic & system audio · EN", shows 12 segments with a pulsing red dot, and has a Stop Listening button.`,
  caption: "While a meeting is captured, your microphone and the room arrive as separate messages until you stop listening.",
  Component: MeetingListening,
};
