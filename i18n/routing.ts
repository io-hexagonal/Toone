import { defineRouting } from "next-intl/routing";

export const locales = ["en", "pt", "es", "fr", "de", "it", "nl", "ru"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Metadata owns hreflang so the HTML and sitemap can share one canonical
  // x-default. next-intl's automatic Link header uses unprefixed defaults,
  // which conflicted with the governed /en x-default URLs.
  alternateLinks: false,
});
