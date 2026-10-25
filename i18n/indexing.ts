import { locales, type Locale } from "./routing";

/**
 * Locales Search may index (playbook 02 Translations, TECH-021; owner
 * decision 2026-10-25). Today that is English alone. Every other locale stays
 * live for visitors, serves `noindex, follow` with a self-canonical, is absent
 * from every sitemap and is never declared as an hreflang alternate. With one
 * indexed locale, no page declares hreflang at all.
 *
 * next.config.ts backs this with an `X-Robots-Tag: noindex, follow` header on
 * every non-English path, so a route whose metadata forgets `localeRobots`
 * still stays out of the index.
 */
export const INDEXED_LOCALES: readonly Locale[] = ["en"];

export function isIndexedLocale(locale: string): boolean {
  return (INDEXED_LOCALES as readonly string[]).includes(locale);
}

/**
 * `robots` metadata for a page in `locale`. `indexable` is the page's own
 * answer (a published article, an approved record); it only counts in an
 * indexed locale. Route-level `robots` replaces the layout's (TECH-011), so
 * every route that sets `robots` goes through here.
 */
export function localeRobots(locale: string, indexable = true): { index: boolean; follow: true } {
  return { index: indexable && isIndexedLocale(locale), follow: true };
}

/**
 * `<meta name>` carrying a page's language versions for the language links and
 * the language suggestion (lib/locale-preference.ts). It replaced the hreflang
 * links they used to read. Search engines ignore it.
 */
export const LOCALE_VERSIONS_META = "toone-locale-versions";

/**
 * `other` metadata listing the locales a page exists in, as same-origin paths
 * (`{ en: "/en/resources", de: "/de/resources" }`). Next merges `other` by key,
 * so this sits beside the layout's verification tags instead of replacing them.
 */
export function localeVersions(
  path: string,
  available: readonly string[] = locales,
): Record<string, string> {
  const versions: Record<string, string> = {};
  for (const locale of available) {
    if ((locales as readonly string[]).includes(locale)) versions[locale] = `/${locale}${path}`;
  }
  return { [LOCALE_VERSIONS_META]: JSON.stringify(versions) };
}
