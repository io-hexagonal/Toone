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
