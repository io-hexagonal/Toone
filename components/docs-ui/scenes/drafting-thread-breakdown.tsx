import { ChatBubble, ChatListItem, ChatMessage, ChatMeta, ChatParagraph, ChatProse, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { RoutineDraftCard } from "../RoutineDraftCard";
import type { SceneDefinition } from "../scene";

/**
 * Later in the same drafting thread: you ask for "Investigate a topic" to
 * become a sub-routine, the Routine Supervisor confirms with the
 * sub-routine's two steps, and the card for the newly checked revision 3
 * reads "Ready".
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - Card: RoutineDraftCard.tsx (RichMessageBubble.swift:525-697; status
 *   "<Status> · revision N", RoutineDraftStatus drafting / ready /
 *   publishing / published in Core/Storage/Models/PersistedModels.swift:34-39).
 *   A new card is posted per checked revision
 *   (RoutinePreparationContext.swift:100-127); the older card further up
 *   the thread then reads "Superseded · revision N" and is out of this crop.
 * - Bubbles, list run: Chat.tsx (MarkdownTextView.swift:246-318).
 *
 * Code vs spec: none. Cropped to the transcript (header as in
 * drafting-thread-intent).
 */

const WIDTH = 480;
/** The card fills the column: panel width − transcript padding (2 × 16) − the 60pt gutter. */
const CARD_W = WIDTH - 32 - 60;

function DraftingThreadBreakdown() {
  const sub = DEMO.subRoutine;
  return (
    <ChatTranscript>
      <ChatMessage meta={<ChatMeta side="user" time="11:07 AM" />} side="user">
        <ChatBubble side="user">
          Make &ldquo;{sub.name}&rdquo; a sub-routine so other routines can use it.
        </ChatBubble>
      </ChatMessage>
      <ChatMessage meta={<ChatMeta side="agent" time="11:08 AM" />} side="agent">
        <ChatBubble side="agent">
          <ChatProse>
            <ChatParagraph>
              Done. Step 2 now calls the sub-routine {sub.name}, which has two steps:
            </ChatParagraph>
            <ChatListItem index={1}>{sub.steps[0]}</ChatListItem>
            <ChatListItem index={2}>{sub.steps[1]}</ChatListItem>
          </ChatProse>
        </ChatBubble>
      </ChatMessage>
      <ChatMessage meta={<ChatMeta side="agent" time="11:08 AM" />} side="agent">
        <div style={{ width: CARD_W }}>
          <RoutineDraftCard name={DEMO.routine.name} status="Ready · revision 3" />
        </div>
      </ChatMessage>
    </ChatTranscript>
  );
}

export const scene: SceneDefinition = {
  id: "drafting-thread-breakdown",
  width: WIDTH,
  radius: 16,
  label: `The drafting thread. You ask to make ${DEMO.subRoutine.name} a sub-routine so other routines can use it. The Routine Supervisor confirms that step 2 now calls the sub-routine, with two steps: ${DEMO.subRoutine.steps[0]}, ${DEMO.subRoutine.steps[1]}. The routine draft card below reads ${DEMO.routine.name}, Ready · revision 3, with a Publish button.`,
  caption: "Ask for a sub-routine; the draft card moves to the new revision.",
  Component: DraftingThreadBreakdown,
};
