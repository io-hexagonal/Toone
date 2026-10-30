import { DEMO } from "../demo";
import {
  InspectorDetail,
  InspectorHeader,
  InspectorLabel,
  InspectorMenuLabel,
  InspectorPreview,
  InspectorSection,
  InspectorSummaryCard,
  MetaTile,
  MetaTileGrid,
} from "../InspectorCard";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel on the Drafts tab, sidebar hidden, scrolled past the
 * graph to the inspector with step 3 selected: "Step definition" with
 * "Discuss with agent", the step's summary card (tiles and the draft's
 * model / executor / execution menus), Step inputs, Step outputs and
 * Completion criteria. Cropped inside the panel: the panel header and the
 * toolbar with Publish are drawn by draft-header-publish ("Publish it"), so
 * this figure no longer repeats them (coverage audit, planner notes).
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/,
 * RCP = APP/Features/Organization/Views/RoutineCreatorPanelView.swift):
 * - RCP:1088-1101 (creator: ScrollView, VStack spacing 18, padding 18:
 *   graph, Divider, definitionPreview);
 * - RCP:1144-1171 (definitionPreview), :1256-1340 (stepDefinitionPreview),
 *   :1484-1505 (policy summary; agent defaults: no budget, retryLimit 3,
 *   backoff 15s → "no time budget · no hard timeout · 4 attempts · 15s
 *   backoff · inherited", Core/Services/RoutinePipeline/RoutineExecutionPlan.swift:20-25),
 *   :1471-1482 (inherited model "App default"), :1563-1680 (menus),
 *   :2058-2062 (executor = routine owner), :2159-2307 (tiles, sections,
 *   detail lists) — all drawn with P16 InspectorCard.
 *
 * Code vs plan:
 * - The card's title is the step title with a "3.circle.fill" symbol, so it
 *   reads "③ Organize the findings", not "3. Organize the findings".
 * - In a draft (not published) the card also carries three borderless menus:
 *   "Step model: App default", "Executor: Research Assistant", "Execution:
 *   Direct agent".
 * - "findings" and "brief draft" are the step's plain inputs/outputs (the
 *   demo routine has one artefact, the brief, as draft-pipeline-graph's
 *   "1 artefact" shows), so they render as "Additional inputs: findings" and
 *   "Additional outputs: brief draft" detail lines, not as "Artefacts from
 *   earlier steps" rows (those appear only for artefact bindings).
 *
 * CALIBRATE: the borderless menu labels (native).
 */

const WIDTH = 600;

function DraftStepInspector() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* bottom of the graph container (r14, innerBackground .38, separator .75), scrolled past */}
        <div
          style={{
            height: 10,
            borderRadius: "0 0 14px 14px",
            background: "color-mix(in srgb, var(--tu-inner) 38%, transparent)",
            boxShadow: "inset 0 -1px 0 color-mix(in srgb, var(--tu-sep) 75%, transparent), inset 1px 0 0 color-mix(in srgb, var(--tu-sep) 75%, transparent), inset -1px 0 0 color-mix(in srgb, var(--tu-sep) 75%, transparent)",
          }}
        />
        <div style={{ height: 1, background: "var(--tu-sep)" }} />
        <InspectorPreview>
          <InspectorHeader title="Step definition" />
          <InspectorSummaryCard
            number={3}
            text="Organize the findings into a summary, the evidence, open uncertainties and suggested next steps."
            title={DEMO.routine.steps[2]}
          >
            <MetaTileGrid>
              <MetaTile icon="person.crop.circle" label="Executor" value={DEMO.routine.owner} />
              <MetaTile icon="arrow.triangle.branch" label="Execution" value="Routine owner" />
              <MetaTile
                icon="timer"
                label="Execution policy"
                value="no time budget · no hard timeout · 4 attempts · 15s backoff · inherited"
              />
            </MetaTileGrid>
            <InspectorMenuLabel icon="cpu" label={`Step model: ${DEMO.routine.model}`} />
            <InspectorMenuLabel icon="person.crop.circle" label={`Executor: ${DEMO.routine.owner}`} />
            <InspectorMenuLabel icon="arrow.triangle.branch" label="Execution: Direct agent" />
          </InspectorSummaryCard>
          <InspectorSection title="Step inputs">
            <InspectorDetail label="Additional inputs" values={["findings"]} />
          </InspectorSection>
          <InspectorSection title="Step outputs">
            <InspectorDetail label="Additional outputs" values={["brief draft"]} />
          </InspectorSection>
          <InspectorSection title="Completion criteria">
            <InspectorLabel icon="checkmark.circle">
              The brief has a summary, the evidence, open uncertainties and next steps.
            </InspectorLabel>
            <InspectorLabel icon="checkmark.circle">Every finding cites a source or is marked as an assumption.</InspectorLabel>
          </InspectorSection>
        </InspectorPreview>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "draft-step-inspector",
  width: WIDTH,
  radius: 16,
  label: `The Routines panel on a draft, scrolled below the graph: step 3, ${DEMO.routine.steps[2]}, is described: executor ${DEMO.routine.owner}, its inputs and outputs, and its completion criteria, with a Discuss with agent button.`,
  caption: "Select a step to see what it does, consumes and produces. Discuss with agent opens a chat about that step.",
  Component: DraftStepInspector,
};
