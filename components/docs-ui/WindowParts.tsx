import { Button } from "./Button";
import { ChatBubble, ChatComposer, ChatMessage, ChatMeta, ChatTranscript } from "./Chat";
import { DEMO } from "./demo";
import { DestinationHeader } from "./DestinationHeader";
import { Field } from "./Field";
import { Glyph } from "./glyphs";
import { GraphCanvas } from "./graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "./graph/GraphContainer";
import { ID, researchBriefGraph } from "./graph/researchBrief";
import { NavRail, RAIL_ITEMS, type NavRailItem } from "./NavRail";
import { PanelHeader } from "./PanelHeader";
import { BrowserHeader, DisclosureHeader, FILE_ICON_COLOR, FileTree } from "./ProjectExplorer";
import { RailThreads } from "./RailThreads";
import {
  RoutineControlsRow,
  RoutineFamilyCard,
  RoutineHistoryHeader,
  RoutineList,
  RoutineRow,
  RoutineScrollArea,
  RoutineSectionHeading,
  RoutineSidebar,
  RoutineSidebarSwitcher,
  RunRow,
} from "./RoutineSidebar";
import { WorkspaceStrip } from "./WorkspaceStrip";

/*
 * Whole-panel contents for the schematic / composite figures (batch F),
 * drawn at the app's real point sizes so <Miniature> can scale a full
 * screen of them into a figure. Every panel shows the demo story at the
 * same moment: Run #3 of the research-brief routine is running while you
 * chat with Research Assistant in the acme.com growth project.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - Chat panel: UI/Layout/LeftOrchestratorView.swift:727-734 (strip +
 *   separator), :891-929 (rail + divider + destination), :1364-1444
 *   (destination header), :2517-3211 (rail; System Threads badge = active
 *   system threads, 2 while Run #3 and its sub-routine work), :3229-3482
 *   (recent strip); composer ChatPanelView.swift:2421-2596. Same parts and
 *   strings as scenes/spotlight-chat-panel.tsx.
 * - Routines panel: Features/Organization/Views/RoutineCreatorPanelView.swift
 *   :178-191 (header / Divider / workspaceToolbar / Divider / sidebar +
 *   Divider + workspace), :398-451 (header: point.3.connected… in the
 *   accent, "Routines" headline, "Published · <cadence>", plus, xmark),
 *   :453-479 (toolbar: sidebar.left, then the selected routine's actions),
 *   :481-517 (sidebar ideal width 285, inner .18), :667-760 (actions while
 *   a run is live: RoutineRunControlsView Pause / Cancel run, then Setup,
 *   Babysit, Edit, Delete, all bordered small), :809-831 (graph, padding
 *   18). Sidebar rows as scenes/routines-list-running.tsx; the running
 *   routine is selected (selectRunningRoutineIfNeeded, :203), so its run
 *   controls live in the toolbar, not on the run row.
 * - Project Explorer: UI/Layout/RightProjectPanelView.swift:35-91, :156-200;
 *   tree as scenes/project-explorer-tree.tsx.
 *
 * Simplified on purpose (each figure scales these to ~0.44, where they read
 * as shape, not text): the Routines workspace's definition preview under
 * the graph and the toolbar's "Add to Bundle" menu are not drawn.
 */

const RAIL_WITH_THREADS: NavRailItem[] = RAIL_ITEMS.map((item) =>
  item.id === "recentThreads"
    ? { id: "recentThreads", kind: "custom", node: <RailThreads threads={[{ state: "selected" }, {}]} /> }
    : item,
);

const SEPARATOR = <div style={{ height: 1, flex: "none", background: "var(--tu-sep)" }} />;

/** Left (chat) panel: project strip, rail, destination header, transcript, composer. */
export function ChatPanelContent({
  transcriptAlign = "top",
  recentThreads = true,
}: {
  /** "bottom" when the transcript is scrolled to its end (short panels). */
  transcriptAlign?: "top" | "bottom";
  /** Show the rail's recent-conversation strip (0 slots in a short panel). */
  recentThreads?: boolean;
}) {
  const chat = DEMO.spotlightChat;
  const agent = DEMO.agents.research;
  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
      <WorkspaceStrip
        pills={[
          { index: 1, name: DEMO.projects[0], active: true },
          { index: 2, name: DEMO.projects[1] },
          { index: 3, name: DEMO.projects[2] },
        ]}
      />
      {SEPARATOR}
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex" }}>
        <NavRail
          badges={{ systemThreads: 2 }}
          items={recentThreads ? RAIL_WITH_THREADS : RAIL_ITEMS}
          selected="conversations"
          style={{ overflow: "hidden" }}
        />
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <DestinationHeader
            actions={
              <>
                <Button icon="doc.on.doc" iconSize={15} variant="icon" />
                <Button icon="xmark" iconSize={15} variant="icon" />
              </>
            }
            subtitle={`${agent.name} · ${agent.department}`}
            title={chat.title}
          />
          <div
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: transcriptAlign === "bottom" ? "flex-end" : "flex-start",
            }}
          >
            <ChatTranscript style={{ flex: "none" }}>
              <ChatMessage meta={<ChatMeta side="user" time={chat.userTime} />} side="user">
                <ChatBubble side="user">{chat.user}</ChatBubble>
              </ChatMessage>
              <ChatMessage meta={<ChatMeta side="agent" time={chat.agentTime} />} side="agent">
                <ChatBubble side="agent">{chat.agent}</ChatBubble>
              </ChatMessage>
            </ChatTranscript>
          </div>
          <ChatComposer chip={chat.chip} />
        </div>
      </div>
    </div>
  );
}

const SIDEBAR_W = 285;
const WORKSPACE_PAD = 18;
const GRAPH_H = 460;

/** Middle panel: Routines, with the running routine selected and its graph. */
export function RoutinesPanelContent({ width }: { width: number }) {
  const steps = DEMO.routine.steps;
  const graph = researchBriefGraph({
    showInputs: false,
    showArtefacts: false,
    runState: { [ID.routine]: "running", [ID.step(2)]: "running", [ID.subRoutine]: "running" },
  });
  const canvasW = width - SIDEBAR_W - 1 - WORKSPACE_PAD * 2;
  const canvasH = GRAPH_H - 52;
  // Zoomed onto the live part of the graph (step 2 and its sub-routine), the
  // way "Focus selection" frames it, rather than fit-to-view, where 13pt
  // labels shrink to ~3pt in a 337pt-wide workspace.
  const zoom = 0.7;
  const node = (id: string) => graph.nodes.find((n) => n.id === id)!;
  const step2 = node(ID.step(2));
  const sub = node(ID.subRoutine);
  const pan = {
    x: -((step2.x - step2.w / 2 + (sub.x + sub.w / 2)) / 2) * zoom,
    y: -((step2.y + sub.y) / 2) * zoom,
  };
  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14 }}>
        <Glyph color="var(--tu-accent)" name="point.3.connected.trianglepath.dotted" size={15} />
        <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, lineHeight: "16px", fontWeight: 700, color: "var(--tu-label-1)" }}>Routines</span>
          <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>
            Published · {DEMO.otherRoutines.launchSites.cadence}
          </span>
        </span>
        <span style={{ flex: 1 }} />
        <Button icon="plus" variant="icon" />
        <Button icon="xmark" iconSize={11} variant="icon" />
      </div>
      {SEPARATOR}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "color-mix(in srgb, var(--tu-inner) 25%, transparent)",
          overflow: "hidden",
        }}
      >
        <Button icon="sidebar.left" variant="icon" />
        <span style={{ flex: 1 }} />
        <Button icon="pause.fill" label="Pause" variant="bordered" />
        <Button icon="stop.fill" label="Cancel run" variant="bordered" />
        <Button icon="slider.horizontal.3" label="Setup" variant="bordered" />
        <Button icon="eye" label="Babysit" variant="bordered" />
        <Button icon="square.and.pencil" label="Edit" variant="bordered" />
        <Button disabled icon="trash" label="Delete" variant="bordered" />
      </div>
      {SEPARATOR}
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex" }}>
        <RoutineSidebar width={SIDEBAR_W}>
          <RoutineSidebarSwitcher selected="Routines" />
          <RoutineScrollArea>
            <RoutineControlsRow placeholder="Search routines" />
            <RoutineList>
              <RoutineSectionHeading count={1} kind="running" title="Running" />
              <RoutineFamilyCard>
                <RoutineRow
                  expanded
                  historyCount={DEMO.run.number}
                  isOn
                  name={DEMO.routine.name}
                  pill={{ label: "Running", tone: "accent" }}
                  selected
                />
                <RoutineRow isSub level={1} name={DEMO.subRoutine.name} />
                <RoutineHistoryHeader />
                <RunRow
                  age={DEMO.run.started}
                  expanded
                  meta="Manual · running 2 min"
                  number={DEMO.run.number}
                  pill={{ label: "Running", tone: "accent" }}
                  stages={[
                    { title: steps[0], phase: "succeeded" },
                    { title: steps[1], phase: "running" },
                    { title: steps[2], phase: "pending" },
                    { title: steps[3], phase: "pending" },
                  ]}
                  summary={steps[1]}
                />
              </RoutineFamilyCard>
              <RoutineSectionHeading count={2} style={{ marginTop: 8 }} title="Routines" />
              <RoutineFamilyCard>
                <RoutineRow
                  expanded={false}
                  historyCount={6}
                  isOn
                  name={DEMO.otherRoutines.digest.name}
                  pill={{ label: DEMO.otherRoutines.digest.cadence, tone: "neutral" }}
                />
              </RoutineFamilyCard>
              <RoutineFamilyCard>
                <RoutineRow expanded={false} name={DEMO.otherRoutines.launchSites.name} />
              </RoutineFamilyCard>
            </RoutineList>
          </RoutineScrollArea>
        </RoutineSidebar>
        <div style={{ width: 1, flex: "none", background: "var(--tu-sep)" }} />
        <div style={{ flex: "1 1 auto", minWidth: 0, padding: WORKSPACE_PAD, overflow: "hidden" }}>
          <GraphContainer
            toolbar={
              <GraphToolbar
                chips={{ runSetup: false, artefacts: false, steps: true }}
                clipAfter="runSetup"
                hasSelection={false}
                published
                status={{ summary: `Running · ${DEMO.subRoutine.name}` }}
                summary={pipelineSummary({ steps: 4, subRoutines: 1, runValues: 1, resources: 0, artefacts: 1 })}
              />
            }
          >
            <GraphCanvas
              graph={graph}
              height={canvasH}
              width={canvasW}
              pan={pan}
              zoom={zoom}
            />
          </GraphContainer>
        </div>
      </div>
    </div>
  );
}

/** Right panel: Project Explorer on the demo project, the fresh brief marked. */
export function ProjectPanelContent() {
  const [, briefFile] = DEMO.artefact.split("/");
  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}>
      <PanelHeader
        icon="folder"
        title="Project Explorer"
        trailing={
          <>
            <Button icon="folder.badge.plus" iconSize={15} variant="icon" />
            <Button icon="sidebar.right" iconSize={15} variant="icon" />
          </>
        }
      />
      {SEPARATOR}
      <DisclosureHeader expanded={false} icon="building.2" title="Organization" />
      {SEPARATOR}
      <DisclosureHeader expanded icon="folder" title="Project" />
      <BrowserHeader title={DEMO.activeProject} />
      <div style={{ padding: "0 16px 8px" }}>
        <Field placeholder="Search files" />
      </div>
      <FileTree
        rows={[
          {
            title: DEMO.activeProject,
            icon: "folder.badge.gearshape",
            iconColor: FILE_ICON_COLOR.accent,
            level: 0,
            directory: true,
            expanded: true,
          },
          { title: "Toone", icon: "square.stack.3d.up.fill", iconColor: FILE_ICON_COLOR.accent, level: 1, directory: true },
          { title: "briefs", icon: "folder.fill", iconColor: FILE_ICON_COLOR.yellow, level: 1, directory: true, expanded: true },
          { title: briefFile, icon: "doc.text", iconColor: FILE_ICON_COLOR.gray, level: 2, badge: "fresh" },
          { title: "notes.md", icon: "doc.text", iconColor: FILE_ICON_COLOR.gray, level: 1 },
          { title: "README.md", icon: "doc.text", iconColor: FILE_ICON_COLOR.gray, level: 1 },
        ]}
      />
    </div>
  );
}

/**
 * Another application's document window, as neutral grey placeholder shapes
 * (title bar with grey window buttons, a heading and paragraph lines). Not a
 * Toone surface, so it carries no app tokens beyond neutral greys.
 */
export function GenericAppWindow({ rect }: { rect: { x: number; y: number; w: number; h: number } }) {
  const LINES: [string, number, number][] = [
    ["38%", 26, 0], ["92%", 14, 18], ["86%", 14, 18], ["90%", 14, 18], ["64%", 14, 18],
    ["88%", 14, 44], ["94%", 14, 18], ["82%", 14, 18], ["90%", 14, 18], ["58%", 14, 18],
    ["91%", 14, 44], ["85%", 14, 18], ["70%", 14, 18],
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: 16,
        overflow: "hidden",
        background: "#3a3a3d",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 12px 32px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div style={{ height: 52, display: "flex", alignItems: "center", gap: 9, padding: "0 20px", background: "#333336" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: "#58585c" }} />
        ))}
      </div>
      <div style={{ padding: "48px 120px" }}>
        {LINES.map(([w, h, mt], i) => (
          <span key={i} style={{ display: "block", width: w, height: h, marginTop: mt, borderRadius: h / 2, background: "#5a5a5e" }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Zen Mode's ambient video as a still, flat warm-grey stand-in in the style
 * of zen-video-grid's thumbnails ("Mountain Wilds"), not the bundled frame.
 * 16:10, so it fills a 1440 × 900 screen without distortion.
 */
export function ZenBackdrop() {
  return (
    <svg aria-hidden="true" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "100%" }} viewBox="0 0 160 100">
      <defs>
        <linearGradient id="zen-schematic-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#918b83" />
          <stop offset="1" stopColor="#64605b" />
        </linearGradient>
      </defs>
      <rect fill="url(#zen-schematic-sky)" height="100" width="160" />
      <path d="M0 72 L34 40 L54 56 L84 26 L118 62 L138 48 L160 62 L160 100 L0 100 Z" fill="#4a4845" />
      <path d="M0 86 L40 68 L80 80 L120 70 L160 84 L160 100 L0 100 Z" fill="#383634" />
    </svg>
  );
}
