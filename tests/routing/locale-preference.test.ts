import assert from "node:assert/strict";
import { test } from "node:test";
import { locales } from "../../i18n/routing";
import { openGraphLocale } from "../../i18n/open-graph";
import {
  localeAction,
  localeChoiceFromCookies,
  localeHref,
  preferredSupportedLocale,
  readAlternates,
} from "../../lib/locale-preference";

const homeAlternates = { en: "/en", fr: "/fr", pt: "/pt", de: "/de" } as const;
const noChoice = { saved: null, dismissed: false } as const;

test("browser languages resolve by base tag, first supported wins", () => {
  assert.equal(preferredSupportedLocale(["fr-FR", "fr", "en-US"]), "fr");
  assert.equal(preferredSupportedLocale(["pt-BR"]), "pt");
  assert.equal(preferredSupportedLocale(["ja-JP", "de-CH", "en"]), "de");
  assert.equal(preferredSupportedLocale(["ja", "zh-CN"]), null);
  assert.equal(preferredSupportedLocale([]), null);
});

test("a French browser on /en is offered the French page", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR", "en"], ...noChoice, alternates: homeAlternates }),
    { kind: "suggest", locale: "fr", href: "/fr" },
  );
});

test("no offer when the browser already matches, or the page has no version in that language", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["en-GB"], ...noChoice, alternates: homeAlternates }),
    { kind: "none" },
  );
  // How-to and the Journal are English only: their alternates list only en.
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR"], ...noChoice, alternates: { en: "/en/how-to" } }),
    { kind: "none" },
  );
});

test("an explicit choice beats the browser languages", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR"], saved: "de", dismissed: false, alternates: homeAlternates }),
    { kind: "suggest", locale: "de", href: "/de" },
  );
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR"], saved: "en", dismissed: false, alternates: homeAlternates }),
    { kind: "none" },
    "having chosen the current language, a French browser is not asked again",
  );
  assert.deepEqual(
    localeAction({ current: "pt", languages: ["en"], saved: "pt", dismissed: false, alternates: homeAlternates }),
    { kind: "none" },
  );
});

test("a dismissal never yields an offer, whatever the choice or browser", () => {
  for (const saved of [null, "fr", "en"] as const) {
    for (const languages of [["fr-FR"], ["de"], ["en"]]) {
      assert.deepEqual(
        localeAction({ current: "en", languages, saved, dismissed: true, alternates: homeAlternates }),
        { kind: "none" },
        `saved=${saved} languages=${languages}`,
      );
    }
  }
});

test("localeAction never redirects: a search result in one language opens in it", () => {
  const alternates = Object.fromEntries(locales.map((locale) => [locale, `/${locale}`]));
  for (const current of locales) {
    for (const saved of [null, ...locales]) {
      for (const dismissed of [false, true]) {
        for (const languages of [[], ["pt-BR"], ["ja", "de-CH"], ["en-US"]]) {
          const action = localeAction({ current, languages, saved, dismissed, alternates });
          assert.ok(action.kind === "none" || action.kind === "suggest", JSON.stringify(action));
          if (action.kind === "suggest") assert.notEqual(action.locale, current);
        }
      }
    }
  }
});

test("the explicit choice is read from toone_locale only", () => {
  assert.equal(localeChoiceFromCookies("a=1; toone_locale=pt; b=2"), "pt");
  assert.equal(localeChoiceFromCookies("toone_locale=zz"), null);
  assert.equal(localeChoiceFromCookies("NEXT_LOCALE=pt"), null, "next-intl's cookie is not a choice");
  assert.equal(localeChoiceFromCookies("my_toone_locale=pt"), null);
  assert.equal(localeChoiceFromCookies(""), null);
});

test("hreflang links become same-origin paths; unknown languages and x-default are ignored", () => {
  const links = [
    ["fr", "https://trytoone.com/fr/privacy"],
    ["pt", "/pt/privacy?ref=x"],
    ["x-default", "https://trytoone.com/en/privacy"],
    ["ja", "https://trytoone.com/ja/privacy"],
  ].map(([hreflang, href]) => ({
    getAttribute: (name: string) => (name === "hreflang" ? hreflang : name === "href" ? href : null),
  }));
  const root = { querySelectorAll: () => links } as unknown as ParentNode;

  assert.deepEqual(readAlternates(root, "https://trytoone.com"), {
    fr: "/fr/privacy",
    pt: "/pt/privacy?ref=x",
  });
});

test("language links fall back to the language home when the page has no alternate", () => {
  assert.equal(localeHref("fr", { fr: "/fr/privacy" }), "/fr/privacy");
  assert.equal(localeHref("ru", { fr: "/fr/privacy" }), "/ru");
});

test("og:locale is language_TERRITORY, with the page's other languages as alternates", () => {
  assert.deepEqual(openGraphLocale("pt"), {
    locale: "pt_BR",
    alternateLocale: ["en_US", "es_ES", "fr_FR", "de_DE", "it_IT", "nl_NL", "ru_RU"],
  });
  assert.deepEqual(openGraphLocale("en", ["en", "fr"]), { locale: "en_US", alternateLocale: ["fr_FR"] });
  assert.deepEqual(openGraphLocale("de", []), { locale: "de_DE" });
});
