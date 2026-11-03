import { DEMO } from "../demo";
import { DestinationHeader } from "../DestinationHeader";
import { Glyph } from "../glyphs";
import styles from "../GitTimeline.module.css";
import { PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * Project History for a folder that is not a Git repository yet: the
 * Timeline destination in the left panel shows "This folder is not
 * tracked", and its toolbar carries the prominent **Setup Timeline** button
 * (help "Open an agent conversation to set up history for this project").
 *
 * CALIBRATE: the small borderedProminent button (theme accent with the
 * white label AppKit picks for Smoky Quartz's grey). Drawn at MAGNIFY × the
 * app's points.
 */

const PANEL_W = 380;
const HEIGHT = 250;
const MAGNIFY = 1.15;

function TimelineSetup() {
  return (
    <div style={{ zoom: MAGNIFY, width: PANEL_W, height: HEIGHT, display: "flex", flexDirection: "column" }}>
      <DestinationHeader title="Timeline" />
      <div className={styles.toolbar}>
        <span className={styles.checked}>{DEMO.timeline.checked}</span>
        <span className={styles.spacer} />
        <span className={styles.iconButton} style={{ marginRight: 0 }}>
          <Glyph name="arrow.clockwise" size={15} />
        </span>
        <PushButton label="Setup Timeline" prominent small />
      </div>
      <div className={styles.divider} />
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Glyph color="var(--tu-label-3)" name="clock.arrow.circlepath" size={32} />
        <span style={{ fontSize: 12, lineHeight: "15px", color: "var(--tu-label-2)" }}>This folder is not tracked</span>
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "timeline-setup",
  width: Math.round(PANEL_W * MAGNIFY),
  radius: 24,
  label: `The Timeline in the left panel for a folder without history. The toolbar reads ${DEMO.timeline.checked}, with a refresh button and a Setup Timeline button; below, a clock icon and the line This folder is not tracked.`,
  caption: "Until the folder has history, the Timeline offers Setup Timeline, which opens an agent conversation to set it up.",
  Component: TimelineSetup,
};
