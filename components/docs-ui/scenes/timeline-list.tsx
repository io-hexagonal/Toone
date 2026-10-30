import { DEMO } from "../demo";
import {
  CommitRow,
  DayHeader,
  PERSON_COLORS,
  PersonFilterBar,
  ReferenceChip,
  TimelineDestination,
  TimelineDivider,
  TimelineSection,
} from "../GitTimeline";
import type { SceneDefinition } from "../scene";

/**
 * Project History, opened from the navigation rail: the Timeline destination
 * in the left panel (compact layout, narrower than 620pt) with a clean
 * working tree and three checkpoints made today by two agents and you.
 *
 * Sources (main repo, apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/LeftOrchestratorView.swift:1300-1308 (destination header +
 *   GitTimelinePanelView(showsPanelHeader: false)), :2584 / :2668 (rail).
 * - Features/GitTimeline/GitTimelinePanelView.swift:56-98 (body), :219-238
 *   (embedded toolbar), :244-270 (compact below 620pt), :460-511 (list:
 *   Staged Changes · Changes · Past Commits, person filter when more than
 *   one person, day groups), :513-581 (rows, reference chips).
 * - Features/GitTimeline/GitWorkingChangesView.swift:3-54 (section headers,
 *   "Nothing staged" / "No changes on this Mac").
 * - Features/GitTimeline/GitTimelineStore.swift:35-70 (people: newest
 *   contributor first; a human commit with your Git email is named "You").
 *
 * Code vs plan:
 * - The plan's "Sam Rivera" row: the app names your own commits "You"
 *   (GitTimelineStore.swift:63), so the row and its chip read "You".
 * - Agent rows carry the agent's name (from reflog attribution), no icon.
 * - Person dots use the app's hard-coded SwiftUI colours, so the first
 *   person (the newest contributor, Research Assistant) is system blue
 *   (GitTimelinePanelView.swift:51-53). This is the one hue outside the
 *   Smoky Quartz theme in the figure; the plan asks for it.
 * - No "last known backup" chip: the demo repo has no upstream (a state,
 *   not an error, GitTimelineModels.swift:53-55).
 * - Dates are git's %ar strings ("12 minutes ago"), not clock times.
 *
 * Drawn at MAGNIFY × the app's points (caption2 stays legible in the column).
 */

const PANEL_W = 380;
const MAGNIFY = 1.15;

function TimelineList() {
  const [first, second, third] = DEMO.timeline.commits;
  const people = [
    { name: first.author, color: PERSON_COLORS[0] },
    { name: second.author, color: PERSON_COLORS[1] },
    { name: third.author, color: PERSON_COLORS[2] },
  ];
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, paddingBottom: 12 }}>
      <TimelineDestination checked={DEMO.timeline.checked} repoPath={DEMO.timeline.repoPath}>
        <TimelineSection count={0} empty="Nothing staged" title="Staged Changes" />
        <TimelineDivider />
        <TimelineSection count={0} empty="No changes on this Mac" title="Changes" />
        <TimelineDivider />
        <TimelineSection count={3} title="Past Commits" />
        <PersonFilterBar people={people} />
        <DayHeader title="Today" />
        <CommitRow
          author={first.author}
          chips={<ReferenceChip emphasized label="you are here" />}
          color={people[0].color}
          subject={first.subject}
          when={first.when}
        />
        <CommitRow author={second.author} color={people[1].color} subject={second.subject} when={second.when} />
        <CommitRow author={third.author} color={people[2].color} subject={third.subject} when={third.when} />
      </TimelineDestination>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "timeline-list",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 16,
  label: `The Timeline in the left panel for a project with no uncommitted changes. Past Commits lists three checkpoints from today: "${DEMO.timeline.commits[0].subject}" by ${DEMO.timeline.commits[0].author}, marked "you are here"; "${DEMO.timeline.commits[1].subject}" by You; and "${DEMO.timeline.commits[2].subject}" by ${DEMO.timeline.commits[2].author}. Filter chips above the list read Everyone, ${DEMO.timeline.commits[0].author}, You and ${DEMO.timeline.commits[2].author}, each person with a coloured dot.`,
  caption: "Every checkpoint shows who made it, an agent or you, and the person filter narrows the list to one contributor.",
  Component: TimelineList,
};
