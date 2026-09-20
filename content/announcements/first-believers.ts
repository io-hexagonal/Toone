import type { AccessCodeAnnouncement } from "./types";

/** Launch-week recovery: the FIRSTBELIEVERS shared code, live until it expires. */
export const firstBelievers: AccessCodeAnnouncement = {
  kind: "access-code",
  id: "first-believers-2026-09",
  version: 1,
  startsAt: "2026-09-20T00:00:00+01:00",
  // Matches the FIRSTBELIEVERS shared code, which expires Sunday 27 Sep at 11:50 UTC.
  endsAt: "2026-09-27T11:50:00Z",
  routes: "all",
  repeat: "once",
  image: {
    src: "/assets/announcements/first-believers.webp",
    alt: "Toone's cat holding a glowing orb among the stars",
    framing: { scale: 1.35, anchor: "left" },
  },
  mac: {
    title: "Lost your chance to download Toone?",
    body: "Install it now with the code below. It works for everyone who wanted in during launch week and stays valid until Sunday, 27 September.",
    code: "FIRSTBELIEVERS",
    cta: { label: "Install Toone", href: "/invite#code=FIRSTBELIEVERS" },
    dismissLabel: "Maybe later",
  },
  otherPlatforms: {
    title: "Toone is on macOS today.",
    body: "Windows and Linux builds are next. Want to hear the moment yours is ready? Leave your email and we'll let you know.",
    ctaLabel: "Notify me",
    dismissLabel: "No thanks",
  },
};
