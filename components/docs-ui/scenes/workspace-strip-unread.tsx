import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";
import { WorkspaceStrip } from "../WorkspaceStrip";
import styles from "./workspace-strip-unread.module.css";

/**
 * The project strip while you work in project 1: project 2 had agent
 * activity you have not looked at yet, so its pill pulses an accent outline
 * (and a soft glow). Project 3 is quiet.
 *
 * Motion: the pulse runs only under prefers-reduced-motion: no-preference;
 * the static state is mid-pulse (stroke 0.55, glow 0.2, this scene's CSS).
 */

const WIDTH = 440;
const HEIGHT = 56;

function WorkspaceStripUnread() {
  const [growth, acme, launch] = DEMO.projects;
  return (
    <div className={styles.wrap} style={{ height: HEIGHT }}>
      <WorkspaceStrip
        pills={[
          { index: 1, name: growth, active: true },
          { index: 2, name: acme, unread: true },
          { index: 3, name: launch },
        ]}
      />
      <div style={{ height: 1, background: "var(--tu-sep)" }} />
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "workspace-strip-unread",
  width: WIDTH,
  radius: 24,
  label: `The project strip with three projects. 1, ${DEMO.projects[0]}, is active. 2, ${DEMO.projects[1]}, has a glowing, pulsing outline because an agent did something there you have not seen yet. 3, ${DEMO.projects[2]}, is quiet.`,
  caption: "A pulsing outline marks a project with activity you haven't seen yet.",
  Component: WorkspaceStripUnread,
};
