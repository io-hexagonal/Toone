import assert from "node:assert/strict";
import { test } from "node:test";
import {
  localeAction,
  localeHref,
  preferredSupportedLocale,
  readAlternates,
} from "../../lib/locale-preference";

const homeAlternates = { en: "/en", fr: "/fr", pt: "/pt", de: "/de" } as const;

test("browser languages resolve by base tag, first supported wins", () => {
  assert.equal(preferredSupportedLocale(["fr-FR", "fr", "en-US"]), "fr");
  assert.equal(preferredSupportedLocale(["pt-BR"]), "pt");
  assert.equal(preferredSupportedLocale(["ja-JP", "de-CH", "en"]), "de");
  assert.equal(preferredSupportedLocale(["ja", "zh-CN"]), null);
  assert.equal(preferredSupportedLocale([]), null);
});

test("a French browser on /en is offered the French page", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR", "en"], saved: null, alternates: homeAlternates, enteredFromOutside: true }),
    { kind: "suggest", locale: "fr", href: "/fr" },
  );
});

test("no offer when the browser already matches, or the page has no version in that language", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["en-GB"], saved: null, alternates: homeAlternates, enteredFromOutside: true }),
    { kind: "none" },
  );
  // How-to and the Journal are English only: their alternates list only en.
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR"], saved: null, alternates: { en: "/en/how-to" }, enteredFromOutside: true }),
    { kind: "none" },
  );
});

test("a saved choice silences the offer, even when it is the current language", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["fr-FR"], saved: "en", alternates: homeAlternates, enteredFromOutside: true }),
    { kind: "none" },
  );
});

test("a returning visitor who chose French is sent back to French only when arriving from outside", () => {
  assert.deepEqual(
    localeAction({ current: "en", languages: ["en"], saved: "fr", alternates: homeAlternates, enteredFromOutside: true }),
    { kind: "redirect", locale: "fr", href: "/fr" },
  );
  assert.deepEqual(
    localeAction({ current: "en", languages: ["en"], saved: "fr", alternates: homeAlternates, enteredFromOutside: false }),
    { kind: "none" },
    "an in-site click to English is never overridden",
  );
  assert.deepEqual(
    localeAction({ current: "en", languages: ["en"], saved: "fr", alternates: { en: "/en/journal" }, enteredFromOutside: true }),
    { kind: "none" },
    "no redirect to a page that does not exist in the chosen language",
  );
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

test("picker falls back to the language home when the page has no alternate", () => {
  assert.equal(localeHref("fr", { fr: "/fr/privacy" }), "/fr/privacy");
  assert.equal(localeHref("ru", { fr: "/fr/privacy" }), "/ru");
});
