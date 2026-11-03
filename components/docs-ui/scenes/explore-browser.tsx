import { DEMO } from "../demo";
import { ExploreListingCard } from "../ExploreBlocks";
import { EXPLORE_LISTINGS } from "../exploreListings";
import { Field } from "../Field";
import { Glyph } from "../glyphs";
import { NativeSegmented } from "../NativeSegmented";
import type { SceneDefinition } from "../scene";
import styles from "./explore-browser.module.css";

/**
 * Explore in the left panel, signed in, "Show" on All, no search: a ROUTINE
 * card and a BUNDLE card.
 *
 * CALIBRATE: both segmented pickers (native NSSegmentedControl: height,
 * fills, whether "Show" stretches to the panel width).
 */

const WIDTH = 480;

function ExploreBrowser() {
  return (
    <div>
      <div className={styles.header}>
        <span className={styles.iconButton}>
          <Glyph name="sidebar.left" size={15} weight="medium" />
        </span>
        <span className={styles.titles}>
          <span className={styles.title}>Explore</span>
          <span className={styles.subtitle}>Routines and bundles reviewed by Toone</span>
        </span>
        <span className={styles.iconButton}>
          <Glyph name="sidebar.right" size={15} weight="medium" />
        </span>
      </div>
      <div className={styles.sectionPicker}>
        <NativeSegmented segments={["Explore", "My submissions"]} selected={0} />
      </div>
      <div className={styles.divider} />
      <div style={{ padding: 8 }}>
        <Field placeholder="Search routines and bundles" style={{ padding: "0 8px", gap: 8 }} />
      </div>
      <div className={styles.divider} />
      <div style={{ padding: 8 }}>
        <NativeSegmented fill label="Show" segments={["All", "Routines", "Bundles"]} selected={0} />
      </div>
      <div className={styles.list}>
        <ExploreListingCard listing={EXPLORE_LISTINGS.launchSurface} />
        <ExploreListingCard back={EXPLORE_LISTINGS.launchContent} listing={EXPLORE_LISTINGS.launchEssentials} />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "explore-browser",
  width: WIDTH,
  radius: 24,
  label: `Explore in the Toone app, with the search field empty and Show set to All. Two cards are listed: the routine ${DEMO.explore.routines[0]} and the bundle ${DEMO.explore.bundle}, which contains 2 routines; both are free and by Toone.`,
  caption: "Explore lists reviewed routines and bundles. Search, or switch between All, Routines and Bundles.",
  Component: ExploreBrowser,
};
