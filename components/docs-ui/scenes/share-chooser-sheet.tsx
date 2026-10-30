import { DEMO } from "../demo";
import { PushButton, RadioGroup } from "../NativeControls";
import type { SceneDefinition } from "../scene";
import { Sheet, SheetFooter, SheetStage } from "../Sheet";

/**
 * The Share sheet for the demo routine, before anything was shared:
 * "Share this routine" selected, Continue enabled.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/WorkflowCatalog/ConversationalShare/ShareChooserSheet.swift:95-124
 *   (VStack leading spacing 20, padding 24, width 520; title
 *   "Share “<root name>”" .title2.bold; radio-group Picker
 *   "What would you like to share?" with "Share this routine" (no live
 *   listing) / "Create a routine bundle" / "Share an update"; description
 *   .secondary; caption .caption .secondary; HStack Cancel · Spacer ·
 *   Continue .borderedProminent);
 * - copy :57-72 (with one sub-routine: "Publish this routine and its 1
 *   sub-routine to Explore as one item.");
 * - tint: `.liveTheme(layoutStyle)` (APP/UI/Theme/LiveTheme.swift:27-36), so
 *   the selected radio and Continue use the Smoky Quartz accent;
 * - presented from the Routines panel (OrganizationOverviewView.swift).
 *
 * Code vs plan: none. Notes: the "Which Explore listing is this?" chooser
 * (:149-168) only appears when the account already has a same-routine
 * listing from another workspace, so it is absent here; the third radio is
 * always present (:99-100), and Continue is enabled for a first share once
 * the status check finishes (:40-48), with no spinner.
 *
 * CALIBRATE: everything native: the sheet window (Sheet.tsx), the radio
 * group (label placement, 6pt row gap), the push buttons, and title2 bold at
 * 17pt on macOS 26.
 */

const SHEET_WIDTH = 520;
const WIDTH = SHEET_WIDTH + 48;

function ShareChooserSheet() {
  return (
    <SheetStage>
      <Sheet style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24 }} width={SHEET_WIDTH}>
        <span style={{ fontSize: 17, fontWeight: 700, lineHeight: "21px", color: "var(--tu-text-1)" }}>
          Share “{DEMO.routine.name}”
        </span>
        <RadioGroup
          label="What would you like to share?"
          options={["Share this routine", "Create a routine bundle", "Share an update"]}
          selected={0}
        />
        <span style={{ fontSize: 13, lineHeight: "17px", color: "var(--tu-label-2)" }}>
          Publish this routine and its 1 sub-routine to Explore as one item.
        </span>
        <span style={{ fontSize: 10, lineHeight: "13px", color: "var(--tu-label-2)" }}>
          A Share assistant opens in chat. It prepares everything and asks you only what it needs.
        </span>
        <SheetFooter leading={<PushButton label="Cancel" />} trailing={<PushButton label="Continue" prominent />} />
      </Sheet>
    </SheetStage>
  );
}

export const scene: SceneDefinition = {
  id: "share-chooser-sheet",
  width: WIDTH,
  radius: 24,
  label: `The Share sheet for the routine ${DEMO.routine.name}. It asks "What would you like to share?" with three radio buttons: Share this routine (selected), Create a routine bundle, and Share an update. Below: "Publish this routine and its 1 sub-routine to Explore as one item." and "A Share assistant opens in chat. It prepares everything and asks you only what it needs." Buttons: Cancel and Continue.`,
  caption: "Choose what to share, then Continue. The Share assistant takes it from there in chat.",
  Component: ShareChooserSheet,
};
