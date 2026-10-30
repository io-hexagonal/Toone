import { DEMO } from "./demo";

/**
 * Public Explore listings used by the docs figures (plan §0.4: "the real public
 * listings already linked from the guides"). Card fields copied from the public
 * catalog API on 2026-10-30 (GET api.trytoone.com/v1/workflows/{slug} and
 * /v1/bundles), mapped the way ExploreCatalogCard shows them:
 *
 * - title = display_title, summary = card_summary (presentedSummary),
 * - category / audience = taxonomy labels of category_id / useful_for_ids,
 * - meta = ExploreCatalogCard.routineCounts(...) + "N results",
 * - author_official → "By Toone" with the Toone mark.
 *
 * Covers are NEVER the real art: each listing gets a flat gradient placeholder
 * (`cover`), loosely echoing the art's palette, desaturated for Smoky Quartz.
 */
export type ExploreListing = {
  kind: "routine" | "bundle";
  title: string;
  category: string;
  summary: string;
  audience: string[];
  meta: string[];
  official: boolean;
  author: string;
  tags: string[];
  price: string;
  cover: string;
  memberCount?: number;
};

export const EXPLORE_LISTINGS = {
  launchSurface: {
    kind: "routine",
    title: DEMO.explore.routines[0],
    category: "Marketing & sales",
    summary:
      "Research 20 candidate launch sites, check current eligibility and costs, and prepare authorized profiles, plans and unpublished drafts.",
    audience: ["Marketers", "Founders & entrepreneurs"],
    meta: ["5 steps", "1 agent", "4 results"],
    official: true,
    author: "Toone Team",
    tags: ["product-launch", "marketing"],
    price: "Free",
    cover: "linear-gradient(135deg, #3a3938 0%, #5c5955 48%, #8d877e 100%)",
  },
  launchContent: {
    kind: "routine",
    title: DEMO.explore.routines[1],
    category: "Marketing & sales",
    summary: "",
    audience: [],
    meta: [],
    official: true,
    author: "Toone Team",
    tags: [],
    price: "Free",
    cover: "linear-gradient(135deg, #4a4542 0%, #6e6660 55%, #9a8f86 100%)",
  },
  launchEssentials: {
    kind: "bundle",
    title: DEMO.explore.bundle,
    category: "Marketing & sales",
    summary:
      "Research 20 candidate launch sites, check current eligibility and costs, and prepare authorized profiles, plans and unpublished drafts.",
    audience: ["Marketers", "Product managers", "Founders & entrepreneurs"],
    meta: ["4 results"],
    official: true,
    author: "Toone Team",
    tags: ["product-launch", "marketing"],
    price: "Free",
    memberCount: 2,
    cover: "linear-gradient(135deg, #7a5a4e 0%, #8a7152 50%, #5c5450 100%)",
  },
} satisfies Record<string, ExploreListing>;

/**
 * Listing page data for Launch Surface Preparation (public listing_profile
 * from GET api.trytoone.com/v1/workflows/launch-surface-preparation-xzmzpbkf,
 * copied 2026-10-30). Only the sections the figures show; third parties are
 * the first two of 20, in the API's order. `reviewNote` is the
 * third_party_reviews note the app appends to the party's own note
 * (ListingProfilePage.swift:193-218).
 */
export const LAUNCH_SURFACE_PROFILE = {
  youProvide: [
    {
      label: "Launch sites",
      description: "Confirm or edit the included 20-site candidate catalog; select 1–20 sites per run.",
      example: "Product Hunt, Fazier, BetaList, Peerlist, or all 20 candidates",
    },
    {
      label: "Approved product facts",
      description: "Product details, links, audience and claims you allow the routines to use.",
      example: "Product name, website and approved description",
    },
    {
      label: "Account permissions",
      description: "Explicit permission for any account or profile preparation; research-only is the default.",
      example: "Research only for all sites",
    },
  ],
  timeAndEffort: {
    youPrepare: "Your product facts, links, target sites, and any account permissions.",
    runEstimate: "Varies by site count and account access; review the drafts before publishing.",
  },
  customization: [
    {
      label: "Target launch sites",
      defaultValue: "Editable catalog of 20 candidate sites",
      allowed: "1–20 selected sites",
      note: "Confirm the sites for this run; some may be ineligible or require a paid route.",
    },
    {
      label: "Account preparation",
      defaultValue: "Research only",
      allowed: "Research only or approved site-specific preparation",
      note: "Permission must be explicit.",
    },
  ],
  thirdParties: [
    {
      name: "SourceForge",
      domain: "sourceforge.net",
      actions: ["reads public pages"],
      cost: "Cost not listed",
      note: "Candidate only; confirm current product fit, access, rules and cost before any preparation.",
      reviewNote:
        "Check the correct software-directory route and availability; the open-source project route has separate requirements.",
    },
    {
      name: "Product Hunt",
      domain: "producthunt.com",
      actions: ["reads public pages", "prepares a profile"],
      cost: "Free",
      note: "Check current account eligibility and launch rules. No official affiliation.",
      reviewNote: "",
    },
  ],
} as const;
