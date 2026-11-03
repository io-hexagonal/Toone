import { AutoFixTile } from "../AutoFixTile";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import {
  InspectorHeader,
  InspectorPreview,
  InspectorRow,
  InspectorSection,
  InspectorSubheadline,
  InspectorSummaryCard,
  InspectorTile,
  MetaTile,
  MetaTileGrid,
  TileLabel,
} from "../InspectorCard";
import type { SceneDefinition } from "../scene";

/**
 * The published routine's inspector with nothing selected in the graph
 * (Routines tab): "Routine definition", the summary card (purpose, the
 * metadata tiles, Bundles, Model, Auto-fix on Suggest), "Run setup" with
 * the Topic run value and "Artefacts" with the brief. Cropped above "Agent
 * handoffs".
 *
 * Drawn at MAGNIFY × the app's points (10pt captions ≥11px at the guide
 * column). CALIBRATE: the Auto-fix segmented control and the borderless
 * "Add to Bundle" menu (native).
 */

const W = 580;
const MAGNIFY = 1.1;

function RoutineDefinitionCard() {
  return (
    <div style={{ zoom: MAGNIFY, width: W, padding: 18 }}>
      <InspectorPreview>
        <InspectorHeader discuss={false} title="Routine definition" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InspectorSummaryCard
            text="Turn a topic about acme.com's market into a brief with a summary, the evidence, open uncertainties and next steps."
            title={DEMO.routine.name}
          >
            <MetaTileGrid minimum={150}>
              <MetaTile icon="building.2" label="Department" value="growth" />
              <MetaTile icon="person" label="Owner" value={DEMO.routine.owner} />
              <MetaTile icon="calendar" label="Schedule" value="On demand" />
            </MetaTileGrid>
            <InspectorTile style={{ alignSelf: "stretch", gap: 6 }}>
              <TileLabel icon="square.stack.3d.up">Bundles</TileLabel>
              <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 12, lineHeight: "15px", color: "var(--tu-label-2)" }}>Not in a bundle</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, lineHeight: "13px", color: "var(--tu-label-1)" }}>
                  Add to Bundle
                  <Glyph color="var(--tu-label-2)" name="chevron.down" size={7} weight="bold" />
                </span>
              </span>
            </InspectorTile>
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
              <MetaTile icon="cpu" label="Model" value={DEMO.routine.model} />
            </div>
            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
              <AutoFixTile mode="suggest" />
            </div>
          </InspectorSummaryCard>
          <InspectorSection title="Run setup">
            <InspectorSubheadline>Run values</InspectorSubheadline>
            <InspectorRow detail="Asked before each run" icon="tray.and.arrow.down" scope title="Topic" />
          </InspectorSection>
          <InspectorSection title="Artefacts">
            <InspectorRow detail="briefs/research-brief.md · markdown" icon="doc" scope title="Research brief" />
          </InspectorSection>
        </div>
      </InspectorPreview>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "routine-definition-card",
  width: Math.round(W * MAGNIFY),
  radius: 16,
  label: `The inspector of the published routine ${DEMO.routine.name}: its purpose, department growth, owner ${DEMO.routine.owner}, schedule on demand, model ${DEMO.routine.model} and Auto-fix on Suggest. Run setup lists one run value, Topic, asked before each run. Artefacts lists the Research brief, saved as briefs/research-brief.md in markdown.`,
  caption: "The routine's definition: who owns it, what it takes in and what it leaves behind.",
  Component: RoutineDefinitionCard,
};
