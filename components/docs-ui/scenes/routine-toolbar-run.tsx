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
              summary={pipelineSummary({ steps: 4, subRoutines: 1 })}
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
  label: `The Routines panel with the published routine ${DEMO.routine.name} selected. The header reads Routines, Published · On demand. The toolbar shows Run, then Setup, Edit, Add to Bundle and Delete.`,
  caption: "Select a published routine and press Run. The routine asks for its topic in the run's thread.",
  Component: RoutineToolbarRun,
};
