import { ConversationRow, ConversationSection, ConversationsDestination } from "../ConversationRow";
import { DEMO } from "../demo";
import { NavRail, RAIL_ITEMS, type NavRailItem } from "../NavRail";
import { RailThreads } from "../RailThreads";
import type { SceneDefinition } from "../scene";

/**
 * The left panel on Conversations: every chat you had in this project, one
 * pinned and three recent, with the Active / Archived switch above them.
 * The rail's recent strip (two chats) sits under the Conversations button.
 *
 * CALIBRATE: the native segmented control. Drawn at MAGNIFY × the app's
 * points (caption2 stays legible).
 */

const PANEL_W = 380;
const HEIGHT = 412;
const MAGNIFY = 1.15;

const ITEMS: NavRailItem[] = RAIL_ITEMS.map((item) =>
  item.id === "recentThreads"
    ? { id: "recentThreads", kind: "custom", node: <RailThreads threads={[{ dot: "unseen" }, {}]} /> }
    : item,
);

function ConversationsDirectory() {
  const { research, launch, writer } = DEMO.agents;
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, height: HEIGHT, display: "flex", overflow: "hidden" }}>
      <NavRail items={ITEMS} selected="conversations" />
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <ConversationsDestination>
          <ConversationSection title="Pinned" />
          <ConversationRow
            thread={{
              title: "Weekly digest notes",
              time: "yesterday",
              agent: writer.name,
              department: writer.department,
              author: "You",
              preview: "Keep the digest under 200 words.",
              pinned: true,
            }}
          />
          <ConversationSection title="Recent" />
          <ConversationRow
            thread={{
              title: DEMO.spotlightChat.title,
              time: "2 minutes ago",
              agent: research.name,
              department: research.department,
              author: research.name,
              preview: DEMO.spotlightChat.agent,
              dot: "unseen",
            }}
          />
          <ConversationRow
            thread={{
              title: DEMO.routine.name,
              time: "1 hour ago",
              agent: research.name,
              department: research.department,
              author: research.name,
              preview: "The routine is saved as a draft with four steps.",
            }}
          />
          <ConversationRow
            thread={{
              title: "Plan the launch week",
              time: "3 hours ago",
              agent: launch.name,
              department: launch.department,
              author: "You",
              preview: "Draft the launch week plan.",
            }}
          />
        </ConversationsDestination>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "conversations-directory",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The left panel on Conversations with a search field and an Active / Archived switch set to Active. Pinned: Weekly digest notes with ${DEMO.agents.writer.name}, yesterday. Recent: ${DEMO.spotlightChat.title} with ${DEMO.agents.research.name}, 2 minutes ago, with a green dot for an unread reply; ${DEMO.routine.name} with ${DEMO.agents.research.name}, 1 hour ago; Plan the launch week with ${DEMO.agents.launch.name}, 3 hours ago.`,
  caption: "Conversations lists every chat in the project. Pin the ones you return to; archive the rest.",
  Component: ConversationsDirectory,
};
