import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es", "pt", "it", "fr", "de", "nl", "ru"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
});
