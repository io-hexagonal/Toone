import { DEMO } from "../demo";
import { AsyncQuestionCard } from "../QuestionCard";
import type { SceneDefinition } from "../scene";

/**
 * An agent asks for approval without stopping its work: the async question
 * card above the composer of a "Launch day" step thread (Growth Writer,
 * "Draft launch posts"), with the agent's suggested answer chosen.
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
