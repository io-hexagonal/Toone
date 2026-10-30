import { ChatBubble, ChatMessage, ChatMeta, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { RecordingIndicator } from "../Speech";

/**
 * Push-to-talk in a thread: while ⌥A is held, the composer row is replaced
 * by the recording indicator with the live transcript, outlined in the
 * accent. The bottom of the chat panel, under Research Assistant's question.
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/):
 * - Features/Chat/Views/ChatPanelView.swift:1286-1287 (Divider above the
 *   composer area), :2496-2508 (isRecording → RecordingIndicatorView with
 *   onCancel and the locale badge, padding 16/16), :2557-2567 (accent @0.5
 *   1.5pt r12 outline, inset 16 horizontally and 8 vertically, so the mic
 *   ring sits on the outline's left edge).
 * - Features/Speech/Views/RecordingIndicatorView.swift (RecordingIndicator).
 * - Core/Models/HotkeyBinding.swift:79-83 (push to talk = ⌥A, hold);
 *   App/AppDelegate.swift:1143-1162 (on release the transcript becomes a
 *   "Voice message" chip in the composer; the user sends it).
 *
 * Code vs plan:
 * - The plan cites ChatInputView.swift:178-187; that composer is only used
 *   by the Business remote-org view. The main chat panel draws its own
 *   (ChatPanelView.swift:2496), which adds the cancel button and the outline.
 * - The composer has no microphone button: voice is the ⌥A hotkey (caption).
 *
 * Drawn at MAGNIFY × the app's points.
 */

const PANEL_W = 380;
const MAGNIFY = 1.15;

function VoiceRecording() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="agent" time="10:41 AM" />} side="agent">
          <ChatBubble side="agent">Which topic should the next brief cover?</ChatBubble>
        </ChatMessage>
      </ChatTranscript>
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <div style={{ position: "relative", padding: 16 }}>
        <RecordingIndicator locale={DEMO.voice.locale} text={DEMO.voice.transcript} />
        <div
          style={{
            position: "absolute",
            inset: "8px 16px",
            borderRadius: 12,
            boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, var(--tu-accent) 50%, transparent)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "voice-recording",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `The bottom of a chat with ${DEMO.agents.research.name}. Its last message asks which topic the next brief should cover. The message box has turned into a recording strip outlined in grey: a microphone, an EN language badge, a moving sound wave and the live transcript "${DEMO.voice.transcript}", with a cancel button at the end.`,
  caption: "Hold ⌥A to talk. When you let go, the transcript waits in the message box as a Voice message you can edit before sending.",
  Component: VoiceRecording,
};
