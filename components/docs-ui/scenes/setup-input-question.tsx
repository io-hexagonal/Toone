import { ChatBubble, ChatMessage, ChatParagraph, ChatProse, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { MultiQuestionCard, QuestionOverlay } from "../MultiQuestionCard";
import type { SceneDefinition } from "../scene";

/**
 * Setting up an Explore routine: the Setup assistant asks for the one input
 * it couldn't fill, with its suggested answer first. The person has clicked
 * the suggestion, so "Submit All" is live.
 *
 * Drawn at MAGNIFY × the app's points so the 10–11pt card text reads at the
 * guide column.
 */

const PANEL_W = 440;
const MAGNIFY = 1.15;

function SetupInputQuestion() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <ChatTranscript padding="16px 16px 12px">
        <ChatMessage side="agent">
          <ChatBubble side="agent">
            <ChatProse>
              <ChatParagraph>
                {DEMO.explore.routines[0]} is now in {DEMO.agents.research.department}. One thing I couldn’t find in
                your project:
              </ChatParagraph>
            </ChatProse>
          </ChatBubble>
        </ChatMessage>
      </ChatTranscript>
      <QuestionOverlay>
        <MultiQuestionCard
          canSubmit
          header="Website"
          options={[
            {
              label: DEMO.setup.site,
              description: "Suggested — the site this project is about",
              selected: true,
              focused: true,
            },
          ]}
          question="Which site are you launching?"
        />
      </QuestionOverlay>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-input-question",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The setup conversation for ${DEMO.explore.routines[0]}. Under the assistant's message, a question card titled AI has some questions slides up: header Website, the question Which site are you launching?, the suggested answer ${DEMO.setup.site} (selected), an Other option to enter a custom answer, and a Submit All button.`,
  caption: "The setup assistant asks only for what it couldn't find, with a suggested answer you can accept in one click.",
  Component: SetupInputQuestion,
};
