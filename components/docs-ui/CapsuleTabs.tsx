import styles from "./CapsuleTabs.module.css";

/**
 * P6 Segmented, custom capsule-tab variant (the Routines sidebar's
 * Routines / Drafts / Bundles switcher). Source:
 * RoutineCreatorPanelView.swift:523-561.
 *
 * - container: HStack spacing 3, padding 3, inputBackground @0.62 capsule,
 *   1pt separatorColor stroke;
 * - segment: equal widths, caption (10) semibold when selected / medium
 *   otherwise, textPrimary / textSecondary, padding 8 / 6, selected fill
 *   accent @0.20 capsule.
 *
 * The native NSSegmentedControl (Explore "Show", Auto-fix, Calendar) is a
 * different primitive (NativeSegmented).
 */
export function CapsuleTabs({ tabs, selected }: { tabs: readonly string[]; selected: string }) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <span className={styles.tab} data-selected={tab === selected ? "true" : undefined} key={tab}>
          {tab}
        </span>
      ))}
    </div>
  );
}
