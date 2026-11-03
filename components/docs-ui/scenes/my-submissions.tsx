import { DEMO } from "../demo";
import { DestinationHeader } from "../DestinationHeader";
import {
  PanelSectionHeader,
  SubmissionActions,
  SubmissionCard,
  SubmissionNotes,
} from "../ExploreSubmissions";
import { Glyph } from "../glyphs";
import { NativeSegmented } from "../NativeSegmented";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * Explore → My submissions in the left panel: three routine submissions,
 * Pending (collapsed), Approved (expanded, Copy link) and Rejected
 * (expanded, Review note).
 *
 * CALIBRATE: the segmented control, the small bordered buttons (do
 * `Button(title, systemImage:)` labels show their icon in a bordered button
 * on macOS 26?), and the icon button.
 */

const WIDTH = 400;
const S = DEMO.explore.submissions;

function MySubmissions() {
  return (
    <div>
      <DestinationHeader subtitle="Routines and bundles reviewed by Toone" title="Explore" />
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 16px" }}>
        <NativeSegmented segments={["Explore", "My submissions"]} selected={1} />
      </div>
      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.19)" }} />
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
          <SubmissionCard status="pending" subtitle={`Revision 1 · ${S.pending.submitted}`} title={S.pending.name} />
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
          </SubmissionCard>
          <SubmissionCard expanded status="rejected" subtitle={`Revision 1 · ${S.rejected.submitted}`} title={S.rejected.name}>
            <SubmissionNotes
              reviewNote={S.rejected.reviewNote}
              reviewed="Oct 21, 2026 at 9:30 AM"
              submitted={`${S.rejected.submitted} at 10:48 AM`}
              summary={S.rejected.summary}
            />
            <SubmissionActions>
              <PushButton fontSize={13} fontWeight={500} icon="doc.text.magnifyingglass" label="Inspect routine" small />
              <PushButton fontSize={13} fontWeight={500} icon="square.and.arrow.up" label="Re-share" small />
            </SubmissionActions>
          </SubmissionCard>
        </div>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "my-submissions",
  width: WIDTH,
  radius: 24,
  label: `Explore in the Toone app with My submissions selected. Under Routines (3): ${S.pending.name}, revision 1, Pending; ${S.approved.name}, Approved, expanded with Inspect routine and Copy link; ${S.rejected.name}, Rejected, expanded with a Review note and Inspect routine and Re-share buttons.`,
  caption: "My submissions shows each routine's review status. Approved items have Copy link; rejected ones carry the reviewer's note.",
  Component: MySubmissions,
};
