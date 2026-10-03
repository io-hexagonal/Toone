import { LOCALE_CHOICE_COOKIE, locales, type Locale } from "@/i18n/routing";

/**
 * Language choice on the site, without touching the root redirect's meaning
 * for crawlers.
 *
 * `/` stays a permanent 308 to `/en` for everyone without an explicit choice
 * (proxy.ts, R6). The browser language is honoured on the client instead: the
 * language links let anyone switch, and a dismissible suggestion offers the
 * visitor's language when the page exists in it. Both only link to the page's
 * declared hreflang alternates, so they never send anyone to a page that does
 * not exist in that language, and nothing here ever redirects.
 *
 * Only the language links and the suggestion's "View in …" button store a
 * choice (the `toone_locale` cookie, which proxy.ts reads on `/` and on
 * unprefixed paths). "No thanks" stores a dismissal, never a language.
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

/** "No thanks" on the suggestion, per browser. Local storage only, never sent. */
export const LOCALE_DISMISSED_KEY = "toone.locale.dismissed";
/** Stored by the previous version, which also counted "No thanks" as a choice. */
const LEGACY_CHOICE_KEY = "toone.locale.choice";
/** next-intl's cookie, written by the previous picker for a year. Now unread. */
const LEGACY_COOKIE = "NEXT_LOCALE";
const CHOICE_MAX_AGE = 60 * 60 * 24 * 365;

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

/** The explicit choice in a `Cookie` header string (`document.cookie`). */
export function localeChoiceFromCookies(cookies: string): Locale | null {
  for (const pair of cookies.split(";")) {
    const [name, ...value] = pair.trim().split("=");
    if (name === LOCALE_CHOICE_COOKIE) {
      const locale = value.join("=");
      return isLocale(locale) ? locale : null;
    }
  }
  return null;
}

export function savedLocaleChoice(): Locale | null {
  try {
    return localeChoiceFromCookies(document.cookie);
  } catch {
    return null;
  }
}

export function suggestionDismissed(): boolean {
  try {
    return window.localStorage.getItem(LOCALE_DISMISSED_KEY) != null;
  } catch {
    return false;
  }
}

/** Drops what the previous version stored, so none of it outlives this one. */
export function forgetLegacyChoice(): void {
  try {
    window.localStorage.removeItem(LEGACY_CHOICE_KEY);
  } catch {
    // Storage blocked: nothing was stored there either.
  }
  if (document.cookie.split(";").some((pair) => pair.trim().startsWith(`${LEGACY_COOKIE}=`))) {
    document.cookie = `${LEGACY_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

/**
 * Remembers an explicit choice (a language link or "View in …") for a year,
 * so `/` and unprefixed links open in it. A fresh choice also lifts an
 * earlier "No thanks": the suggestion then follows the language just chosen.
 */
export function rememberLocaleChoice(locale: Locale): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_CHOICE_COOKIE}=${locale}; path=/; max-age=${CHOICE_MAX_AGE}; samesite=lax${secure}`;
  try {
    window.localStorage.removeItem(LOCALE_DISMISSED_KEY);
  } catch {
    // Private mode: the cookie above still carries the choice.
  }
  forgetLegacyChoice();
}

/** "No thanks": stop suggesting on this browser. Stores no language. */
export function dismissLocaleSuggestion(): void {
  try {
    window.localStorage.setItem(LOCALE_DISMISSED_KEY, "1");
  } catch {
    // Private mode: the offer closes for this page only.
  }
  forgetLegacyChoice();
}

/**
 * Whether to offer another language on a page in `current`:
 * - never once the visitor dismissed the offer on this browser;
 * - otherwise the target is their explicit choice, or, without one, the
 *   first browser language the site supports;
 * - offered only when it differs from `current` and this page exists in it.
 * Never a redirect: the language in the URL is the one served.
 */
export function localeAction(input: {
  current: Locale;
  languages: readonly string[];
  saved: Locale | null;
  dismissed: boolean;
  alternates: Partial<Record<Locale, string>>;
}): { kind: "none" } | { kind: "suggest"; locale: Locale; href: string } {
  const { current, languages, saved, dismissed, alternates } = input;
  if (dismissed) return { kind: "none" };
  const target = saved ?? preferredSupportedLocale(languages);
  if (target && target !== current && alternates[target]) {
    return { kind: "suggest", locale: target, href: alternates[target] };
  }
  return { kind: "none" };
}
