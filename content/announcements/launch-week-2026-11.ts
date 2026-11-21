import type { AnnouncementShowcasePanel, ShowcaseAnnouncement } from "./types";

/**
 * Week after the Product Hunt launch: the #3 thank-you, the AppSumo Black
 * Friday sale and what is new in Product Launch Essentials (Day Launch added,
 * Launch Surface Preparation updated).
 * Two windows share one id: version 2 starts when the AppSumo sale goes live,
 * so people who closed the "starts Sunday" version see the live one once.
 */
const APPSUMO = "https://appsumo.com/pl/dqCSEZkGYF";

const appsumo = (live: boolean): AnnouncementShowcasePanel => ({
  id: "appsumo-black-friday",
  layout: "poster",
  title: live ? "Toone is 10% off on AppSumo" : "Toone joins AppSumo's Black Friday sale",
  body: live
    ? "Black Friday is live on AppSumo. Toone is 10% off through Dec. 1 at noon CT. Pay once and keep it."
    : "Starting Sunday, Nov. 22 at 4 p.m. CT, Toone is 10% off the AppSumo price. Pay once and keep it.",
  image: { src: "/assets/announcements/appsumo-black-friday.webp", alt: "AppSumo Black Friday: Toone, 10% off, ends Dec. 1 at noon CT" },
  note: live ? "Live now. Pay once and keep it." : "Starts Sunday, Nov. 22 at 4 p.m. CT. Pay once and keep it.",
  cta: { label: live ? "Get 10% off on AppSumo" : "See Toone on AppSumo", href: APPSUMO },
});

const routines: AnnouncementShowcasePanel = {
  id: "product-launch-essentials-update",
  eyebrow: "New in Product Launch Essentials",
  title: "Now with a launch day routine",
  body: "Toone's own launch, turned into routines you can run for yours.",
  image: {
    src: "/assets/announcements/product-launch-essentials-2026-11.webp",
    alt: "Soft pink and rose spheres fading into pale blue, from the Product Launch Essentials cover",
  },
  items: [
    {
      title: "Day Launch",
      description: "New. On your launch day, run the outreach that matters and approve every message before it goes out.",
    },
    {
      title: "Launch Surface Preparation",
      description: "Updated. Get your accounts, profiles, checklists and unpublished drafts ready on the launch sites you choose.",
    },
  ],
  cta: { label: "Explore the bundle", href: "/explore/bundles/product-launch-essentials-trwv3k5g" },
};

const base = (live: boolean): Omit<ShowcaseAnnouncement, "startsAt" | "endsAt"> => ({
  kind: "showcase",
  id: "launch-week-2026-11",
  version: live ? 2 : 1,
  routes: "all",
  repeat: "once",
  autoAdvanceMs: 10_000,
  image: {
    src: "/assets/announcements/ph-3-product-of-the-day.webp",
    alt: "Toone's character holding a glowing orb next to the Product Hunt kitty, under a constellation of connected stars",
    framing: { scale: 1, anchor: "center" },
    narrowFocus: "64% 30%",
  },
  intro: {
    ribbon: { kicker: "Product Hunt · 18 Nov 2026", title: "#3 Product of the Day" },
    title: "Thank you for showing up.",
    body: "To everyone who upvoted, commented, tested the app or sent a good luck: the launch belongs to you as much as to Toone.",
    cta: { label: "Read the story", href: "/journal/toone-product-hunt-launch-3-product-of-the-day" },
  },
  panels: [appsumo(live), routines],
});

/** AppSumo's sale starts Sunday 22 Nov at 4 p.m. CT and ends Tuesday 1 Dec at noon CT. */
const SALE_STARTS = "2026-11-22T16:00:00-06:00";
const SALE_ENDS = "2026-12-01T12:00:00-06:00";

export const launchWeek: ShowcaseAnnouncement[] = [
  { ...base(false), startsAt: "2026-11-21T00:00:00-06:00", endsAt: SALE_STARTS },
  { ...base(true), startsAt: SALE_STARTS, endsAt: SALE_ENDS },
];

/** For ?preview-campaign= in development. */
export const launchWeekContent = { before: base(false), live: base(true) };
