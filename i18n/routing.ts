import { defineRouting } from "next-intl/routing";

export const locales = ["en", "pt", "es", "fr", "de", "it", "nl", "ru"] as const;
export type Locale = (typeof locales)[number];

/**
 * The visitor's explicit language choice. Written only by the language links
 * (header picker, footer list) and the suggestion's "View in …" button, read
 * by proxy.ts at the root and on unprefixed paths. Never set by the server.
 */
export const LOCALE_CHOICE_COOKIE = "toone_locale";

/**
 * Routes that only exist in English. Every other locale's copy of these paths,
 * and the unprefixed path, is one 308 to `/en/…` (proxy.ts); the pages keep
 * `redirectToEnglish` as a fallback. Keep in sync with those pages
 * (tests/routing/english-only.test.ts checks it).
 */
export const ENGLISH_ONLY_PATHS = [
  "/about",
  "/contact",
  "/editorial-policy",
  "/governance",
  "/how-to",
  "/journal",
  "/privacy",
  "/terms",
] as const;

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Metadata owns hreflang so the HTML and sitemap can share one canonical
  // x-default. next-intl's automatic Link header uses unprefixed defaults,
  // which conflicted with the governed /en x-default URLs.
  alternateLinks: false,
  // No NEXT_LOCALE cookie, read or written. next-intl set it on `/en` for
  // every visitor whose Accept-Language was not English, which then pinned
  // their unprefixed URLs to English for the session. The only remembered
  // language is the explicit choice in LOCALE_CHOICE_COOKIE.
  localeCookie: false,
});
