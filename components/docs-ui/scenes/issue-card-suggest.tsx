import {
  ActionCard,
  ActionCardActions,
  ActionCardDetail,
  ActionCardHeader,
  ActionCardProposal,
  ActionCardRows,
} from "../ActionCard";
import { DEMO } from "../demo";
import { RoutineActionButton } from "../RoutineActionButton";
import type { SceneDefinition } from "../scene";

/**
 * The Issue card of Run #3's failed "Investigate a topic" step, in the
 * proposed-fix state (B, Suggest mode), pinned above the composer of the
 * step's thread (16pt side inset).
 *
 * Demo copy (not in the app): the detail line (the failure reason's first
 * line) and the proposal's change sentence.
 *
 * CALIBRATE: the native DisclosureGroup chevron.
 */

const WIDTH = 480;

function IssueCardSuggest() {
  return (
    <div style={{ padding: "12px 16px" }}>
      <ActionCard>
        <ActionCardHeader
          glyph="exclamationmark.triangle.fill"
          tint="var(--tu-warning)"
          title={`${DEMO.subRoutine.name} needs a fix`}
        />
        <ActionCardRows>
          <ActionCardDetail>The step asks for three competitors, but the topic names two.</ActionCardDetail>
          <ActionCardProposal
            change={`${DEMO.subRoutine.name} compares the competitors the topic names instead of exactly three.`}
            disclosure="Show change"
            label="Proposed fix"
          />
          <ActionCardActions
            primary={<RoutineActionButton kind="primary">Fix &amp; continue</RoutineActionButton>}
            quiet={<RoutineActionButton kind="quiet">Cancel run</RoutineActionButton>}
            secondary={<RoutineActionButton kind="secondary">Retry as is</RoutineActionButton>}
          />
        </ActionCardRows>
      </ActionCard>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "issue-card-suggest",
  width: WIDTH,
  radius: 16,
  label: `Issue card for run ${DEMO.run.number} of ${DEMO.routine.name}: a warning triangle and the headline ${DEMO.subRoutine.name} needs a fix, one line on what went wrong, a Proposed fix box with the change, and the buttons Fix and continue, Retry as is, and Cancel run.`,
  caption: "A failed step's issue card: Toone proposes a fix and waits for you to confirm it, retry the step as is, or cancel the run.",
  Component: IssueCardSuggest,
};
