import type { LaunchAnnouncement } from "./types";
import { LAUNCH_AT } from "@/lib/launch";
import { TOONE_PRO_FREE_ROUTINE_CREATIONS } from "@/lib/legal/terms";

export const PRODUCT_HUNT_URL = "https://www.producthunt.com/products/toone";

/**
 * Public launch, 18 November 2026. Starts at the launch gate (lib/launch.ts)
 * and ends when the PRODUCTHUNT code does (25 Nov, 23:59 UTC). Prices are
 * written the way the pricing page shows them (the API's EUR display price).
 */
export const publicLaunch: LaunchAnnouncement = {
  kind: "launch",
  id: "public-launch-2026-11",
  version: 1,
  startsAt: LAUNCH_AT,
  endsAt: "2026-11-25T23:59:00Z",
  // Public marketing pages only: never over sign-in, sign-up, codes, downloads or checkout.
  routes: [
    "/",
    "/business",
    "/pricing",
    "/resources",
    "/explore/*",
    "/guides/*",
    "/journal/*",
    "/about",
    "/contact",
    "/governance",
    "/editorial-policy",
  ],
  repeat: "once",
  image: {
    src: "/assets/announcements/first-believers.webp",
    alt: "Toone's cat holding a glowing orb among the stars",
    framing: { scale: 1.35, anchor: "left" },
  },
  mac: {
    title: "Toone is live",
    body: `Toone for Mac is open to everyone. Create a free account, download the app and bring your own Claude Code or Codex. Free accounts can create ${TOONE_PRO_FREE_ROUTINE_CREATIONS} routines.`,
    note: "Needs macOS 14 or later.",
    offer: {
      label: "Product Hunt offer",
      code: "PRODUCTHUNT",
      terms: "Lifetime for €37 instead of €199.99 with code PRODUCTHUNT, until Nov 25.",
    },
    cta: { label: "Download for Mac", href: "/download" },
    link: { label: "Toone on Product Hunt", href: PRODUCT_HUNT_URL, external: true },
    dismissLabel: "Maybe later",
  },
  otherPlatforms: {
    title: "Toone is live on Mac",
    body: "Toone is a Mac app for macOS 14 or later. Open trytoone.com on your Mac to create a free account and download it.",
    note: "Lifetime for €37 instead of €199.99 with code PRODUCTHUNT, until Nov 25.",
    link: { label: "Toone on Product Hunt", href: PRODUCT_HUNT_URL, external: true },
    dismissLabel: "Maybe later",
  },
};
