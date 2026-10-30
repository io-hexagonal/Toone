import type { CSSProperties } from "react";
import { DEMO } from "../demo";
import { Glyph } from "../glyphs";
import { GraphCanvas } from "../graph/GraphCanvas";
import { GraphContainer, GraphToolbar, pipelineSummary } from "../graph/GraphContainer";
import { ID, researchBriefGraph } from "../graph/researchBrief";
import { InspectorHeader, InspectorPreview, InspectorRow } from "../InspectorCard";
import type { SceneDefinition } from "../scene";

/**
 * The draft's graph with the artefact card "Research brief" selected (2pt
 * accent border, its lineage lit), and the inspector under it: "Artefact
 * flow" with "Discuss with agent", the artefact row (path · format), its
 * description, "Produced by" and "Used by".
 *
 * Sources (RCP = APP/Features/Organization/Views/RoutineCreatorPanelView.swift):
 * - creator RCP:1082-1095 (ScrollView, VStack spacing 18, padding 18: graph,
 *   Divider, definitionPreview);
 * - definitionPreview RCP:1144-1171 (headline + Discuss with agent),
 *   selectionTitle RCP:1813-1829 ("Artefact flow");
 * - artefactPreview RCP:1424-1440 (VStack spacing 14: previewRow shippingbox,
 *   no `scope` button since its node is the selection; description .callout
 *   .secondary; stepLinks "Produced by" / "Used by");
 * - stepLinks RCP:2064-2081 (VStack spacing 8: .headline; empty →
 *   "No step binding declared" .caption .secondary; each step a
 *   Label(step.title, systemImage: "arrow.turn.down.right") .callout);
 * - graph: container + toolbar RoutineDraftPipelineView.swift:56-231, cards
 *   RoutinePipelineGraphComponents.swift:174-294 (GraphKit).
 *
 * Code vs plan:
 * - "Produced by" lists the step's title without its number: "Save the
 *   brief", not "4. Save the brief".
 * - The artefact's path is the routine's declared path as the shared demo
 *   graph draws it (graph/researchBrief.ts), "briefs/research-brief.md",
 *   not the plan's "briefs/{date}-{slug}.md".
 *
 * Drawn at MAGNIFY × the app's points (10pt captions ≥11px at the guide
 * column).
 */

const W = 580;
const MAGNIFY = 1.1;
const CANVAS_W = W - 36;
const CANVAS_H = 118;
const GRAPH_ZOOM = 1;

const graph = researchBriefGraph({ showInputs: true, showArtefacts: true });
const step4 = graph.nodes.find((n) => n.id === ID.step(4))!;
const artefact = graph.nodes.find((n) => n.id === ID.artefact)!;
// Centre the step 4 → artefact span.
const PAN = {
  x: -(((step4.x - step4.w / 2) + (artefact.x + artefact.w / 2)) / 2) * GRAPH_ZOOM,
  y: -artefact.y * GRAPH_ZOOM,
};

const headline: CSSProperties = { fontSize: 13, fontWeight: 700, lineHeight: "16px", color: "var(--tu-label-1)" };

function StepLinks({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <span style={headline}>{title}</span>
      {steps.length === 0 ? (
        <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>No step binding declared</span>
      ) : (
        steps.map((step) => (
          <span
            key={step}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, lineHeight: "15px", color: "var(--tu-label-1)" }}
          >
            <Glyph name="arrow.turn.down.right" size={13} />
            {step}
          </span>
        ))
      )}
    </div>
  );
}

function DraftArtefactInspector() {
  return (
    <div style={{ zoom: MAGNIFY, width: W, padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
      <GraphContainer
        toolbar={
          <GraphToolbar
            chips={{ runSetup: true, artefacts: true, steps: true }}
            clipAfter="steps"
            hasSelection
            published={false}
            summary={pipelineSummary({ steps: 4, subRoutines: 1, runValues: 1, resources: 0, artefacts: 1 })}
          />
        }
      >
        <GraphCanvas graph={graph} height={CANVAS_H} pan={PAN} selectedId={ID.artefact} width={CANVAS_W} zoom={GRAPH_ZOOM} />
      </GraphContainer>
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <InspectorPreview>
        <InspectorHeader title="Artefact flow" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 14 }}>
          <InspectorRow detail="briefs/research-brief.md · markdown" icon="shippingbox" title="Research brief" />
          <span style={{ fontSize: 12, lineHeight: "15px", color: "var(--tu-label-2)" }}>
            Summary, evidence, open uncertainties and next steps.
          </span>
          <StepLinks steps={[DEMO.routine.steps[3]]} title="Produced by" />
          <StepLinks steps={[]} title="Used by" />
        </div>
      </InspectorPreview>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "draft-artefact-inspector",
  width: Math.round(W * MAGNIFY),
  radius: 16,
  label: `The draft graph with the artefact Research brief selected after step 4, ${DEMO.routine.steps[3]}. The inspector below, titled Artefact flow, shows the file path briefs/research-brief.md in markdown, the description "Summary, evidence, open uncertainties and next steps.", produced by ${DEMO.routine.steps[3]} and used by no step.`,
  caption: "Select the artefact to check where the result is saved, what it must contain and which step produces it.",
  Component: DraftArtefactInspector,
};
