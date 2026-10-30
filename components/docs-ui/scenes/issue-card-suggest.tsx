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
 * step's thread (16pt side inset, RoutineIssueCardView.swift:41-46).
 *
 * Sources (desktop app, main repo, APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Chat/Views/RoutineIssueCardView.swift: card :103-133,
 *   failureCard :196-215, header :516-555, rows :557-611, proposal :630-653,
 *   action row :680-708, inset :827-834;
 * - APP/Core/Services/RoutineRuns/RoutineIssueCardState.swift: Failure
 *   :247-262, ProposedFix :276-299, copy :503-542, failure() :637-651,
 *   proposedFix() :688-716;
 * - headline: APP/Core/Services/RoutineRuns/RoutineStatusVocabulary.swift:35-39;
 * - buttons: APP/Features/Chat/Views/RoutineActionButtonStyle.swift.
 *
 * Code vs plan: the headline is `stepsNeedFix` → "Investigate a topic needs
 * a fix", not "… failed"; and the proposed-fix header passes no meta, so
 * there is no "Run #3" (only the fixed-and-finished state shows "Run #N").
 * A proposal with a diff also shows a collapsed "Show change" disclosure.
 * The primary button is the theme accent with a dark-base label, not the
 * controlTint the kit once used for routine buttons (retired; see RoutineActionButton).
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
