import { DEMO } from "../demo";
import { CommitDetail, CompactBackRow, TimelineDestination } from "../GitTimeline";
import type { SceneDefinition } from "../scene";

/**
 * Project History: the newest checkpoint opened in the compact Timeline (the
 * left-panel destination navigates to the detail; a panel 620pt or wider
 * shows it in a 300pt column beside the list instead). "What happened here?"
 * opens a conversation that explains the checkpoint.
 *
 * Calibrate: the native .small button's bezel.
 */

const PANEL_W = 380;
const MAGNIFY = 1.15;

function TimelineDetail() {
  const commit = DEMO.timeline.commits[0];
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, paddingBottom: 6 }}>
      <TimelineDestination checked={DEMO.timeline.checked} repoPath={DEMO.timeline.repoPath}>
        <CompactBackRow />
        <CommitDetail
          byline={`${commit.author} · ${commit.when}`}
          files={[
            { path: DEMO.artefact, change: "added", additions: 48, deletions: 0 },
            { path: "briefs/README.md", change: "modified", additions: 2, deletions: 1 },
          ]}
          subject={commit.subject}
        />
      </TimelineDestination>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "timeline-detail",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `The checkpoint "${DEMO.timeline.commits[0].subject}" opened in the Timeline: made by ${DEMO.timeline.commits[0].author} ${DEMO.timeline.commits[0].when}, with a "What happened here?" button and, under What changed, two files: ${DEMO.artefact} added with 48 lines, and briefs/README.md with 2 lines added and 1 removed.`,
  caption: "Open a checkpoint to see the files it changed; What happened here? asks an agent to explain it in plain words.",
  Component: TimelineDetail,
};
