import type { AccessCodeAnnouncement } from "./types";

/** Explore invitation content. Its active window is registered in index.ts. */
export const explorePrereleaseContent = {
  kind: "access-code",
  id: "explore-prerelease-2026-09",
  version: 1,
  routes: "all",
  repeat: "once",
  image: {
    src: "/assets/announcements/explore-prerelease.webp",
    alt: "Soft indigo and teal fields converge in a luminous shared space",
    framing: { scale: 1, anchor: "center" },
  },
  autoAdvanceMs: 12_000,
  panels: [
    {
      id: "product-launch-essentials",
      eyebrow: "Inside Explore",
      title: "Product Launch Essentials",
      body: "Spend less time researching launch sites and rewriting your pitch. Get a clear plan for each site and a reviewed content package.",
      image: {
        src: "/assets/announcements/product-launch-essentials.webp",
        alt: "Soft coral, amber and violet fields from the Product Launch Essentials bundle cover",
        framing: { scale: 1, anchor: "center" },
      },
      items: [
        {
          title: "Launch Surface Preparation",
          description: "Discover 100+ launch sites, create your profiles, and get a launch strategy tailored to each platform.",
        },
        {
          title: "Launch Content Production",
          description: "Drafts grounded in your product facts, editorial review, and a content package ready for your approval.",
        },
      ],
      cta: {
        label: "Explore the bundle",
        href: "/explore/bundles/product-launch-essentials-trwv3k5g",
      },
    },
  ],
  mac: {
    eyebrow: "Explore is on pre-release",
    title: "Be there from the start.",
    body: "Put workflows made by experts to work for you. Discover routines for SEO, marketing, engineering, and design, ready to adapt to your own projects.",
    note: "Redeem the code before it expires to join the preview.",
    code: "EXPLORE",
    cta: { label: "Get a first look", href: "/invite#code=EXPLORE" },
  },
  otherPlatforms: {
    eyebrow: "Explore is on pre-release",
    title: "Be there from the start.",
    body: "Put workflows made by experts to work for you. Discover routines for SEO, marketing, engineering, and design, ready to adapt to your own projects.",
    note: "Join the waitlist for the launch. Running routines requires Toone for macOS.",
    ctaLabel: "Join the launch waitlist",
  },
} satisfies Omit<AccessCodeAnnouncement, "startsAt" | "endsAt">;
