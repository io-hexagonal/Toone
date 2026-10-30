import { AutoFixTile } from "../AutoFixTile";
import { DEMO } from "../demo";
import type { SceneDefinition } from "../scene";

/**
 * The routine inspector's Auto-fix setting, on its default (Suggest), as the
 * last tile of the routine's summary card.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - tile: APP/Features/Organization/Views/RoutineSidebarComponents.swift:608-691
 *   (see AutoFixTile.tsx);
 * - labels and help: APP/Features/Organization/Models/Routine.swift:405-477
 *   (allCases Off · Suggest · Auto safe fix · Auto-fix; default Suggest);
 * - placement: APP/Features/Organization/Views/RoutineCreatorPanelView.swift:1172-1208
 *   (`autoFixSelector` closes the summary card: padding 14, innerBackground
 *   @0.42, r12, 1pt separator), :1716-1724.
 *
 * Crop: the bottom of the summary card. The card's top (name, purpose,
 * metadata grid, Model) is scrolled above the frame; the 10pt VStack gap
 * above the tile is the last thing shown of it. No saving spinner and no
 * message line (they appear only right after a change).
 *
 * CALIBRATE: the native segmented control and its exact width.
 */

const WIDTH = 420;
const INSET = 12;

function AutofixPicker() {
  return (
    <div style={{ padding: `0 ${INSET}px ${INSET}px` }}>
      <div
        style={{
          marginTop: -24, // card top + grid scrolled out of frame
          padding: "24px 14px 14px",
          borderRadius: 12,
          background: "color-mix(in srgb, var(--tu-inner) 42%, transparent)",
          boxShadow: "inset 0 0 0 1px var(--tu-sep)",
        }}
      >
        <div style={{ height: 10 }} />
        <AutoFixTile mode="suggest" />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "autofix-picker",
  width: WIDTH,
  radius: 16,
  label: `The Auto-fix tile in the inspector of the routine ${DEMO.routine.name}: a segmented control with Off, Suggest, Auto safe fix and Auto-fix, Suggest selected, and the line: When a step fails, Toone and the step's agent propose a fix. Nothing changes until you confirm it.`,
  caption: "Each routine's Auto-fix setting, in its inspector. Suggest is the default.",
  Component: AutofixPicker,
};
