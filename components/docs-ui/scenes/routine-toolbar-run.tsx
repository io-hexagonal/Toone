import { DEMO } from "../demo";
import { GraphCanvas, fitZoom } from "../graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { researchBriefGraph } from "../graph/researchBrief";
import { PanelDivider, RoutinesPanelHeader, RoutinesToolbar, ToolbarButton } from "../RoutinesPanelChrome";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel on the Routines tab with the published demo routine
 * selected (routine sidebar hidden): the header "Routines" / "Published · On
 * demand" and the workspace toolbar with the routine's actions, Run first.
 * Under it, the top of the published graph ("Routine pipeline").
 *
 * Sources (RCP = APP/Features/Organization/Views/RoutineCreatorPanelView.swift):
 * - header RCP:398-450 ("Published · \(cadence.displayName)");
 * - toolbar RCP:452-480; publishedRoutineActions RCP:654-750 (HStack spacing
 *   8, controlSize .small): "Run" play.fill .borderedProminent (help: the
 *   admission message, else "Run routine"); "Setup" slider.horizontal.3,
 *   "Babysit" eye, "Edit" square.and.pencil, all .bordered; the add-to-bundle
 *   Menu RCP:3107-3134 (Label "Add to Bundle" rectangle.stack.badge.plus,
 *   .menuStyle(.button) .bordered; icon-only when the toolbar is narrow);
 *   "Delete" trash .bordered role .destructive;
 * - published graph RCP:809-830 (ScrollView, VStack spacing 18, padding 18),
 *   container + toolbar via GraphKit ("Routine pipeline").
 *
 * Code vs plan: no hover help tag on Run. Its `.help` is
 * `admission?.message ?? "Run routine"`, and with the runtime present the
 * admission exists: an admitted routine reads "The routine passed family,
 * ownership, input, skill, and plan admission."
 * (RoutineInvocationEnvelope.swift:28-45), not "Run routine". A missing
 * topic is not an admission failure (AgentSessionManager.swift:17931-17935).
 * The tag is left out rather than drawn with that internal wording.
 * Per-run inputs (the topic) are asked in
 * the run's thread after Run (RCP:2441), so no input sheet is drawn.
 * Not drawn: the optional `routine-toolbar-setup` state (orange
 * "Continue setup" in place of Run, RCP:684-693).
 *
 * Drawn at MAGNIFY × the app's points so the 10–11pt labels stay ≥11px at
 * the guide column. CALIBRATE: the small bordered / borderedProminent
 * buttons, the menu button's indicator and the destructive label colour
 * (all native).
 */

const PANEL_W = 580;
const MAGNIFY = 1.1;
const CANVAS_W = PANEL_W - 36;

const graph = researchBriefGraph({ showInputs: true, showArtefacts: false });

function RoutineToolbarRun() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, display: "flex", flexDirection: "column" }}>
      <RoutinesPanelHeader subtitle="Published · On demand" />
      <PanelDivider />
      <RoutinesToolbar>
        <ToolbarButton icon="play.fill" label="Run" prominent />
        <ToolbarButton icon="slider.horizontal.3" label="Setup" />
        <ToolbarButton icon="eye" label="Babysit" />
        <ToolbarButton icon="square.and.pencil" label="Edit" />
        <ToolbarButton icon="rectangle.stack.badge.plus" label="Add to Bundle" menu />
        <ToolbarButton destructive icon="trash" label="Delete" />
      </RoutinesToolbar>
      <PanelDivider />
      {/* the published graph, cropped under its toolbar */}
      <div style={{ padding: "18px 18px 0", height: 84, overflow: "hidden" }}>
        <GraphContainer
          toolbar={
            <GraphToolbar
              chips={{ runSetup: true, artefacts: false, steps: true }}
              clipAfter="steps"
              hasSelection={false}
              published
              summary={pipelineSummary({ steps: 4, subRoutines: 1, runValues: 1, resources: 0, artefacts: 1 })}
            />
          }
        >
          <GraphCanvas graph={graph} height={300} width={CANVAS_W} zoom={fitZoom(graph, CANVAS_W, 300)} />
        </GraphContainer>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "routine-toolbar-run",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The Routines panel with the published routine ${DEMO.routine.name} selected. The header reads Routines, Published · On demand. The toolbar shows Run, then Setup, Babysit, Edit, Add to Bundle and Delete.`,
  caption: "Select a published routine and press Run. The routine asks for its topic in the run's thread.",
  Component: RoutineToolbarRun,
};
