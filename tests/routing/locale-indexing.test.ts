import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { locales } from "../../i18n/routing";
import { INDEXED_LOCALES, localeRobots, localeVersions } from "../../i18n/indexing";
import { GET as siteSitemap } from "../../app/sitemap.xml/route";

/** TECH-021 (playbook 1.11.0): English is the only indexed locale. */

const NON_ENGLISH = locales.filter((locale) => locale !== "en");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

test("English is the only indexed locale", () => {
  assert.deepEqual(INDEXED_LOCALES, ["en"]);
});

test("robots: index, follow in English; noindex, follow everywhere else", () => {
  assert.deepEqual(localeRobots("en"), { index: true, follow: true });
  assert.deepEqual(localeRobots("en", false), { index: false, follow: true });
  for (const locale of NON_ENGLISH) {
    assert.deepEqual(localeRobots(locale), { index: false, follow: true }, locale);
    assert.deepEqual(localeRobots(locale, true), { index: false, follow: true }, locale);
  }
});

test("language versions are same-origin paths in a private meta tag, never hreflang", () => {
  assert.deepEqual(JSON.parse(localeVersions("/resources")["toone-locale-versions"]), {
    en: "/en/resources",
    pt: "/pt/resources",
    es: "/es/resources",
    fr: "/fr/resources",
    de: "/de/resources",
    it: "/it/resources",
    nl: "/nl/resources",
    ru: "/ru/resources",
  });
  assert.deepEqual(JSON.parse(localeVersions("/about", ["en", "x-default"])["toone-locale-versions"]), {
    en: "/en/about",
  });
});

test("no metadata declares hreflang (`alternates.languages`)", () => {
  for (const file of [...sourceFiles("app"), ...sourceFiles("lib"), ...sourceFiles("components")]) {
    const source = fs.readFileSync(file, "utf8");
    // `languages: {…}` or a `languages` shorthand inside `alternates`.
    assert.ok(
      !/\blanguages:\s*\{/.test(source) &&
        !/alternates:\s*\{[^}]*\blanguages\b/.test(source),
      `${file} sets alternates.languages`,
    );
  }
});

test("no localized route hard-codes `index: true`; robots go through localeRobots", () => {
  for (const file of sourceFiles("app/[locale]")) {
    const source = fs.readFileSync(file, "utf8");
    assert.ok(!/index:\s*true/.test(source), `${file} hard-codes index: true`);
  }
});

test("every non-English path also gets an X-Robots-Tag: noindex, follow header", () => {
  const config = fs.readFileSync("next.config.ts", "utf8");
  const rule = config.match(
    /source: "\/:locale\(([a-z|]+)\)\/:path\*",\s*headers: \[\{ key: "X-Robots-Tag", value: "noindex, follow" \}\]/,
  );
  assert.ok(rule, "X-Robots-Tag rule missing from next.config.ts");
  assert.deepEqual(rule[1].split("|").sort(), [...NON_ENGLISH].sort());
});

test("/sitemap.xml lists English URLs only, with no hreflang alternates", async () => {
  const xml = await (await siteSitemap()).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0, "sitemap is empty");
  for (const url of urls) assert.match(url, /^https:\/\/trytoone\.com\/en(\/|$)/, url);
  assert.equal(new Set(urls).size, urls.length, "duplicate URLs");
  assert.ok(!xml.includes("xhtml") && !xml.includes("hreflang"), "sitemap carries hreflang");
  for (const route of ["/en", "/en/resources", "/en/business"]) {
    assert.ok(urls.includes(`https://trytoone.com${route}`), `${route} missing`);
  }
});
