import { locales, type Locale } from "@/i18n/routing";

/**
 * Language choice on the site, without touching the root redirect.
 *
 * `/` stays a permanent 308 to `/en` (proxy.ts, R6), so the browser language
 * is honoured on the client instead: the picker lets anyone switch, and a
 * dismissible suggestion offers the visitor's language when the page exists
 * in it. Both only link to the page's declared hreflang alternates, so they
 * never send anyone to a page that does not exist in that language.
 */

/** Each language named in itself, plus the suggestion copy in that language. */
export const LOCALE_COPY: Record<
  Locale,
  { name: string; label: string; available: string; cta: string; dismiss: string }
> = {
  en: { name: "English", label: "Language", available: "This site is available in English.", cta: "View in English", dismiss: "No thanks" },
  pt: { name: "Português", label: "Idioma", available: "Este site está disponível em português.", cta: "Ver em português", dismiss: "Não, obrigado" },
  es: { name: "Español", label: "Idioma", available: "Este sitio está disponible en español.", cta: "Ver en español", dismiss: "No, gracias" },
  fr: { name: "Français", label: "Langue", available: "Ce site est disponible en français.", cta: "Voir en français", dismiss: "Non merci" },
  de: { name: "Deutsch", label: "Sprache", available: "Diese Seite gibt es auch auf Deutsch.", cta: "Auf Deutsch ansehen", dismiss: "Nein, danke" },
  it: { name: "Italiano", label: "Lingua", available: "Questo sito è disponibile in italiano.", cta: "Vedi in italiano", dismiss: "No, grazie" },
  nl: { name: "Nederlands", label: "Taal", available: "Deze site is beschikbaar in het Nederlands.", cta: "Bekijk in het Nederlands", dismiss: "Nee, bedankt" },
  ru: { name: "Русский", label: "Язык", available: "Этот сайт доступен на русском языке.", cta: "Открыть на русском", dismiss: "Нет, спасибо" },
};

/** The visitor's explicit choice (picker or suggestion), per browser. */
export const LOCALE_CHOICE_KEY = "toone.locale.choice";
/** next-intl's locale cookie, so unprefixed paths follow the choice too. */
const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

/**
 * First browser language the site supports, by base tag
 * (`["fr-FR", "en"]` → `fr`, `["pt-BR"]` → `pt`). `null` when none match.
 */
export function preferredSupportedLocale(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const base = tag.trim().toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/**
 * The page's language versions from its `<link rel="alternate" hreflang>`
 * tags (metadata API; may be streamed into the body). Same-origin paths only.
 */
export function readAlternates(root: ParentNode, origin: string): Partial<Record<Locale, string>> {
  const result: Partial<Record<Locale, string>> = {};
  root.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
    const lang = link.getAttribute("hreflang");
    const href = link.getAttribute("href");
    if (!isLocale(lang) || !href) return;
    try {
      const url = new URL(href, origin);
      result[lang] = `${url.pathname}${url.search}`;
    } catch {
      // Malformed href: offer nothing rather than a broken link.
    }
  });
  return result;
}

/** Where a language link should go: the page's alternate, else that language's home. */
export function localeHref(locale: Locale, alternates: Partial<Record<Locale, string>>): string {
  return alternates[locale] ?? `/${locale}`;
}

export function savedLocaleChoice(): Locale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_CHOICE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Remembers an explicit choice and aligns next-intl's cookie with it. */
export function rememberLocaleChoice(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_CHOICE_KEY, locale);
  } catch {
    // Private mode: the cookie below still carries the choice.
  }
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * What to do on a page in `current`, given the visitor's browser languages,
 * their saved choice and the page's alternates:
 * - `redirect`: they chose another language before and this page exists in
 *   it, and they arrived from outside the site (never fight in-site clicks);
 * - `suggest`: no choice yet, and their browser language differs and exists;
 * - `none` otherwise.
 */
export function localeAction(input: {
  current: Locale;
  languages: readonly string[];
  saved: Locale | null;
  alternates: Partial<Record<Locale, string>>;
  enteredFromOutside: boolean;
}): { kind: "none" } | { kind: "redirect" | "suggest"; locale: Locale; href: string } {
  const { current, languages, saved, alternates, enteredFromOutside } = input;
  if (saved) {
    if (saved !== current && enteredFromOutside && alternates[saved]) {
      return { kind: "redirect", locale: saved, href: alternates[saved] };
    }
    return { kind: "none" };
  }
  const preferred = preferredSupportedLocale(languages);
  if (preferred && preferred !== current && alternates[preferred]) {
    return { kind: "suggest", locale: preferred, href: alternates[preferred] };
  }
  return { kind: "none" };
}
