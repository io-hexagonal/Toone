import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  APPLE_STANDARD_EULA_URL,
  TERMS_CANONICAL,
} from "../../lib/legal/terms";
import { ENGLISH_ONLY_PATHS, locales } from "../../i18n/routing";

const read = (path: string) => fs.readFileSync(path, "utf8");
const page = read("app/[locale]/terms/page.tsx");

test("Terms page points Store users to Apple's standard EULA", () => {
  assert.equal(TERMS_CANONICAL, "https://trytoone.com/en/terms");
  assert.equal(APPLE_STANDARD_EULA_URL, "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/");
  assert.match(page, /APPLE_STANDARD_EULA_URL/);
  assert.match(page, /Mac App Store edition/);
  assert.match(page, /custom App Store license agreement/);
  assert.doesNotMatch(page, /DRAFT|TERMS_SECTIONS|LICENSE GRANT/);
});

test("Terms and privacy remain discoverable", () => {
  const sitemap = read("app/sitemap.xml/route.ts");
  const footer = read("components/Footer.tsx");
  assert.match(sitemap, /\{ path: "\/terms", source: "app\/\[locale\]\/terms\/page\.tsx" \}/);
  assert.match(footer, /<Link href="\/terms">/);
  assert.match(footer, /<Link href="\/privacy">/);
});

test("footer Terms labels exist in every locale", () => {
  for (const locale of locales) {
    const messages = JSON.parse(read(`messages/${locale}.json`));
    assert.equal(typeof messages.footer.terms, "string", locale);
  }
});

test("footer links to English-only pages resolve to /en/ (Ahrefs F32, TECH-020)", () => {
  const englishOnly: readonly string[] = ENGLISH_ONLY_PATHS;
  assert.ok(englishOnly.includes("/terms"));
  assert.match(read("lib/navigation.ts"), /ENGLISH_ONLY_PATHS\.some\(/, "Link resolves the shared list to /en");

  const footer = read("components/Footer.tsx");
  for (const [, href] of footer.matchAll(/<Link href="(\/[a-z-]+)">/g)) {
    const pagePath = `app/[locale]${href}/page.tsx`;
    if (!fs.existsSync(pagePath)) continue;
    const source = read(pagePath);
    if (!source.includes(`redirectToEnglish("/en${href}"`) && !source.includes(`permanentRedirect("/en${href}")`)) continue;
    assert.ok(englishOnly.includes(href), `${href} redirects non-English locales but is missing from ENGLISH_ONLY_PATHS`);
  }
});
