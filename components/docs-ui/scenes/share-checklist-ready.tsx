import { ChecklistDock, type ChecklistCoverOption, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The share checklist when everything is prepared and Toone waits for the
 * person's consent: every row done, the cover picked, "Yes, share it".
 */

const WIDTH = 480;

const ROWS: ChecklistRow[] = [
  { label: "Package", state: "done" },
  { label: "Shared copy", state: "done" },
  { label: "Security review", state: "done" },
  { label: "Title", state: "done" },
  { label: "Category and audiences", state: "done" },
  { label: "Public page", state: "done" },
  { label: "Cover", state: "done" },
];

const COVERS: ChecklistCoverOption[] = [
  { number: 1, background: "linear-gradient(135deg, #3d3c3a 0%, #5e5a55 55%, #7d776f 100%)" },
  { number: 2, background: "linear-gradient(135deg, #6b5d52 0%, #8a7b6c 50%, #4f4945 100%)", chosen: true },
  { number: 3, background: "linear-gradient(135deg, #2f2f31 0%, #4a4a4c 50%, #6c6a66 100%)" },
];

function ShareChecklistReady() {
  return (
    <div style={{ padding: 16 }}>
      <ChecklistDock
        actions={[{ label: "Yes, share it", prominent: true }]}
        cover={COVERS[1].background}
        coverOptions={COVERS}
        expanded
        headline="Ready — waiting for your confirmation"
        rows={ROWS}
        title={DEMO.routine.name}
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "share-checklist-ready",
  width: WIDTH,
  radius: 16,
  label: `The share checklist for ${DEMO.routine.name}, headed "Ready — waiting for your confirmation", 7 of 7 done. Cover 2 of three is chosen. Done rows: Package, Shared copy, Security review, Title, Category and audiences, Public page, Cover. A "Yes, share it" button is at the bottom.`,
  caption: "Everything is prepared. Choose Yes, share it to send the listing for review.",
  Component: ShareChecklistReady,
};
