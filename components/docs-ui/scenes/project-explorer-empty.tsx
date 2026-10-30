import { Button } from "../Button";
import { Glyph } from "../glyphs";
import { PanelHeader } from "../PanelHeader";
import type { SceneDefinition } from "../scene";

/**
 * Project Explorer before any project folder is chosen: the empty state with
 * "No Folder Selected", the "Select Project Folder" button and the line that
 * explains agents work in the chosen folder.
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/RightProjectPanelView.swift:35-91 (PanelHeader; with no project
 *   folder the `folder.badge.plus` button is absent, only `sidebar.right`
 *   remains), :214-251 (noProjectContent: VStack spacing 16 between Spacers;
 *   folder.badge.questionmark 40pt textTertiary; "No Folder Selected"
 *   .headline textPrimary; .borderedProminent tinted with the theme accent;
 *   explanation .caption textTertiary, centred, padding h24), :255-258
 *   ("Select Project Folder", direct edition).
 * - Features/ProjectFolders/ProjectFolderPicker.swift:41-48
 *   (openOriginalExplanation, direct edition: "Agents work directly in the
 *   folder you choose.").
 * - UI/Windows/LayoutStyle.swift:342-354: tinted with the plain accent
 *   (white .72), not controlTint, AppKit gives this button a white label.
 *
 * calibrate: .borderedProminent is a native control (height, radius, label
 * weight); the accent fill + white label follow the code comment above.
 * The panel body is cropped to 270pt; the real one fills the screen height
 * with the group centred.
 */

const PANEL_W = 346; // project panel = 24% of a 1440pt screen (FloatingPanel.swift:47)
const MAGNIFY = 1.2;
const BODY_H = 270;

function ProjectExplorerEmpty() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <PanelHeader
        icon="folder"
        title="Project Explorer"
        trailing={<Button icon="sidebar.right" iconSize={15} variant="icon" />}
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          height: BODY_H,
        }}
      >
        <Glyph color="var(--tu-text-3)" name="folder.badge.questionmark" size={46} weight="regular" />
        <span style={{ fontSize: 13, lineHeight: "16px", fontWeight: 700, color: "var(--tu-text-1)" }}>
          No Folder Selected
        </span>
        <Button
          label="Select Project Folder"
          style={{ background: "var(--tu-accent)", color: "#fff", fontWeight: 400 }}
          variant="prominent"
        />
        <span
          style={{
            padding: "0 24px",
            fontSize: 10,
            lineHeight: "13px",
            color: "var(--tu-text-3)",
            textAlign: "center",
          }}
        >
          Agents work directly in the folder you choose.
        </span>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "project-explorer-empty",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label:
    "Project Explorer with no project: a folder icon with a question mark, the words No Folder Selected, a Select Project Folder button, and the note Agents work directly in the folder you choose.",
  caption: "With no project open, Project Explorer offers to select a folder.",
  Component: ProjectExplorerEmpty,
};
