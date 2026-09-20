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
  eyebrow: string;
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
};

export const announcements: Announcement[] = [
  {
    id: "first-believers-2026-09",
    startsAt: "2026-09-20T00:00:00+01:00",
    endsAt: "2026-09-27T23:59:59+01:00",
    // Placeholder until the campaign artwork is added under /public/assets/announcements.
    image: "/assets/screenshots/desktop-chat.png",
    imageAlt: "Toone desktop app",
    eyebrow: "Early access · Product Hunt week",
    title: "Lost your chance to download Toone?",
    body: "Install it now with the code below. It works for everyone who wanted in during launch week and stays valid until Sunday, 27 September.",
    code: "FIRSTBELIEVERS",
    cta: { label: "Install Toone", href: "/invite#code=FIRSTBELIEVERS" },
    dismissLabel: "Maybe later",
  },
];
