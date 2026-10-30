import { DEMO } from "../demo";
import { ListingBodyText, ListingItemTitle, ListingProfileCard } from "../ExploreBlocks";
import { Checkbox, PopUpButton, PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * The "Add to your organization" card at the top of a bundle's page, filled
 * in: both routines ticked, department Launch, the review confirmation
 * ticked, so both buttons are enabled.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/Features/WorkflowCatalog/):
 * - RoutineBundleDetail.swift:212-252 (installCard: ListingProfileCard with
 *   "Add to your organization" itemTitle; one Toggle per member, in the
 *   bundle's order, labelled with ListingBodyText(primary); Picker
 *   "Department" ("Choose department" + the organization's departments),
 *   Listing.body, maxWidth 360; Toggle .checkbox "I reviewed the included
 *   routines, agents, Skills and support files."; HStack Spacer · "Create
 *   editable branches" · "Add to organization" .borderedProminent tinted
 *   accent, both UI.button 13 medium);
 * - placement: pageBody :159-170 (the card comes first, 24 above the body);
 * - ListingProfileCard: ListingProfilePage.swift:304-316 (spacing 6,
 *   padding 18, r16, threadCardBackground + border).
 * Members: the public bundle Product Launch Essentials (exploreListings.ts).
 *
 * Code vs plan: none. It is an inline card on the bundle page, not a sheet.
 *
 * CALIBRATE: checkbox (a SwiftUI Toggle in a VStack takes the macOS
 * checkbox style), the pop-up button and both push buttons.
 */

const WIDTH = 520;

function BundleInstallCard() {
  return (
    <div style={{ padding: 24 }}>
      <ListingProfileCard>
        <ListingItemTitle>Add to your organization</ListingItemTitle>
        {DEMO.explore.routines.map((title) => (
          <Checkbox checked key={title}>
            <ListingBodyText primary>{title}</ListingBodyText>
          </Checkbox>
        ))}
        <PopUpButton label="Department" maxWidth={360} value={DEMO.agents.launch.department} />
        <Checkbox checked>
          <ListingBodyText>I reviewed the included routines, agents, Skills and support files.</ListingBodyText>
        </Checkbox>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: "1 1 auto" }} />
          <PushButton fontSize={13} fontWeight={500} label="Create editable branches" />
          <PushButton fontSize={13} fontWeight={500} label="Add to organization" prominent />
        </div>
      </ListingProfileCard>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "bundle-install-card",
  width: WIDTH,
  radius: 16,
  label: `The Add to your organization card on the ${DEMO.explore.bundle} bundle page. Both routines, ${DEMO.explore.routines[0]} and ${DEMO.explore.routines[1]}, are ticked; Department is set to ${DEMO.agents.launch.department}; "I reviewed the included routines, agents, Skills and support files." is ticked. Buttons: Create editable branches and Add to organization.`,
  caption: "Pick the routines and a department, confirm you reviewed them, then add the bundle or create editable branches.",
  Component: BundleInstallCard,
};
