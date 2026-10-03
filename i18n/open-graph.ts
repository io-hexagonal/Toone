import { locales, type Locale } from "./routing";

/**
 * `og:locale` takes `language_TERRITORY`; a bare language (`pt`) is not a
 * valid value. Each territory is the market that locale's copy is written for.
 */
export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: "en_US",
  pt: "pt_BR",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  it: "it_IT",
  nl: "nl_NL",
  ru: "ru_RU",
};

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * `openGraph.locale` and `openGraph.alternateLocale` for a page in `locale`.
 * `available` lists the locales the page exists in — the same set as its
 * hreflang alternates, so a page without alternates declares none here.
 */
export function openGraphLocale(
  locale: string,
  available: readonly string[] = locales,
): { locale: string; alternateLocale?: string[] } {
  const own = isLocale(locale) ? locale : "en";
  const alternateLocale = available
    .filter((other): other is Locale => isLocale(other) && other !== own)
    .map((other) => OPEN_GRAPH_LOCALES[other]);
  return alternateLocale.length
    ? { locale: OPEN_GRAPH_LOCALES[own], alternateLocale }
    : { locale: OPEN_GRAPH_LOCALES[own] };
}
