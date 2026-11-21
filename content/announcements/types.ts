/**
 * Announcement data model. The modal shell (components/announcements/
 * AnnouncementModal.tsx) reads these entries, decides when and where one shows,
 * and hands it to the card component registered for its `kind`.
 */

export type AnnouncementRoutes =
  /** Every public page. */
  | "all"
  /**
   * Locale-relative paths without the language prefix: "/" is the home page,
   * "/business" the business landing. A trailing "*" matches a whole section,
   * e.g. "/guides/*".
   */
  | string[];

export type AnnouncementRepeat =
  /** Shown until dismissed once on that device; bump `version` to show it again. */
  | "once"
  /** Shown once per browser session. */
  | "every-session"
  /** Shown on every page load while active. */
  | "every-visit";

export type AnnouncementImage = {
  /** Landscape image under /public that fills the whole card (16:9 or wider). */
  src: string;
  alt?: string;
  /**
   * Framing on wide screens, where the copy occupies the left half. `scale`
   * enlarges the image (1 = fit) and `anchor` says which edge stays put: with
   * anchor "left" the image grows to the right, so a centred subject moves
   * into the free right-hand side.
   */
  framing?: { scale: number; anchor: "left" | "center" | "right" };
  /** CSS object-position on phones, where the card is tall and crops the sides (default "center 30%"). */
  narrowFocus?: string;
};

/** Additional editorial panels after a campaign's primary invitation panel. */
export type AnnouncementShowcasePanel = {
  id: string;
  eyebrow?: string;
  title: string;
  /** Omit when the artwork already says it (poster panels). */
  body?: string;
  image: AnnouncementImage;
  /** A commemorative line between laurels, above the title. */
  ribbon?: { kicker: string; title: string };
  items?: { title: string; description: string }[];
  /** Small line under the button, e.g. dates. */
  note?: string;
  cta: {
    label: string;
    /** Locale-relative destination, or a full https:// URL that opens in a new tab. */
    href: string;
  };
  /**
   * "poster": the artwork carries the message (a partner banner with its own
   * text). It is shown unshaded, the title is kept for screen readers only,
   * and the button sits at the bottom.
   */
  layout?: "poster";
};

type AnnouncementBase = {
  /** Stable key. Together with `version` it forms the dismissal key. */
  id: string;
  /** Bump when the content changes and everyone should see it again. */
  version: number;
  /** ISO timestamps with an explicit offset, checked in the visitor's browser. */
  startsAt: string;
  endsAt: string;
  routes: AnnouncementRoutes;
  repeat: AnnouncementRepeat;
  image: AnnouncementImage;
  /** Omit for the original single-panel modal. */
  panels?: AnnouncementShowcasePanel[];
  /** Defaults to 12 seconds; pauses while reading or interacting. */
  autoAdvanceMs?: number;
};

/** Small uppercase line above a title; leave it out for a cleaner card. */
type Copy = { eyebrow?: string; title: string; body: string; note?: string };

/**
 * An invitation code campaign. Mac visitors see the code and an install
 * button that goes straight through the invite flow; everyone else is offered
 * a notification for the Windows and Linux builds via the early-access form.
 */
export type AccessCodeAnnouncement = AnnouncementBase & {
  kind: "access-code";
  mac: Copy & {
    code: string;
    cta: { label: string; /** Locale-relative path; `#code=` prefills the invite form. */ href: string };
    dismissLabel?: string;
  };
  otherPlatforms: Copy & { ctaLabel: string; dismissLabel?: string };
};

/**
 * A news carousel with no code: the first panel is an editorial panel like
 * the ones that follow it, shown the same way on every platform.
 */
export type ShowcaseAnnouncement = AnnouncementBase & {
  kind: "showcase";
  intro: Omit<AnnouncementShowcasePanel, "id" | "image">;
};

/** Add new card kinds here as a union member, with a component in components/announcements. */
export type Announcement = AccessCodeAnnouncement | ShowcaseAnnouncement;

type WithoutDates<T> = T extends unknown ? Omit<T, "startsAt" | "endsAt"> : never;

/** Allows a development preview before an invitation's dates are confirmed. */
export type AnnouncementContent = WithoutDates<Announcement>;
