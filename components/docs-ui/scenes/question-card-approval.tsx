import { DEMO } from "../demo";
import { AsyncQuestionCard } from "../QuestionCard";
import type { SceneDefinition } from "../scene";

/**
 * An agent asks for approval without stopping its work: the async question
 * card above the composer of a "Launch day" step thread (Growth Writer,
 * "Draft launch posts"), with the agent's suggested answer chosen.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/AsyncQuestionComposer.swift:29-205 (card,
 *   header, body, footer; see QuestionCard.tsx);
 * - APP/Features/Chat/Views/QuestionSharedComponents.swift:14-124 (chip,
 *   option rows, answer field);
 * - suggested answer: the agents put it first and mark it "(Recommended)",
 *   the app's own convention for its question briefs
 *   (APP/Features/Setup/Models/ProjectHistoryReadiness.swift:146-157;
 *   setup inputs ask "with … a suggested answer",
 *   APP/Features/WorkflowCatalog/ConversationalSetup/SetupBriefs.swift:143-145).
 *   Options are plain strings (ConversationCard.swift:94-100), so the
 *   suggestion lives in the label.
 *
 * Code vs plan:
 * - No "· 1 of 1": the count shows only when more than one question is
 *   pending (AsyncQuestionComposer.swift:89-91).
 * - The plan's "suggested answer does not exist" is superseded by the
 *   owner's verification (plan, Verification results item 4): it is the
 *   first, "(Recommended)" option.
 * - The header also carries the minimize (`minus`) and close (`xmark`)
 *   controls, in the accent.
 * - State: the suggested option is chosen, so "Send answer" is enabled; the
 *   answer field keeps the focus it takes when the card appears (accent
 *   stroke). In a live routine thread the composer stays below the card
 *   (keepsComposer); the crop ends at the card.
 *
 * CALIBRATE: the prominent Send button, the field's focus after an option
 * click, the placeholder colour.
 */

const WIDTH = 460;

function QuestionCardApproval() {
  return (
    <AsyncQuestionCard
      options={["Yes, post it (Recommended)", "Hold for review"]}
      question="Post the launch thread on Threads now?"
      selected={0}
    />
  );
}

export const scene: SceneDefinition = {
  id: "question-card-approval",
  width: WIDTH,
  radius: 16,
  label: `A question card from ${DEMO.agents.writer.name} labelled Question for you: Post the launch thread on Threads now? Two options, Yes, post it (Recommended), which is chosen, and Hold for review; a Write an answer field; the note Work continues while you answer; and a Send answer button.`,
  caption: "An agent asks before it acts. Pick its suggested answer or write your own; its work continues meanwhile.",
  Component: QuestionCardApproval,
};
