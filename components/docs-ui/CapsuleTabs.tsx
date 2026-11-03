import styles from "./CapsuleTabs.module.css";

/**
 * P6 Segmented, custom capsule-tab variant (the Routines sidebar's
 * Routines / Drafts / Bundles switcher).
 *
 * - container: HStack spacing 3, padding 3, input fill @0.62 capsule,
 *   1pt separator stroke;
 * - segment: equal widths, caption (10) semibold when selected / medium
 *   otherwise, primary / secondary, padding 8 / 6, selected fill
 *   accent @0.20 capsule.
 *
 * The native segmented control (Explore "Show", Auto-fix, Calendar) is a
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
