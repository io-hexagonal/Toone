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
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - host header: APP/UI/Layout/LeftOrchestratorView.swift:948-959 (title
 *   "Explore", subtitle "Routines and bundles reviewed by Toone") and
 *   :1366-1433 (destinationHeaderContent: HStack spacing 8, padding 8,
 *   min-h 44, `sidebar.left` / `sidebar.right` 13 medium secondary icon
 *   buttons, title .headline, subtitle .caption2 .secondary, bottom divider);
 * - APP/Features/WorkflowCatalog/WorkflowExplorerView.swift:129-264
 *   (explorerHeader: the "Explore | My submissions" segmented picker shows
 *   when signed in, fixedSize, centred, padding 16/8; SearchField padding 8
 *   "Search routines and bundles"; Divider; "Show" segmented picker
 *   All/Routines/Bundles padding 8; list LazyVStack spacing 8, padding 8 on
 *   innerBackground @0.12), cards :369-395;
 * - search field: APP/UI/Components/Inputs/SearchField.swift:18-75 (padding 8,
 *   spacing 8, min-h 32, r12, inputBg .78, inputBorder .8 @ 0.5pt);
 * - card: P18 ExploreBlocks (ListingProfilePage.swift:466-599).
 * Card data: the public listings (exploreListings.ts). Covers are placeholders.
 *
 * Code vs plan: the bundle eyebrow is uppercased by the card, so it reads
 * "BUNDLE · 2 ROUTINES"; the eyebrow font is 11 semibold (not bold); and the
 * signed-in "Explore | My submissions" picker (the guide's "Before you
 * start" requires signing in) sits above the search field.
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
