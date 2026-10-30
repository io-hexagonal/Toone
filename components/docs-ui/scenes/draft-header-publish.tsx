import { Button } from "../Button";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import { GraphCanvas } from "../graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { ID, researchBriefGraph } from "../graph/researchBrief";
import { RoutineFamilyCard, RoutineScheduleDot, RoutineSidebar, RoutineSidebarSwitcher, SidebarPill } from "../RoutineSidebar";
import { PanelDivider, RoutinesPanelHeader, RoutinesToolbar, ToolbarIcon } from "../RoutinesPanelChrome";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel on the Drafts tab, top-left crop: the header with the
 * draft's status "Draft · revision 2", `+` and close; the workspace toolbar
 * with the draft actions ending on the prominent Publish; the routine
 * sidebar with the Drafts capsule selected and the demo routine's draft
 * card expanded (its sub-draft "Investigate a topic" inside); the top of the
 * draft graph on the right.
 *
 * Sources (RCP = APP/Features/Organization/Views/RoutineCreatorPanelView.swift):
 * - header RCP:398-450, status RCP:3264-3271; toolbar RCP:452-480;
 *   draftActions RCP:752-807 ("Focus conversation"
 *   bubble.left.and.text.bubble.right .bordered small; diagnostics
 *   exclamationmark.triangle 13 semibold, secondary with no findings
 *   RCP:833-862; add sub-routine point.3.filled.connected.trianglepath.dotted
 *   and discard trash as icon buttons; "Publish" paperplane.fill
 *   .borderedProminent small);
 * - sidebar RCP:482-521 (switcher padding 8, Divider, width 225…320,
 *   innerBackground @0.18), switcher RCP:523-561, draftSidebar RCP:563-580
 *   (LazyVStack spacing 5, padding 8), draftGroupRows RCP:597-640 (family
 *   card), draftTab RCP:975-1071 (row anatomy below);
 * - creator RCP:1082-1095 (padding 18) and the graph container (GraphKit),
 *   scrolled so the container's toolbar sits above the crop: at this panel
 *   width its horizontal ScrollView would clip the summary mid-word.
 *
 * draftTab (root): HStack spacing 4: disclosure chevron .caption tertiary in
 * a 14pt column; then the button label HStack spacing 4: RoutineScheduleDot
 * (off = "Not published"), doc.text .body accent in 16pt, name .body,
 * Spacer, RoutineStatusPill(status.rawValue, neutral); label padding v3 h5,
 * min-h 28, selected accent @0.16 r8; row padding v4 h8.
 * Child (depth 1): no disclosure column; arrow.turn.down.right .caption2
 * tertiary in 6pt, doc.text .callout, name .callout, no pill; label padding
 * v2 h5, min-h 24; row padding leading 16, v1, h8.
 *
 * Code vs plan: the draft card's pill shows the raw status, "drafting"
 * (lowercase), not "Draft". The `+`'s help tag "Create a new routine draft"
 * is not drawn: the figure's state is the Publish button.
 *
 * Drawn at MAGNIFY × the app's points (10pt captions ≥11px at the guide
 * column). CALIBRATE: the small bordered / borderedProminent buttons (native).
 */

const PANEL_W = 580;
const SIDEBAR_W = 285;
const MAGNIFY = 1.1;
const BODY_H = 140;
const CANVAS_W = PANEL_W - SIDEBAR_W - 1 - 36;

const graph = researchBriefGraph({ showInputs: true, showArtefacts: false });
const routineCard = graph.nodes.find((n) => n.id === ID.routine)!;
const inputCard = graph.nodes.find((n) => n.id === ID.input)!;
const GRAPH_ZOOM = 0.9;
const CANVAS_H = 300;
/** How far the creator is scrolled: past the container's toolbar (≈52) and a strip of canvas. */
const SCROLL = 52 + 60;
// Pan so the first column (Topic input over the routine card) sits at the
// canvas's left, centred in the visible strip under the toolbar.
const VISIBLE_MID = SCROLL - 52 + BODY_H / 2 + 4;
const PAN = {
  x: -routineCard.x * GRAPH_ZOOM - CANVAS_W / 2 + 100,
  y: -((inputCard.y + routineCard.y) / 2) * GRAPH_ZOOM - CANVAS_H / 2 + VISIBLE_MID,
};

function DraftRow({ name, root, selected }: { name: string; root: boolean; selected?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: root ? "4px 8px" : "1px 8px 1px 24px" }}>
      {root ? (
        <span style={{ display: "inline-flex", justifyContent: "center", width: 14, color: "var(--tu-text-3)" }}>
          <Glyph name="chevron.down" size={9} weight="bold" />
        </span>
      ) : null}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flex: "1 1 auto",
          minWidth: 0,
          minHeight: root ? 28 : 24,
          padding: root ? "3px 5px" : "2px 5px",
          borderRadius: 8,
          background: selected ? "color-mix(in srgb, var(--tu-accent) 16%, transparent)" : undefined,
        }}
      >
        {root ? (
          <RoutineScheduleDot isOn={false} />
        ) : (
          <span style={{ display: "inline-flex", justifyContent: "center", width: 6, overflow: "visible", color: "var(--tu-text-3)" }}>
            <Glyph name="arrow.turn.down.right" size={10} weight="medium" />
          </span>
        )}
        <span style={{ display: "inline-flex", justifyContent: "center", width: 16, color: "var(--tu-accent)" }}>
          <Glyph name="doc.text" size={root ? 14.5 : 13} />
        </span>
        <span
          style={{
            flex: "0 1 auto",
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontSize: root ? 13 : 12,
            lineHeight: root ? "16px" : "15px",
            color: "var(--tu-text-1)",
          }}
        >
          {name}
        </span>
        {root ? (
          <span style={{ marginLeft: "auto", paddingLeft: 4, display: "inline-flex", flex: "none" }}>
            <SidebarPill label="drafting" tone="neutral" />
          </span>
        ) : null}
      </span>
    </div>
  );
}

function DraftHeaderPublish() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, display: "flex", flexDirection: "column" }}>
      <RoutinesPanelHeader subtitle="Draft · revision 2" />
      <PanelDivider />
      <RoutinesToolbar>
        <Button icon="bubble.left.and.text.bubble.right" iconSize={12} label="Focus conversation" variant="bordered" />
        <ToolbarIcon color="var(--tu-label-2)" icon="exclamationmark.triangle" weight="semibold" />
        <ToolbarIcon icon="point.3.filled.connected.trianglepath.dotted" />
        <ToolbarIcon icon="trash" />
        <Button
          icon="paperplane.fill"
          iconSize={11}
          label="Publish"
          style={{ height: 22, padding: "0 8px", borderRadius: 6, fontSize: 11, gap: 4 }}
          variant="prominent"
        />
      </RoutinesToolbar>
      <PanelDivider />
      <div style={{ display: "flex", height: BODY_H, overflow: "hidden" }}>
        <div style={{ display: "flex", flex: "none" }}>
          <RoutineSidebar width={SIDEBAR_W}>
            <RoutineSidebarSwitcher selected="Drafts" />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: 8, flex: "1 1 auto" }}>
              <RoutineFamilyCard>
                <DraftRow name={DEMO.routine.name} root selected />
                <DraftRow name={DEMO.subRoutine.name} root={false} />
              </RoutineFamilyCard>
            </div>
          </RoutineSidebar>
        </div>
        <div style={{ width: 1, flex: "none", background: "var(--tu-sep)" }} />
        {/* the creator, scrolled a little: the graph container's toolbar is above the fold */}
        <div style={{ padding: "0 18px", flex: "1 1 auto", minWidth: 0, overflow: "hidden" }}>
          <div style={{ marginTop: -SCROLL }}>
            <GraphContainer
              toolbar={
                <GraphToolbar
                  chips={{ runSetup: true, artefacts: false, steps: true }}
                  clipAfter="runSetup"
                  hasSelection={false}
                  published={false}
                  summary={pipelineSummary({ steps: 4, subRoutines: 1, runValues: 1, resources: 0, artefacts: 1 })}
                />
              }
            >
              <GraphCanvas graph={graph} height={CANVAS_H} pan={PAN} width={CANVAS_W} zoom={GRAPH_ZOOM} />
            </GraphContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "draft-header-publish",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The Routines panel on its Drafts tab. The header reads Routines, Draft · revision 2, with a plus button for a new draft. The toolbar ends with a Publish button. The sidebar lists the draft ${DEMO.routine.name}, status drafting, with its sub-routine draft ${DEMO.subRoutine.name}.`,
  caption: "Drafts live in the Routines panel's Drafts tab. Publish turns the draft into a routine the project can run.",
  Component: DraftHeaderPublish,
};
