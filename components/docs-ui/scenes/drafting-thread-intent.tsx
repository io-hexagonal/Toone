import { Button } from "../Button";
import { ChatBubble, ChatMessage, ChatMeta, ChatParagraph, ChatProse, ChatStrong, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { DestinationHeader } from "../DestinationHeader";
import { RoutineDraftCard } from "../RoutineDraftCard";
import type { SceneDefinition } from "../scene";

/**
 * The routine drafting thread after you state the intent, input and
 * objective: your message, the agent's first proposal, and the
 * routine draft card for the checked revision 1 with Publish.
 */

const WIDTH = 480;
/** The card fills the column: panel width − transcript padding (2 × 16) − the 60pt gutter. */
const CARD_W = WIDTH - 32 - 60;

function DraftingThreadIntent() {
  const routine = DEMO.routine.name;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <DestinationHeader
        actions={
          <>
            <Button icon="doc.on.doc" iconSize={15} variant="icon" />
            <Button icon="xmark" iconSize={15} variant="icon" />
          </>
        }
        subtitle="Toone"
        title={`Drafting · ${routine}`}
      />
      <ChatTranscript>
        <ChatMessage meta={<ChatMeta side="user" time="11:02 AM" />} side="user">
          <ChatBubble side="user">
            <ChatProse>
              <ChatParagraph>
                <ChatStrong>Intent:</ChatStrong> turn a topic about acme.com&apos;s market into a brief the growth team
                can act on.
                <br />
                <ChatStrong>Input:</ChatStrong> a topic or question.
                <br />
                <ChatStrong>Objective:</ChatStrong> a brief with a summary, evidence, open uncertainties and next steps,
                saved in briefs/.
              </ChatParagraph>
            </ChatProse>
          </ChatBubble>
        </ChatMessage>
        <ChatMessage meta={<ChatMeta side="agent" time="11:03 AM" />} side="agent">
          <ChatBubble side="agent">
            Drafted 4 steps: accept a topic, investigate it, organize the findings, save the brief. Step 2 looks
            reusable on its own. Want it as a sub-routine?
          </ChatBubble>
        </ChatMessage>
        <ChatMessage meta={<ChatMeta side="agent" time="11:03 AM" />} side="agent">
          <div style={{ width: CARD_W }}>
          <RoutineDraftCard name={routine} status="Drafting · revision 1" />
        </div>
        </ChatMessage>
      </ChatTranscript>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "drafting-thread-intent",
  width: WIDTH,
  radius: 24,
  label: `The routine drafting thread titled Drafting · ${DEMO.routine.name}, with Toone. Your message states the intent, the input and the objective. The agent replies that it drafted 4 steps and that step 2 looks reusable. Below, the routine draft card reads ${DEMO.routine.name}, Drafting · revision 1, with a Publish button.`,
  caption: "Give the intent, input and objective; the agent drafts the routine.",
  Component: DraftingThreadIntent,
};
