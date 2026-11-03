import { DEMO } from "../demo";
import { ListingBodyText, ListingItemTitle, ListingProfileCard } from "../ExploreBlocks";
import { Checkbox, PopUpButton, PushButton } from "../NativeControls";
import type { SceneDefinition } from "../scene";

/**
 * The "Add to your organization" card at the top of a bundle's page, filled
 * in: both routines ticked, department Launch, the review confirmation
 * ticked, so both buttons are enabled.
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
