import { DEMO } from "../demo";
import { NavRail, RAIL_ITEMS, type NavRailItem } from "../NavRail";
import { RailThreads } from "../RailThreads";
import type { SceneDefinition } from "../scene";
import { SystemThreadRow, SystemThreadsDestination } from "../ThreadRow";

/**
 * The left panel with the navigation rail on System Threads: the rail's
 * System Threads button is selected (accent fill + leading bar) and carries
 * the orange count "2" for the two system threads still running; the
 * destination beside it lists them. Your own conversations stay in the
 * rail's recent strip above (two seen chats).
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - rail: P3 NavRail (UI/Layout/LeftOrchestratorView.swift:2517-3105, see
 *   NavRail.tsx); recent strip RecentThreadRailList :3229-3445 (RailThreads.tsx);
 * - badge: systemThreadsBadgeCount :2600-2608 (active system threads, plus
 *   calendar jobs with an unseen reply), railButton badge :3131-3141;
 * - destination: LeftOrchestratorView.swift:1259-1277, :3484-3560;
 *   SystemThreadRow.swift:39-249 (ThreadRow.tsx); rows as in
 *   system-threads-list (one run, two active threads).
 *
 * Code vs plan: the plan names the rail's neighbours "Agents, Browser,
 * Routines, Calendar, Timeline, Settings"; the code also draws Create Agent,
 * Conversations, the recent-conversation strip and New Chat above the
 * divider (LeftOrchestratorView.swift:2623-2670), so they are drawn too.
 * Live Share is Business-only and not shown.
 *
 * Drawn at MAGNIFY × the app's points (caption2 stays legible). Calibrate:
 * the left panel's width (403 incl. the rail, 28% of a 1440pt screen).
 */

const PANEL_W = 403; // chat panel = 28% of a 1440pt screen (FloatingPanel.swift:46)
const MAGNIFY = 1.15;

const ITEMS: NavRailItem[] = RAIL_ITEMS.map((item) =>
  item.id === "recentThreads"
    ? { id: "recentThreads", kind: "custom", node: <RailThreads threads={[{}, {}]} /> }
    : item,
);

function NavRailScene() {
  const research = DEMO.agents.research.name;
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, display: "flex", alignItems: "stretch" }}>
      <NavRail badges={{ systemThreads: 2 }} items={ITEMS} selected="systemThreads" />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <SystemThreadsDestination>
          <SystemThreadRow
            agent={research}
            canStop
            dot="processing"
            preview="Comparing the pricing pages of acme.com and two competitors."
            routine={DEMO.subRoutine.name}
            runNumber={DEMO.run.number}
            status="Searching web"
            step={DEMO.subRoutine.steps[0]}
            time="Running 1m 12s"
          />
          <SystemThreadRow
            agent={research}
            canStop
            dot="processing"
            preview={`Started ${DEMO.subRoutine.name} for the topic.`}
            routine={DEMO.routine.name}
            runNumber={DEMO.run.number}
            status="Waiting for 1 child agent"
            step={DEMO.routine.steps[1]}
            time="Running 1m 40s"
          />
          <SystemThreadRow
            agent={research}
            dot="seen"
            preview={`Topic: ${DEMO.run.topic}.`}
            routine={DEMO.routine.name}
            runNumber={DEMO.run.number}
            status="Completed"
            step={DEMO.routine.steps[0]}
            time="2 minutes ago"
          />
        </SystemThreadsDestination>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "nav-rail",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The left panel's navigation rail with System Threads selected and an orange badge reading 2. From the top the rail shows Create Agent, Conversations, two recent chats, New Chat, then Agents, System Threads, Browser, Routines, Calendar, Timeline and Settings. Beside it, System Threads lists two running threads of run ${DEMO.run.number} and one completed one.`,
  caption: "System Threads has its own place in the rail; the orange badge counts the threads still running.",
  Component: NavRailScene,
};
