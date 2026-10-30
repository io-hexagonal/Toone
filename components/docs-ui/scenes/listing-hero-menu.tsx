import { Button } from "../Button";
import { EXPLORE_LISTINGS } from "../exploreListings";
import { Glyph } from "../glyphs";
import { ListingHero } from "../ListingHero";
import { Menu } from "../Menu";
import type { SceneDefinition } from "../scene";

/**
 * An Explore routine page in the left panel, scrolled just past the cover:
 * the hero (ROUTINE + Free, title, summary, chips), "Use this routine", and
 * the "…" menu open on "Create editable branch" (with "Copy link" above it
 * and "Report…" below a separator). The first page section, "What you get",
 * shows under the menu.
 *
 * Sources (APP = apps/toone-desktop/Toone/Toone/):
 * - APP/Features/WorkflowCatalog/WorkflowCatalogDetail.swift:126-153 (page:
 *   ScrollView, VStack spacing 28, padding 24, innerBackground @0.18;
 *   hero eyebrow "Routine", title = listing display title, summary =
 *   listing profile answer, price "Free"), :174-183 (chips: category,
 *   "For: …" from for_whom in order, "N steps", "Runs in Toone"), :186-230
 *   (heroActions: HStack 10; "Use this routine" Label arrow.up.forward,
 *   .body semibold, padding 8/3, .borderedProminent tinted with the accent,
 *   .controlSize(.large); "…" = Menu with Image("ellipsis") textSecondary,
 *   .borderlessButton, indicator hidden; items "Copy link" (link), "Create
 *   editable branch" (arrow.triangle.branch), then the moderation items);
 * - APP/Features/WorkflowCatalog/ExploreModeration.swift:157-169 (Divider,
 *   "Report…" flag; "Block …" is hidden for official listings);
 * - hero: P18 ListingHero (ListingProfilePage.swift:10-80); section
 *   ListingProfilePage.swift:253-300 (Divider, spacing 12, heading
 *   .body semibold tracking −0.25 with 16 top padding) and :94-103
 *   ("What you get" opens with a Divider).
 *
 * Listing data: the public "Launch Surface Preparation" listing
 * (api.trytoone.com, 2026-10-30): answer, category, for_whom, step_count 5.
 * Cover is a flat placeholder.
 *
 * Code vs plan: none in the UI. Data note: in the public catalog this
 * routine is listed "bundle_only" (inside Product Launch Essentials). Opened
 * as a bundle member, the page is built with allowsInstall false
 * (WorkflowExplorerView.swift:298-299), which hides both "Use this routine"
 * and "Create editable branch". The figure keeps the demo routine (plan
 * §0.4) and shows the standalone listing's actions.
 *
 * CALIBRATE: the open NSMenu (P19), its position under the borderless "…"
 * button, and the large borderedProminent bezel (height, radius, label
 * colour on the light accent tint).
 */

const WIDTH = 500;
const PAGE_PAD = 24;
const HERO_W = WIDTH - PAGE_PAD * 2; // 452
const COVER_H = Math.round((Math.min(HERO_W - 56, 360) * 3) / 4); // 270
const COVER_VISIBLE = 40;

const listing = EXPLORE_LISTINGS.launchSurface;

const ANSWER =
  "This routine includes an editable catalog of 20 launch site candidates, including Product Hunt, Fazier, BetaList and Peerlist. You select up to 20 for a run. It checks current rules, costs and product fit, records blocked or ineligible sites, prepares only accounts you authorize, and creates site-specific plans and unpublished drafts. No launch is posted or paid for automatically.";

function HeroActions() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
      <Button
        icon="arrow.up.forward"
        iconSize={13}
        label="Use this routine"
        style={{
          height: 30,
          padding: "0 20px",
          gap: 6,
          borderRadius: 9,
          background: "var(--tu-accent)",
          fontWeight: 600,
        }}
        variant="prominent"
      />
      <span style={{ position: "relative", display: "flex", alignItems: "center", height: 22, padding: "0 4px", borderRadius: 6, background: "var(--tu-hover)", color: "var(--tu-text-2)" }}>
        <Glyph name="ellipsis" size={15} />
        <Menu
          items={[
            { label: "Copy link", icon: "link" },
            { label: "Create editable branch", icon: "arrow.triangle.branch", highlighted: true },
            "separator",
            { label: "Report…", icon: "flag" },
          ]}
          style={{ position: "absolute", left: -5, top: 26, zIndex: 5 }}
        />
      </span>
    </div>
  );
}

function ListingHeroMenu() {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: `0 ${PAGE_PAD}px 22px`,
        background: "color-mix(in srgb, var(--tu-inner) 18%, transparent)",
      }}
    >
      <ListingHero
        actions={<HeroActions />}
        chips={[listing.category, "For: Founders & entrepreneurs, Marketers", "5 steps", "Runs in Toone"]}
        cover={listing.cover}
        eyebrow="Routine"
        price={listing.price}
        style={{ marginTop: -(28 + COVER_H - COVER_VISIBLE) }}
        summary={ANSWER}
        title={listing.title}
        width={HERO_W}
      />
      {/* ListingProfileSection("What you get"), 28 below the hero */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
        <div style={{ height: 1, background: "var(--tu-sep)" }} />
        <span
          style={{
            paddingTop: 16,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: "16px",
            letterSpacing: -0.25,
            color: "var(--tu-text-1)",
          }}
        >
          What you get
        </span>
        <div style={{ height: 1, background: "var(--tu-sep)" }} />
      </div>
    </div>
  );
}

export const scene: SceneDefinition = {
  id: "listing-hero-menu",
  width: WIDTH,
  radius: 16,
  label: `The Explore page of the routine ${listing.title}: its summary, chips and a Use this routine button. The more menu next to it is open, showing Copy link, a highlighted Create editable branch, and Report.`,
  caption: "The … menu next to Use this routine copies the link or adds an editable branch you can adapt.",
  Component: ListingHeroMenu,
};
