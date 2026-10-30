import { Button } from "../Button";
import { DEMO } from "../demo";
import { OrgSectionHeader, PanelDisclosure } from "../OrgTree";
import { PanelHeader } from "../PanelHeader";
import type { SceneDefinition } from "../scene";

/**
 * Live Share, guest side, following the host: the guest's right panel shows
 * the host's organization read-only, and the host's pointer moves over it
 * as a small dot labelled "Host" (here on Launch Planner).
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/Business/Views/NativeLiveShareWorkspaceViews.swift:11-46
 *   (LiveShareParticipantCursorOverlay: 11pt dot with a 2pt white inner
 *   ring and a black .25 r2 shadow; capsule label 9pt semibold white,
 *   padding 5/2, offset 9/9), :48-63 (LiveShareFollowCursorOverlay: only
 *   while following the host, label "Host"), :301-397
 *   (RemoteOrganizationOverviewView: Agents (person.2, count) opened to one
 *   `person.circle` row per agent; Departments (building.2, count) opened to
 *   one `folder` row per department with its agent count; cursor overlay on
 *   the organization overview);
 * - APP/UI/Layout/RightProjectPanelView.swift:35-91 (header: a remote
 *   project hides "Change Project Directory", only `sidebar.right` stays),
 *   :123-154 (remoteProjectContent: Organization disclosure, the remote
 *   overview, Divider, "Files" disclosure);
 * - row pieces in OrgTree.tsx (OrgSectionHeaderView.swift).
 *
 * Code vs plan:
 * - The plan reuses org-panel-overview's surface. A guest sees a different,
 *   smaller tree (RemoteOrganizationOverviewView): Agents and Departments
 *   only, no Skills / Memory / Integrations / MCPs; drawn that way. The
 *   files section is titled "Files", not "Project".
 * - COLOUR DEVIATION (owner decision, CONTRACT "theme colours only"): the
 *   app draws the cursor and its label in system blue (`color: Color =
 *   .blue`, :15). This figure draws both in the theme accent (Smoky Quartz
 *   grey) and keeps the code's white ring and white label text.
 * - `person.circle` is drawn with the kit's `person.crop.circle` lookalike
 *   (the two symbols differ only in the crop).
 *
 * Motion: the dot follows the host's pointer live; a still figure shows one
 * position. Drawn at MAGNIFY × the app's points (same as org-panel-overview).
 */

const PANEL_W = 346;
const MAGNIFY = 1.2;
const ACCENT = "var(--tu-accent)";

function HostCursor({ x, y }: { x: number; y: number }) {
  return (
    <span style={{ position: "absolute", left: x, top: y, width: 11, height: 11 }}>
      <span
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          borderRadius: "50%",
          background: ACCENT,
          border: "2px solid #fff",
          boxShadow: "0 0 4px rgba(0, 0, 0, 0.25)",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 9,
          top: 9,
          padding: "2px 5px",
          borderRadius: 999,
          background: ACCENT,
          color: "#fff",
          fontSize: 9,
          lineHeight: "11px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        Host
      </span>
    </span>
  );
}

function LiveShareHostCursor() {
  const { research, launch, writer } = DEMO.agents;
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, paddingBottom: 4 }}>
      <PanelHeader
        icon="folder"
        title="Project Explorer"
        trailing={<Button icon="sidebar.right" iconSize={15} variant="icon" />}
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
      <PanelDisclosure icon="building.2" title="Organization" />
      <div style={{ position: "relative" }}>
        <OrgSectionHeader count={3} expanded icon="person.2" title="Agents" />
        <OrgSectionHeader icon="person.crop.circle" level={1} title={research.name} />
        <OrgSectionHeader icon="person.crop.circle" level={1} title={writer.name} />
        <OrgSectionHeader icon="person.crop.circle" level={1} title={launch.name} />
        <OrgSectionHeader count={2} expanded icon="building.2" title="Departments" />
        <OrgSectionHeader count={2} icon="folder" level={1} title={research.department} />
        <OrgSectionHeader count={1} icon="folder" level={1} title={launch.department} />
        <HostCursor x={178} y={80} />
      </div>
      <div style={{ height: 1, background: "var(--tu-sep)", marginTop: 4 }} />
      <PanelDisclosure expanded={false} icon="folder" title="Files" />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "live-share-host-cursor",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `A Live Share guest's right panel showing the host's organization read-only: Agents (3) with ${DEMO.agents.research.name}, ${DEMO.agents.writer.name} and ${DEMO.agents.launch.name}; Departments (2) with ${DEMO.agents.research.department} and ${DEMO.agents.launch.department}. A small dot labelled Host sits on ${DEMO.agents.launch.name}, showing where the host's pointer is.`,
  caption: "While you follow the host, a dot labelled Host shows where they are pointing in the shared organization.",
  Component: LiveShareHostCursor,
};
