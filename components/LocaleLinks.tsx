"use client";

import { useLocale } from "next-intl";
import { locales } from "@/i18n/routing";
import { usePageAlternates } from "@/lib/hooks/usePageAlternates";
import {
  LOCALE_COPY,
  isLocale,
  localeHref,
  rememberLocaleChoice,
} from "@/lib/locale-preference";

/**
 * Every language, named in itself, as plain links in the footer. The server
 * HTML links each language home (`/pt`, `/de`, …), so every page carries
 * crawlable links to all eight; after hydration each link points at this
 * page's own version when it has one. A click stores the explicit choice
 * (the `toone_locale` cookie), like the header picker.
 */
export default function LocaleLinks() {
  const current = useLocale();
  const alternates = usePageAlternates();

  if (!isLocale(current)) return null;

  return (
    <nav className="ll" aria-label={LOCALE_COPY[current].label}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ll ul {
              display: flex; flex-wrap: wrap; gap: 6px 14px;
              margin: 0; padding: 0; list-style: none; max-width: 320px;
            }
            .ll a {
              color: rgba(255,255,255,0.62); text-decoration: none;
              font-size: 13px; transition: color 0.2s;
            }
            .ll a:hover, .ll a:focus-visible { color: rgba(255,255,255,0.95); }
            .ll a[aria-current="true"] { color: rgba(255,255,255,0.92); font-weight: 600; }
          `,
        }}
      />
      <ul>
        {locales.map((locale) => (
          <li key={locale}>
            <a
              href={localeHref(locale, alternates)}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              onClick={() => rememberLocaleChoice(locale)}
            >
              {LOCALE_COPY[locale].name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
