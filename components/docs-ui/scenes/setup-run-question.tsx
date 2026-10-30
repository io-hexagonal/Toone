import { ChatBubble, ChatMessage, ChatParagraph, ChatProse, ChatTranscript } from "../Chat";
import { DEMO } from "../demo";
import { MultiQuestionCard, QuestionOverlay } from "../MultiQuestionCard";
import type { SceneDefinition } from "../scene";

/**
 * The last step of an Explore setup: everything is ready and the Setup
 * assistant asks the one final question, run now or later. "Run it now" is
 * clicked.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - question + options: APP/Features/WorkflowCatalog/ConversationalSetup/SetupSession.swift:200-205
 *   (runQuestion "“<title>” is set up. Run it now, or later from Current
 *   Routines? (ref <8 hex>)", runOptions "Run it now" / "Later");
 * - header "Run" and "ask this ONE question exactly as written":
 *   APP/Core/Services/AgentSession/AgentSessionManager+Setup.swift:321-325;
 * - the assistant first sums up where it went and that saved answers are
 *   reused (same instruction, :325); chat bubble P10 Chat;
 * - card + overlay: MultiQuestionCard.tsx (AIQuestionView.swift:183-580,
 *   ChatPanelView.swift:1428-1462).
 *
 * Code vs plan (coverage audit C2), the code wins:
 * - The checklist headline "Ready — one choice left"
 *   (AgentSessionManager+Setup.swift:220-221) is real but not visible here:
 *   the dock steps aside while a question card is open
 *   (ChatPanelView.swift:1341-1352).
 * - The options are the app's bare strings, so they carry no description;
 *   the "(ref …)" suffix is part of the question the app matches the answer
 *   against (SetupSession.swift:207-213).
 * - "Submit All", not "Submit"; "Other" is always appended.
 *
 * Drawn at MAGNIFY × the app's points (see setup-input-question).
 */

const PANEL_W = 440;
const MAGNIFY = 1.15;

function SetupRunQuestion() {
  const title = DEMO.explore.routines[0];
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <ChatTranscript padding="16px 16px 12px">
        <ChatMessage side="agent">
          <ChatBubble side="agent">
            <ChatProse>
              <ChatParagraph>
                It’s in {DEMO.agents.research.department}, and {DEMO.setup.site} is saved for every run.
              </ChatParagraph>
            </ChatProse>
          </ChatBubble>
        </ChatMessage>
      </ChatTranscript>
      <QuestionOverlay>
        <MultiQuestionCard
          canSubmit
          header="Run"
          options={[{ label: "Run it now", selected: true, focused: true }, { label: "Later" }]}
          question={`“${title}” is set up. Run it now, or later from Current Routines? (ref ${DEMO.setup.ref})`}
        />
      </QuestionOverlay>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "setup-run-question",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The end of the setup conversation for ${DEMO.explore.routines[0]}: a question card headed Run asks “${DEMO.explore.routines[0]}” is set up. Run it now, or later from Current Routines? Options Run it now (selected), Later and Other, with a Submit All button.`,
  caption: "One last question: start the first run now, or keep the routine ready for later.",
  Component: SetupRunQuestion,
};
