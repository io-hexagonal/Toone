import styles from "./AutoFixTile.module.css";
import { Glyph } from "./glyphs";
import { NativeSegmented } from "./NativeSegmented";

/**
 * The routine inspector's Auto-fix tile (RoutineAutoFixTile).
 * Source: Features/Organization/Views/RoutineSidebarComponents.swift:608-691
 * (main repo, desktop app); modes and help lines
 * Features/Organization/Models/Routine.swift:405-477.
 *
 * VStack spacing 0: heading row (Label "Auto-fix" + `wand.and.stars`,
 * .caption .secondary; Spacer; a fixed 16×16 slot for the saving spinner),
 * then the segmented Picker (labels hidden, natural width, top 5), then the
 * mode's help line (.caption textSecondary, max width 520, top 6), then an
 * optional message line (top 6). Tile: padding 9, innerBackground @0.42 in
 * r8, 1pt separator stroke.
 *
 * CALIBRATE: the segmented control (native, see NativeSegmented) and the
 * Label's icon–title gap.
 */

export type AutoFixMode = "off" | "suggest" | "safeFixes" | "auto";

/** RoutineAutoFixMode.allCases order and displayName (= markdownValue). */
export const AUTO_FIX_MODES: { mode: AutoFixMode; label: string; help: string }[] = [
  {
    mode: "off",
    label: "Off",
    help: "Toone never proposes a fix by itself. When a step fails, its agent explains why; fixes happen when you ask.",
  },
  {
    mode: "suggest",
    label: "Suggest",
    help: "When a step fails, Toone and the step's agent propose a fix. Nothing changes until you confirm it.",
  },
  {
    mode: "safeFixes",
    label: "Auto safe fix",
    help: "Toone fixes the failed step's own text and continues without asking. The card shows the change with Revert.",
  },
  {
    mode: "auto",
    label: "Auto-fix",
    help: "Toone works out the fix, including structural changes, and continues. It pauses for things only you can unblock.",
  },
];

export function AutoFixTile({ mode = "suggest" }: { mode?: AutoFixMode }) {
  const index = AUTO_FIX_MODES.findIndex((m) => m.mode === mode);
  return (
    <div className={styles.tile}>
      <div className={styles.heading}>
        <span className={styles.label}>
          <Glyph name="wand.and.stars" size={11} />
          <span>Auto-fix</span>
        </span>
        <span className={styles.spinnerSlot} />
      </div>
      <NativeSegmented
        segments={AUTO_FIX_MODES.map((m) => m.label)}
        selected={index}
        style={{ marginTop: 5 }}
      />
      <div className={styles.help}>{AUTO_FIX_MODES[index].help}</div>
    </div>
  );
}
