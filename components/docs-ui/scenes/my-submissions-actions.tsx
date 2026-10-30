import { DEMO } from "../demo";
import {
  PanelSectionHeader,
  SubmissionActions,
  SubmissionCard,
  SubmissionNotes,
} from "../ExploreSubmissions";
import { Glyph } from "../glyphs";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * Explore → My submissions, cropped to the list, with the two actions this
 * guide section names: the Pending routine open with **Withdraw…**, and the
 * Approved (live) routine open with **Share update** under its actions,
 * because its local copy changed since it was shared. The Rejected routine
 * stays collapsed (its Re-share is in `my-submissions`, just above on the
 * same page).
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/WorkflowCatalog/ExploreSubmissionsView.swift:89-131
 *   (list header "My submissions" + refresh, "Routines" section), :299-327
 *   (routineRow: card body = details, then RoutineUpdateAction, bordered
 *   small, UI.button 13 medium), :329-338 (details: notes, then actions in an
 *   HStack(8)), :340-359 (actions: Inspect routine; Copy link when
 *   approved; "Withdraw…" role .destructive when pending; Re-share when
 *   rejected), :425-450 ("Share update" `arrow.triangle.2.circlepath`, only
 *   for a live listing whose local routine changed);
 * - P8/P9 pieces in ExploreSubmissions.tsx (ExploreSubmissionComponents.swift:5-154).
 *
 * Code vs plan: the plan pairs Pending/Withdraw with Rejected/Re-share. The
 * section is "Update or withdraw a listing", and `my-submissions` directly
 * above already shows the rejected row with its note and Re-share, so this
 * figure shows the update path (Share update on the approved row) instead.
 * "Withdraw…" has no symbol in the code (a plain destructive button).
 *
 * CALIBRATE: the small bordered buttons (as in my-submissions) and the
 * destructive label colour (system red on a bordered button).
 */

const WIDTH = 400;
const S = DEMO.explore.submissions;

function MySubmissionsActions() {
  return (
    <div style={{ background: "color-mix(in srgb, var(--tu-inner) 12%, transparent)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 16px" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tu-label-1)" }}>My submissions</span>
        <span style={{ flex: "1 1 auto" }} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 8,
            color: "var(--tu-text-2)",
          }}
        >
          <Glyph name="arrow.clockwise" size={15} weight="medium" />
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px 16px" }}>
        <PanelSectionHeader count={3} icon="arrow.triangle.branch" title="Routines" />
        <SubmissionCard expanded status="pending" subtitle={`Revision 1 · ${S.pending.submitted}`} title={S.pending.name}>
          <SubmissionNotes submitted={`${S.pending.submitted} at 9:14 AM`} summary={S.pending.summary} />
          <SubmissionActions>
            <PushButton fontSize={13} fontWeight={500} icon="doc.text.magnifyingglass" label="Inspect routine" small />
            <PushButton fontSize={13} fontWeight={500} label="Withdraw…" small style={{ color: "var(--tu-error)" }} />
          </SubmissionActions>
        </SubmissionCard>
        <SubmissionCard expanded status="approved" subtitle={`Revision 1 · ${S.approved.submitted}`} title={S.approved.name}>
          <SubmissionNotes
            reviewed="Oct 23, 2026 at 11:05 AM"
            submitted={`${S.approved.submitted} at 4:12 PM`}
            summary={S.approved.summary}
          />
          <SubmissionActions>
            <PushButton fontSize={13} fontWeight={500} icon="doc.text.magnifyingglass" label="Inspect routine" small />
            <PushButton fontSize={13} fontWeight={500} icon="link" label="Copy link" small />
          </SubmissionActions>
          <SubmissionActions>
            <PushButton fontSize={13} fontWeight={500} icon="arrow.triangle.2.circlepath" label="Share update" small />
          </SubmissionActions>
        </SubmissionCard>
        <SubmissionCard status="rejected" subtitle={`Revision 1 · ${S.rejected.submitted}`} title={S.rejected.name} />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "my-submissions-actions",
  width: WIDTH,
  radius: 16,
  label: `My submissions with two routines open. ${S.pending.name}, Pending, offers Inspect routine and a red Withdraw… button. ${S.approved.name}, Approved, offers Inspect routine and Copy link, and below them Share update. ${S.rejected.name}, Rejected, is collapsed.`,
  caption: "While a submission is Pending you can withdraw it; a live routine you changed offers Share update.",
  Component: MySubmissionsActions,
};
