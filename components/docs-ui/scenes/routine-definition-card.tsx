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
 * Sources (RCP = APP/Features/Organization/Views/RoutineCreatorPanelView.swift):
 * - definitionPreview RCP:1144-1171: no "Discuss with agent" for a published
 *   routine (RCP:1149);
 * - routineDefinitionPreview RCP:1173-1243: card VStack spacing 10 (name
 *   .title3 semibold, purpose .callout .secondary, LazyVGrid adaptive(150)
 *   of Department building.2 / Owner person / Cadence calendar / Trigger
 *   bolt (nil → "On demand") / Proceed arrow.right.circle (nil →
 *   "Organization default"); bundlesLine; Model cpu tile; Auto-fix tile);
 * - bundlesLine RCP:3139-3200 (Label "Bundles" square.stack.3d.up .caption
 *   .secondary; FlowLayout spacing 6: "Not in a bundle" .callout .secondary
 *   and the borderless "Add to Bundle" menu .caption; padding 9, inner .42,
 *   r8, separator);
 * - metadata RCP:2159-2203, previewSection / previewRow RCP:2205-2298,
 *   setupInputRows RCP:2005-2030 (group title .subheadline semibold "Run
 *   values"; title = description, detail = source · type · requirement ·
 *   path, RoutineInputPresentation.swift:67-71), artefact rows icon "doc";
 * - Auto-fix tile RoutineSidebarComponents.swift:608-691 (AutoFixTile);
 * - published payload RoutineDraftPayload+Routine.swift:166-282.
 *
 * Code vs plan:
 * - Cadence reads "OnDemand": the published routine's payload carries
 *   `cadence.draftPayloadValue` (RoutineDraftPayload+Routine.swift:330-337),
 *   not the display name "On demand" the plan expects. App bug worth fixing;
 *   the figure reproduces it.
 * - The card also holds a Bundles tile ("Not in a bundle" · Add to Bundle)
 *   between the grid and Model; the plan omits it.
 * - Model is its own full-width tile under the grid, not a grid tile.
 * - The Run setup row is titled by the input's description ("Topic") with
 *   the detail line "user · Text · Needed before starting · topic"; the
 *   artefact row uses the `doc` symbol and the declared path
 *   "briefs/research-brief.md" (the shared demo graph's), not
 *   "briefs/{date}-{slug}.md".
 * - Both rows carry the `scope` ("Inspect") button: their nodes are not
 *   selected.
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
              <MetaTile icon="calendar" label="Cadence" value="OnDemand" />
              <MetaTile icon="bolt" label="Trigger" value="On demand" />
              <MetaTile icon="arrow.right.circle" label="Proceed" value="Organization default" />
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
            <InspectorRow detail="user · Text · Needed before starting · topic" icon="tray.and.arrow.down" scope title="Topic" />
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
  label: `The inspector of the published routine ${DEMO.routine.name}: its purpose, department growth, owner ${DEMO.routine.owner}, cadence and trigger on demand, model ${DEMO.routine.model} and Auto-fix on Suggest. Run setup asks for one run value, Topic. Artefacts lists the Research brief, saved as briefs/research-brief.md in markdown.`,
  caption: "The routine's definition: who owns it, what it takes in and what it leaves behind.",
  Component: RoutineDefinitionCard,
};
