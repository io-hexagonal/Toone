import { ActionCard, ActionCardActions, ActionCardDetail, ActionCardHeader, ActionCardRows, Disclosure } from "../ActionCard";
import { DEMO } from "../demo";
import { RoutineActionButton } from "../RoutineActionButton";
import type { SceneDefinition } from "../scene";

/**
 * The Issue card of Run #3's "Investigate a topic" step after Auto safe fix
 * repaired it: the fixed step committed and the run goes on. Pinned above
 * the composer of the step's thread (16pt side inset), like issue-card-suggest.
 *
 * Demo copy (not in the app): the failure reason, the same one the
 * issue-card-suggest figure shows; revision 2.
 *
 * CALIBRATE: the native DisclosureGroup chevron.
 */

const WIDTH = 480;
const STEP = DEMO.subRoutine.name;

function IssueCardAutofixed() {
  return (
    <div style={{ padding: "12px 16px" }}>
      <ActionCard>
        <ActionCardHeader
          glyph="wand.and.stars"
          meta="Revision 2"
          tint="var(--tu-accent)"
          title={`Auto-fixed ${STEP} · run continues`}
        />
        <ActionCardRows>
          <ActionCardDetail>{`${STEP} failed: The step asks for three competitors, but the topic names two.`}</ActionCardDetail>
          <Disclosure label="Show change and why" />
          <ActionCardActions
            quiet={<RoutineActionButton kind="quiet">Turn off auto-fix</RoutineActionButton>}
            secondary={<RoutineActionButton kind="secondary">Revert</RoutineActionButton>}
          />
        </ActionCardRows>
      </ActionCard>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "issue-card-autofixed",
  width: WIDTH,
  radius: 16,
  label: `Issue card for run ${DEMO.run.number} of ${DEMO.routine.name} after an automatic fix: a wand icon, the headline Auto-fixed ${STEP}, run continues, the label Revision 2, one line on what failed, a closed Show change and why disclosure, and the buttons Revert and Turn off auto-fix.`,
  caption: "After Auto safe fix: the run continues on the fixed step, and Revert undoes the change.",
  Component: IssueCardAutofixed,
};
