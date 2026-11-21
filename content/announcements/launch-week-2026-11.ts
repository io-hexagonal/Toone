import type { AnnouncementShowcasePanel, ShowcaseAnnouncement } from "./types";

/**
 * Week after the Product Hunt launch: the #3 thank-you, the AppSumo Black
 * Friday sale and the new Product Hunt routines in Product Launch Essentials.
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
  id: "product-hunt-launch-routines",
  eyebrow: "New in Product Launch Essentials",
  title: "New Product Launch routines",
  body: "Toone's own Product Hunt launch, turned into routines you can run for yours.",
  image: {
    src: "/assets/announcements/product-hunt-launch-routines.webp",
    alt: "Warm coral and violet nebula from the Product Launch Essentials cover",
  },
  items: [
    {
      title: "Day Launch",
      description: "On your launch day, reach the people behind the other launches while the day is live.",
    },
    {
      title: "PH Prospection & Connection",
      description: "Build a network on Product Hunt before you launch, so you arrive with people who know you.",
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
