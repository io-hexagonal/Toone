import { DEMO } from "../demo";
import {
  InspectorDetail,
  InspectorHeader,
  InspectorLabel,
  InspectorMenuLabel,
  InspectorPreview,
  InspectorSection,
  InspectorSummaryCard,
} from "../InspectorCard";
import type { SceneDefinition } from "../scene";

/**
 * The Routines panel on the Drafts tab, sidebar hidden, scrolled past the
 * graph to the inspector with step 3 selected: "Step definition" with
 * "Discuss with agent", the step's summary card (its job and the draft's
 * model menu), Step inputs, Step outputs and Completion criteria. Cropped inside the panel: the panel header and the
 * toolbar with Publish are drawn by draft-header-publish ("Publish it"), so
 * this figure no longer repeats them (coverage audit, planner notes).
 *
 * CALIBRATE: the borderless menu labels (native).
 */

const WIDTH = 600;

function DraftStepInspector() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* bottom of the graph container (r14, inner background .38, separator .75), scrolled past */}
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
            <InspectorMenuLabel icon="cpu" label={`Step model: ${DEMO.routine.model}`} />
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
  label: `The Routines panel on a draft, scrolled below the graph: step 3, ${DEMO.routine.steps[2]}, is described: what it does, its model, its inputs and outputs, and its completion criteria, with a Discuss with agent button.`,
  caption: "Select a step to see what it does, consumes and produces. Discuss with agent opens a chat about that step.",
  Component: DraftStepInspector,
};
