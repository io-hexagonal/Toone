import { ChecklistDock, type ChecklistCoverOption, type ChecklistRow } from "../ChecklistDock";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The share checklist when everything is prepared and Toone waits for the
 * person's consent: every row done, the cover picked, "Yes, share it".
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/Features/WorkflowCatalog/):
 * - dock: P11 ChecklistDock (ConversationalSession/ConversationChecklist.swift:64-283);
 * - headline "Ready — waiting for your confirmation", title = the routine's
 *   name, rows and labels: ConversationalShare/ShareProgress.swift:20-80;
 * - row order: ConversationalShare/ShareSession.swift:870-984 (contract());
 * - actions, cover options: ShareProgress.swift:86-121 (cover picker stays
 *   while not submitted, "Yes, share it" prominent when ready for consent);
 * - "Yes, share it": ShareSession.swift:194 (ShareConsent.affirmative);
 * - three generated cover options: Core/Services/AgentSession/AgentSessionManager+Share.swift:991.
 *
 * Code vs plan (§1, share-checklist-ready), the code wins:
 * - "Explore checks" is only added to the contract when the local preflight
 *   finds a problem, and then it is blocked (ShareSession.swift:897-901), so a
 *   ready checklist has no "Explore checks" row: 7 rows, not 8.
 * - The header shows the 7/7 capacity gauge, tinted success because every
 *   row is done (ConversationChecklist.swift:66-79); the green
 *   `checkmark.seal.fill` only replaces it once the share is submitted.
 * - A generated cover keeps its picker visible with the heading "Cover" and
 *   the chosen tile outlined until submission (ShareProgress.swift:104-116).
 * - Expanded: `needsPerson` is true when ready for consent
 *   (ShareProgress.swift:17), so the dock opens itself.
 * Covers are flat neutral placeholders, never generated art.
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
