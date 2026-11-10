import { renderText } from "./render";
import assert from "node:assert/strict";
import { createElement } from "react";
import { TOONE_PRO_SELLERS } from "../../lib/legal/seller";
import WebSales from "../../app/[locale]/legal-notice/WebSales";
import fs from "node:fs";
import test from "node:test";
import { ENGLISH_ONLY_PATHS } from "../../i18n/routing";
import { LEGAL_TRADER, TODO_OWNER, isOwnerPlaceholder, unresolvedTraderFields } from "../../lib/legal/trader";
import { GET as siteSitemap } from "../../app/sitemap.xml/route";

const read = (path: string) => fs.readFileSync(path, "utf8");
const PAGE = "app/[locale]/legal-notice/page.tsx";

test("the legal notice page exists, is English only and indexable in English", () => {
  assert.ok(fs.existsSync(PAGE));
  const page = read(PAGE);
  assert.match(page, /redirectToEnglish\("\/en\/legal-notice"/);
  assert.match(page, /robots: localeRobots\(locale\)/);
  assert.match(page, /canonical: CANONICAL/);
  assert.match(page, /"https:\/\/trytoone\.com\/en\/legal-notice"/);
  const englishOnly: readonly string[] = ENGLISH_ONLY_PATHS;
  assert.ok(englishOnly.includes("/legal-notice"));
});

test("the legal notice is in the footer and the sitemap", async () => {
  assert.match(read("components/Footer.tsx"), /<Link href="\/legal-notice">/);
  assert.match(read("app/sitemap.xml/route.ts"), /\{ path: "\/legal-notice", source: "app\/\[locale\]\/legal-notice\/page\.tsx" \}/);
  const xml = await (await siteSitemap()).text();
  assert.match(xml, /<loc>https:\/\/trytoone\.com\/en\/legal-notice<\/loc>/);
});

test("the legal notice renders every trader field from lib/legal/trader.ts", () => {
  const page = read(PAGE);
  const rendered = [...page.matchAll(/"([a-zA-Z]+)"/g)].map((match) => match[1]);
  for (const key of Object.keys(LEGAL_TRADER)) assert.ok(rendered.includes(key), `${key} is not rendered`);
  for (const key of ["fullName", "tradingName", "address", "email", "phone", "taxId", "activityCode", "complaintsBook", "adrEntity"]) {
    assert.ok(key in LEGAL_TRADER, key);
  }
  assert.match(page, /<WebSales seller=\{TOONE_PRO_SELLER\} \/>/);
});

test("the legal notice names the web seller for each seller model", () => {
  assert.deepEqual([...TOONE_PRO_SELLERS], ["managed_payments", "direct"]);
  const managed = renderText(createElement(WebSales, { seller: "managed_payments" }));
  assert.match(managed, /merchant of record is Sold through Link, LLC/);
  assert.match(managed, /Link support/);
  const direct = renderText(createElement(WebSales, { seller: "direct" }));
  assert.match(direct, /sold by the trader above, who issues a Portuguese legal invoice for every payment/);
  assert.match(direct, /Stripe Payments Europe, Limited, in Ireland/);
  assert.doesNotMatch(direct, /Link/);
});

test("owner placeholders live only in lib/legal/trader.ts", () => {
  assert.equal(TODO_OWNER, "TODO_OWNER");
  for (const file of [
    PAGE,
    "app/[locale]/legal-notice/WebSales.tsx",
    "app/[locale]/terms/page.tsx",
    "app/[locale]/terms/TermsContent.tsx",
    "app/[locale]/privacy/page.tsx",
    "app/[locale]/privacy/PrivacyContent.tsx",
    "lib/legal/terms.ts",
    "lib/legal/privacy.ts",
    "lib/legal/seller.ts",
  ]) {
    assert.doesNotMatch(read(file), /TODO_OWNER/, file);
  }
  assert.ok(isOwnerPlaceholder(`${TODO_OWNER}: x`));
  assert.ok(!isOwnerPlaceholder("Rua Example 1"));
  // Informational; the release gate is tests/legal/release-owner-data.test.ts.
  const missing = unresolvedTraderFields();
  if (missing.length) console.log(`[legal] owner data still missing: ${missing.join(", ")}`);
});
