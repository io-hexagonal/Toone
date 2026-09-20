/**
 * Site-wide announcements shown in a modal on the public landing pages.
 *
 * Add a new entry to run another campaign. Each one shows only between
 * `startsAt` and `endsAt` (checked in the visitor's browser at page load), so
 * it disappears on its own with no redeploy. Dates carry an explicit offset
 * so "until Sunday" means Sunday in Lisbon, not wherever the visitor is.
 *
 * When several are active at once, the first in this list wins. A visitor who
 * dismisses one does not see it again on that device; a new `id` resets that.
 */
export type Announcement = {
  /** Stable key, also the localStorage dismissal key. Change it to re-show. */
  id: string;
  startsAt: string;
  endsAt: string;
  /** Landscape image under /public that fills the whole card (16:9 or wider works best). */
  image: string;
  imageAlt?: string;
  /**
   * Framing on wide screens, where the copy occupies the left half. `scale`
   * enlarges the image (1 = fit) and `anchor` says which edge stays put: with
   * anchor "left" the image grows to the right, so a centred subject moves
   * into the free right-hand side.
   */
  imageFraming?: { scale: number; anchor: "left" | "center" | "right" };
  /** Small uppercase line above the title. Leave it out for a cleaner card. */
  eyebrow?: string;
  title: string;
  body: string;
  /** Invitation code to display with a copy button. */
  code?: string;
  cta: {
    label: string;
    /** Locale-relative path; `#code=` prefills the invite form. */
    href: string;
  };
  dismissLabel: string;
  /**
   * Shown instead of the code and install button when the visitor is not on a
   * Mac. Its button closes the card and focuses the early-access email field so
   * they can ask to be told when the Windows and Linux builds ship.
   */
  otherPlatforms: {
    eyebrow?: string;
    title: string;
    body: string;
    ctaLabel: string;
    dismissLabel: string;
  };
};

export const announcements: Announcement[] = [
  {
    id: "first-believers-2026-09",
    startsAt: "2026-09-20T00:00:00+01:00",
    // Matches the FIRSTBELIEVERS shared code, which expires Sunday 27 Sep at 11:50 UTC.
    endsAt: "2026-09-27T11:50:00Z",
    image: "/assets/announcements/first-believers.webp",
    imageAlt: "Toone's cat holding a glowing orb among the stars",
    imageFraming: { scale: 1.35, anchor: "left" },
    title: "Lost your chance to download Toone?",
    body: "Install it now with the code below. It works for everyone who wanted in during launch week and stays valid until Sunday, 27 September.",
    code: "FIRSTBELIEVERS",
    cta: { label: "Install Toone", href: "/invite#code=FIRSTBELIEVERS" },
    dismissLabel: "Maybe later",
    otherPlatforms: {
      title: "Toone is on macOS today.",
      body: "Windows and Linux builds are next. Want to hear the moment yours is ready? Leave your email and we'll let you know.",
      ctaLabel: "Notify me",
      dismissLabel: "No thanks",
    },
  },
];
