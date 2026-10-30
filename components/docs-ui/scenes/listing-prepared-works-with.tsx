import { Fragment } from "react";
import { DEMO } from "../demo";
import {
  ListingBodyText,
  ListingItemTitle,
  ListingKeyValueBox,
  ListingKeyValueLine,
  ListingLabel,
  ListingProfileCard,
  ListingSection,
} from "../ExploreBlocks";
import { LAUNCH_SURFACE_PROFILE as P } from "../exploreListings";
import type { SceneDefinition } from "../scene";

/**
 * The Launch Surface Preparation listing page, scrolled to "Prepared during
 * setup" (opened), "Customize" and the first row of "Works with".
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/Features/WorkflowCatalog/):
 * - ListingProfilePage.swift:84-229 (ListingProfileBody), prepared :128-148
 *   (intro + one VStack spacing 4 / padding v8 per item, Dividers between,
 *   "Example: " emphasis + body, then the "You prepare" / "Run time
 *   (estimate)" ListingKeyValueBox, top 8), customize :149-164, works with
 *   :165-171 (LazyVGrid adaptive min 220, spacing 14) and its cards :192-218
 *   (name as a Link tinted accent, ListingLabel domain, "What it does there",
 *   "Cost", "Review note" = the party note + the review note);
 * - building blocks :253-458 (section, card, key-value box/line, label, body);
 * - page column: WorkflowCatalogDetail.swift:140-153 (body ≤760 beside a
 *   250 details rail, padding 24); no third-party statuses are passed on
 *   this page (:256-257), so cards show no status word.
 * Data: the public listing (exploreListings.ts → LAUNCH_SURFACE_PROFILE).
 *
 * Code vs plan (§1, listing-prepared-works-with), the code wins:
 * - "Customize" sits between "Prepared during setup" and "Works with"
 *   (:149-164), so it is in the crop.
 * - The real listing has 3 prepared items, not 2.
 * - Its third parties do not include Figma: the grid starts with SourceForge
 *   and Product Hunt (20 sites in all); the crop shows that first row.
 */

const WIDTH = 600;

function ListingPreparedWorksWith() {
  return (
    <div style={{ padding: "12px 24px 0", display: "flex", flexDirection: "column" }}>
      <ListingSection collapsible open title="Prepared during setup">
        <span style={{ paddingBottom: 4 }}>
          <ListingBodyText>
            When you add this routine, Toone&apos;s setup assistant prepares these with you. You only answer what it
            can&apos;t find.
          </ListingBodyText>
        </span>
        {P.youProvide.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? <div style={{ height: 1, background: "rgba(255, 255, 255, 0.19)" }} /> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 0" }}>
              <ListingItemTitle>{item.label}</ListingItemTitle>
              <ListingBodyText>{item.description}</ListingBodyText>
              <ListingBodyText>
                <span style={{ fontWeight: 600 }}>Example: </span>
                {item.example}
              </ListingBodyText>
            </div>
          </Fragment>
        ))}
        <ListingKeyValueBox
          rows={[
            ["You prepare", P.timeAndEffort.youPrepare],
            ["Run time (estimate)", P.timeAndEffort.runEstimate],
          ]}
          style={{ marginTop: 8 }}
        />
      </ListingSection>

      <ListingSection title="Customize">
        {P.customization.map((point) => (
          <div key={point.label} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "4px 0" }}>
            <ListingItemTitle>{point.label}</ListingItemTitle>
            <ListingBodyText>
              {[`Default: ${point.defaultValue}`, `Options: ${point.allowed}`, point.note].join(" · ")}
            </ListingBodyText>
          </div>
        ))}
      </ListingSection>

      <ListingSection title="Works with">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, alignItems: "start" }}>
          {P.thirdParties.map((party) => (
            <ListingProfileCard key={party.domain}>
              <ListingItemTitle link>{party.name}</ListingItemTitle>
              <ListingLabel>{party.domain}</ListingLabel>
              <ListingKeyValueLine label="What it does there" value={party.actions.join(" · ")} />
              <ListingKeyValueLine label="Cost" value={party.cost} />
              <ListingKeyValueLine
                label="Review note"
                value={[party.note, party.reviewNote].filter(Boolean).join(" ")}
              />
            </ListingProfileCard>
          ))}
        </div>
      </ListingSection>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "listing-prepared-works-with",
  width: WIDTH,
  radius: 16,
  label: `Part of the ${DEMO.explore.routines[0]} listing page. "Prepared during setup" is open: Launch sites, Approved product facts and Account permissions, each with an example, then You prepare and Run time (estimate). "Customize" lists Target launch sites and Account preparation with their defaults. "Works with" shows SourceForge and Product Hunt with what the routine does there, the cost and a review note.`,
  caption: "A listing shows what setup prepares with you, what you can change, and which sites the routine works with.",
  Component: ListingPreparedWorksWith,
};
