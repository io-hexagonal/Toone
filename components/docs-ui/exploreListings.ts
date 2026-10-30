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
