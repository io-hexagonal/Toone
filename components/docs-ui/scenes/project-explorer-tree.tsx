import { Button } from "../Button";
import { DEMO } from "../demo";
import { Field } from "../Field";
import { PanelHeader } from "../PanelHeader";
import { BrowserHeader, DisclosureHeader, FILE_ICON_COLOR, FileTree } from "../ProjectExplorer";
import type { SceneDefinition } from "../scene";

/**
 * Top of the right panel (Project Explorer) with the demo project open: the
 * Organization section collapsed, the Project section expanded, the project
 * tree's root expanded and `briefs` open on the brief the routine just saved
 * (fresh green "+").
 *
 * Sources (apps/toone-desktop/Toone/Toone/):
 * - UI/Layout/RightProjectPanelView.swift:35-91 (PanelHeader "Project
 *   Explorer", `folder` in sectionIconTint, then `folder.badge.plus`
 *   "Change Project Directory" and `sidebar.right` icon buttons, 13 medium),
 *   :156-200 (localProjectContent: Organization disclosure when the project
 *   has an organization, separator, Project disclosure, ProjectPanelView).
 * - UI/Components/Layout/PanelHeader.swift:37-74, :136-176.
 * - Features/Project/Views/ProjectPanelView.swift:58-63 (header, search,
 *   content), :196-219 (WorkspaceBrowserHeader = folder name, "Search files"
 *   with padding h16 / bottom 8), :411-444 (tree, padding 8).
 * - UI/Components/Layout/WorkspacePresentationRows.swift:11-52, :169-242.
 * - Features/Project/Models/FileTreeNode.swift:104-221 (folder.fill yellow
 *   .8, .md doc.text gray), Services/OrgTreeClassifier.swift:27-60, :78-84
 *   (project root = folder.badge.gearshape accent; the .toone folder that
 *   holds the organization = "Toone", square.stack.3d.up.fill accent),
 *   ViewModels/ProjectViewModel.swift:128-182 (root row at level 0, expanded
 *   on load :275; org node first, then folders, then files),
 *   Services/ProjectFileTreeLoader.swift:84-87 (folders first, then
 *   case-insensitive names).
 * - UI/Theme/Colors.swift:124-138 (fresh badge = green .90).
 *
 * Code vs plan:
 * - The plan lists a `.toone` row. The classifier renames the .toone folder
 *   that carries the organization to "Toone" with the org icon; drawn that
 *   way.
 * - The tree starts with the project root row ("acme.com growth", level 0),
 *   which the plan omits.
 * - A project with an organization also shows the "Organization" disclosure
 *   above "Project" (drawn collapsed so the crop stays on files).
 * - `notes.md` and `README.md` sit at the project root, not inside `briefs`
 *   (the plan's wording is ambiguous).
 * - Folder icons are the app's yellow (FileTreeNode "yellow" →
 *   .yellow.opacity(0.8)); the only non-status hue here, kept for fidelity.
 *
 * Drawn at MAGNIFY × the app's points so .caption text stays legible.
 */

const PANEL_W = 346; // project panel = 24% of a 1440pt screen (FloatingPanel.swift:47)
const MAGNIFY = 1.2;

function ProjectExplorerTree() {
  const [, briefFile] = DEMO.artefact.split("/");
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W }}>
      <PanelHeader
        icon="folder"
        title="Project Explorer"
        trailing={
          <>
            <Button icon="folder.badge.plus" iconSize={15} variant="icon" />
            <Button icon="sidebar.right" iconSize={15} variant="icon" />
          </>
        }
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <DisclosureHeader expanded={false} icon="building.2" title="Organization" />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <DisclosureHeader expanded icon="folder" title="Project" />
      <BrowserHeader title={DEMO.activeProject} />
      <div style={{ padding: "0 16px 8px" }}>
        <Field placeholder="Search files" />
      </div>
      <FileTree
        rows={[
          {
            title: DEMO.activeProject,
            icon: "folder.badge.gearshape",
            iconColor: FILE_ICON_COLOR.accent,
            level: 0,
            directory: true,
            expanded: true,
          },
          {
            title: "Toone",
            icon: "square.stack.3d.up.fill",
            iconColor: FILE_ICON_COLOR.accent,
            level: 1,
            directory: true,
          },
          {
            title: "briefs",
            icon: "folder.fill",
            iconColor: FILE_ICON_COLOR.yellow,
            level: 1,
            directory: true,
            expanded: true,
          },
          {
            title: briefFile,
            icon: "doc.text",
            iconColor: FILE_ICON_COLOR.gray,
            level: 2,
            badge: "fresh",
          },
          { title: "notes.md", icon: "doc.text", iconColor: FILE_ICON_COLOR.gray, level: 1 },
          { title: "README.md", icon: "doc.text", iconColor: FILE_ICON_COLOR.gray, level: 1 },
        ]}
      />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "project-explorer-tree",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `Project Explorer with the ${DEMO.activeProject} project open: a collapsed Organization section, then the Project section with a Search files field and the folder tree. The briefs folder is expanded and its file ${DEMO.artefact.split("/")[1]} carries a green plus badge because it was just written; notes.md and README.md sit at the top level.`,
  caption: "Project Explorer shows the active project's folder. A green + marks a file an agent just wrote.",
  Component: ProjectExplorerTree,
};
