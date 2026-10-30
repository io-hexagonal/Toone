import { DEMO } from "../demo";
import { Callout, Miniature } from "../Miniature";
import {
  IOSLargeTitle,
  IOSStatusBar,
  IOSTabBar,
  M,
  MobileAgentCard,
  MobileChip,
  MobileSectionHeader,
  PHONE,
  PhoneFrame,
  RecentThreadCard,
  SystemThreadCard,
  ThreadCarousel,
} from "../MobileCompanion";
import type { SceneDefinition } from "../scene";

/**
 * The iPhone companion's home: the Agents tab while Run #3 works on the
 * Mac. Recent Threads (your conversations), System Threads with "2 running"
 * and See All, then the agents grouped by department; the five-tab bar at
 * the bottom. Connected through the relay (no connection bar: it only shows
 * while the link is down).
 *
 * Sources (apps/toone-mobile/TooneMobile/TooneMobile/, monorepo main):
 * - Presentation/Main/MainTabView.swift:24-56 (TabView: Agents, Routines,
 *   Activity, Organization, Settings; tint accent), :160-170 (connection bar
 *   hidden while connected), :194-233 (tabs; Activity badge = unread, 0 here).
 * - Presentation/Navigation/AppRouter.swift:6-41 (titles; icons person.2.fill,
 *   point.3.filled.connected.trianglepath.dotted, bolt.fill, building.2.fill,
 *   gearshape.fill).
 * - Presentation/Agents/AgentListView.swift:16-46 (large title "Agents",
 *   trailing clock.arrow.circlepath "Session History"), :156-237 (sections:
 *   Recent Threads with count, System Threads with "N running" chip and
 *   "See All", then a DepartmentSection per department; spacing 16, gutter
 *   16, padding v8).
 * - Components: RecentThreadCard.swift, SystemThreadCard.swift (header,
 *   routine · step, status line, ThreadLifecycleBadge "Working" with a
 *   spinner), DepartmentSection.swift + AgentCard.swift (status dot, name,
 *   "Current" chip for the selected agent, description, "N threads").
 * - Domain/Entities/Session.swift:161-169 (workTitle = routine · step),
 *   :225-235 (lifecycle labels).
 * - Theme: Presentation/DesignSystem/Theme/ThemeTokens.swift (Smoky Quartz,
 *   the desktop's theme, synced to the phone); DesignTokens.swift;
 *   Typography.swift Role.
 * - Pairing: relay only (AppConfiguration.swift:58-68; legacy LAN pairings
 *   purged, SecurityManager.swift:20-26).
 *
 * Code vs plan / notes:
 * - The plan says "a System Threads row ('See All')": it is a section header
 *   with a "2 running" chip and See All over a horizontal carousel of cards.
 * - Timestamps are absolute ("10:44 AM", "Yesterday"), as ThreadTimestamp
 *   formats them, not relative like the desktop figures.
 * - The `.searchable` "Find agents" field is not drawn: on iOS 26 its place
 *   (under the title, or in the bottom toolbar) is decided by the system.
 *
 * Calibrate: iOS 26 Liquid Glass tab bar and toolbar button (approximated as
 * a translucent capsule / circle); system font metrics; the static spinner.
 */

const SCALE = 0.72;
const FRAME_W = PHONE.width + 20;
const FRAME_H = PHONE.height + 20;
const PHONE_X = 80;
const PAD_Y = 20;

const TABS = [
  { title: "Agents", icon: "person.2.fill" },
  { title: "Routines", icon: "point.3.filled.connected.trianglepath.dotted" },
  { title: "Activity", icon: "bolt.fill" },
  { title: "Organization", icon: "building.2.fill" },
  { title: "Settings", icon: "gearshape.fill" },
] as const;

function AgentsTab() {
  const research = DEMO.agents.research;
  const chat = DEMO.spotlightChat;
  const other = DEMO.mobile.otherThread;
  const steps = DEMO.routine.steps;
  return (
    <PhoneFrame>
      <IOSStatusBar time="10:45" />
      <IOSLargeTitle title="Agents" trailingIcon="clock.arrow.circlepath" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <MobileSectionHeader count={2} title="Recent Threads" />
          <ThreadCarousel>
            <RecentThreadCard agent={research.name} preview={chat.agent} time={chat.agentTime} title={chat.title} />
            <RecentThreadCard agent={other.agent} preview={other.preview} time={other.time} title={other.title} />
          </ThreadCarousel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <MobileSectionHeader
            accessory={
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MobileChip label="2 running" tint={M.accent} />
                <span style={{ fontSize: 13, lineHeight: "44px", fontWeight: 600, color: M.accent }}>See All</span>
              </span>
            }
            title="System Threads"
          />
          <ThreadCarousel>
            <SystemThreadCard
              agent={research.name}
              status="Working"
              summary="Searching web"
              time={DEMO.mobile.systemTime}
              title={`${DEMO.subRoutine.name} · ${DEMO.subRoutine.steps[0]}`}
            />
            <SystemThreadCard
              agent={research.name}
              status="Waiting for agents"
              summary="Waiting for 1 child agent"
              time={DEMO.mobile.systemTime}
              title={`${DEMO.routine.name} · ${steps[1]}`}
            />
          </ThreadCarousel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <MobileSectionHeader count={2} expanded title={research.department} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <MobileAgentCard current description={DEMO.mobile.agentDescriptions.research} dot={M.accent} name={research.name} threads={2} />
            <MobileAgentCard description={DEMO.mobile.agentDescriptions.writer} dot={M.text2} name={DEMO.agents.writer.name} threads={1} />
          </div>
        </div>
      </div>
      <IOSTabBar selected="Agents" tabs={[...TABS]} />
    </PhoneFrame>
  );
}

/** Content y (in phone points, from the frame's top) → figure y. */
const fy = (y: number) => PAD_Y + y * SCALE;
const TIP_X = PHONE_X + FRAME_W * SCALE + 6;

function MobileCompanionHome() {
  return (
    <div style={{ position: "relative", height: FRAME_H * SCALE + PAD_Y * 2 }}>
      <Miniature height={FRAME_H} scale={SCALE} style={{ position: "absolute", left: PHONE_X, top: PAD_Y }} width={FRAME_W}>
        <AgentsTab />
      </Miniature>
      <Callout pointer="left" x={TIP_X} y={fy(238)}>
        Your conversations
      </Callout>
      <Callout pointer="left" x={TIP_X} y={fy(430)}>
        Routine work on the Mac
      </Callout>
      <Callout pointer="left" x={TIP_X} y={fy(680)}>
        Agents by department
      </Callout>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "mobile-companion-home",
  width: 640,
  radius: 16,
  label: `The Toone iPhone companion on its Agents tab. Under the large title Agents: Recent Threads with your conversation ${DEMO.spotlightChat.title} with ${DEMO.agents.research.name}; System Threads with a 2 running chip and See All, showing two working threads of ${DEMO.routine.name}; then the Growth department with ${DEMO.agents.research.name}, marked Current, and ${DEMO.agents.writer.name}. A tab bar at the bottom reads Agents, Routines, Activity, Organization and Settings.`,
  caption: "The iPhone companion's Agents tab: your recent threads, the routine work running on your Mac, and your agents.",
  Component: MobileCompanionHome,
};
