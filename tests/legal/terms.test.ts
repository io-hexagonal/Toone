import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  APPLE_STANDARD_EULA_URL,
  TERMS_CANONICAL,
} from "../../lib/legal/terms";
import { locales } from "../../i18n/routing";

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
