import { ChecklistDock, type ChecklistCoverOption, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The share checklist while the listing comes together: the package and the
 * shared copy are done, the hidden specialists are still working, and the
 * person has two things to decide (the title and one of three covers).
 */

const WIDTH = 480;

const ROWS: ChecklistRow[] = [
  { label: "Package", state: "done" },
  { label: "Shared copy", state: "done" },
  { label: "Security review", state: "working" },
  { label: "Title", state: "waiting" },
  { label: "Category and audiences", state: "working" },
  { label: "Public page", state: "working" },
  { label: "Cover", state: "waiting" },
];

const COVERS: ChecklistCoverOption[] = [
  { number: 1, background: "linear-gradient(135deg, #3d3c3a 0%, #5e5a55 55%, #7d776f 100%)" },
  { number: 2, background: "linear-gradient(135deg, #6b5d52 0%, #8a7b6c 50%, #4f4945 100%)" },
  { number: 3, background: "linear-gradient(135deg, #2f2f31 0%, #4a4a4c 50%, #6c6a66 100%)" },
];

function ShareChecklistPreparing() {
  return (
    <div style={{ padding: 16 }}>
      <ChecklistDock
        actions={[{ label: "Choose cover image…" }]}
        coverOptions={COVERS}
        expanded
        headline="Preparing your listing"
        rows={ROWS}
        title={DEMO.routine.name}
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "share-checklist-preparing",
  width: WIDTH,
  radius: 16,
  label: `The share checklist for ${DEMO.routine.name}, headed "Preparing your listing", 2 of 7 done. Three generated covers wait under "Pick a cover". Package and Shared copy are done; Security review, Category and audiences and Public page are being worked on; Title and Cover wait for you. A "Choose cover image…" button is at the bottom.`,
  caption: "The checklist fills in as Toone prepares the listing. Rows with a question mark wait for you.",
  Component: ShareChecklistPreparing,
};
