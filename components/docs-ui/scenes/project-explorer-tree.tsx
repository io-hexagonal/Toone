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
 * Drawn at MAGNIFY × the app's points so .caption text stays legible.
 */

const PANEL_W = 346; // project panel = 24% of a 1440pt screen
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
