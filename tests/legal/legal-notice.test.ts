import { renderText } from "./render";
import assert from "node:assert/strict";
import { createElement } from "react";
import { TOONE_PRO_SELLERS } from "../../lib/legal/seller";
import WebSales from "../../app/[locale]/legal-notice/WebSales";
import fs from "node:fs";
import test from "node:test";
import { ENGLISH_ONLY_PATHS } from "../../i18n/routing";
import { LEGAL_TRADER, TODO_OWNER, TRADER_DETAILS_COMPLETE, isOwnerPlaceholder, unresolvedTraderFields } from "../../lib/legal/trader";
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

test("the legal notice is in the footer and the sitemap only once the trader details are complete", async () => {
  assert.match(read("components/Footer.tsx"), /\{TRADER_DETAILS_COMPLETE && <Link href="\/legal-notice">Legal notice<\/Link>\}/);
  const sitemap = read("app/sitemap.xml/route.ts");
  assert.match(sitemap, /LEGAL_NOTICE_ROUTE = \{ path: "\/legal-notice", source: "app\/\[locale\]\/legal-notice\/page\.tsx" \}/);
  assert.match(sitemap, /\.\.\.\(TRADER_DETAILS_COMPLETE \? \[LEGAL_NOTICE_ROUTE\] : \[\]\)/);
  const xml = await (await siteSitemap()).text();
  assert.equal(xml.includes("<loc>https://trytoone.com/en/legal-notice</loc>"), TRADER_DETAILS_COMPLETE);
});

test("the legal notice page is a 404 while any trader field still waits for the owner", () => {
  assert.equal(TRADER_DETAILS_COMPLETE, unresolvedTraderFields().length === 0);
  const page = read(PAGE);
  const body = page.slice(page.indexOf("export default async function LegalNoticePage"));
  assert.match(body, /^export default async function LegalNoticePage\([^)]*\) \{\s*\/\/[^\n]*\n\s*if \(!TRADER_DETAILS_COMPLETE\) notFound\(\);/);
});

test("the legal notice renders every trader field from lib/legal/trader.ts", () => {
  const page = read(PAGE);
  const rendered = [...page.matchAll(/"([a-zA-Z]+)"/g)].map((match) => match[1]);
  for (const key of Object.keys(LEGAL_TRADER)) assert.ok(rendered.includes(key), `${key} is not rendered`);
  for (const key of ["fullName", "tradingName", "address", "email", "phone", "taxId", "activityCode", "complaintsBook", "adrEntity"]) {
    assert.ok(key in LEGAL_TRADER, key);
  }
  assert.match(page, /<WebSales seller=\{seller\} \/>/);
});

test("the legal notice names both web sellers, whoever sells new purchases", () => {
  assert.deepEqual([...TOONE_PRO_SELLERS], ["managed_payments", "direct"]);
  for (const seller of [...TOONE_PRO_SELLERS, null]) {
    const text = renderText(createElement(WebSales, { seller }));
    assert.match(text, /Web purchases of Toone Pro are sold in one of two ways\. Checkout shows which one applies before you pay, the purchase confirmation email names it, and a purchase keeps it for its renewals and refunds/, `${seller}`);
    assert.match(text, /Sold through Link: .*merchant of record is Sold through Link, LLC/, `${seller}`);
    assert.match(text, /Link support/, `${seller}`);
    assert.match(text, /Sold by Toone: sold by the trader above, who issues a Portuguese legal invoice for every payment/, `${seller}`);
    assert.match(text, /Stripe Payments Europe, Limited, in Ireland/, `${seller}`);
  }
  assert.match(renderText(createElement(WebSales, { seller: "managed_payments" })), /New purchases are currently sold through Link\./);
  assert.match(renderText(createElement(WebSales, { seller: "direct" })), /New purchases are currently sold by Toone\./);
  assert.doesNotMatch(renderText(createElement(WebSales, { seller: null })), /currently sold/);
});

test("the trader identity is filled in: name, trading name, address, email and tax number", () => {
  const resolved = new Set(Object.keys(LEGAL_TRADER).filter((key) => !unresolvedTraderFields().includes(key as never)));
  for (const key of ["fullName", "tradingName", "address", "email", "taxId"]) assert.ok(resolved.has(key), key);
  assert.match(LEGAL_TRADER.fullName.value, /^Matheus Paranhos, sole trader \(empresário em nome individual\)$/);
  assert.equal(LEGAL_TRADER.tradingName.value, "Toone", "the trading name is Toone alone, as on the server's purchase confirmation");
  assert.equal(LEGAL_TRADER.address.value, "R. António Manuel Frutuoso 54, 3700-042 São João da Madeira (Porto Metropolitan Area), Portugal");
  assert.equal(LEGAL_TRADER.taxId.value, "PT308520050");
  assert.deepEqual([LEGAL_TRADER.email.value, LEGAL_TRADER.email.href], ["hello@trytoone.com", "mailto:hello@trytoone.com"]);
});

test("the About page names the same publisher as the trader details", () => {
  const about = read("app/[locale]/about/page.tsx");
  const flat = about.replace(/\s+/g, " ");
  assert.match(flat, /Toone is an independent product published by Matheus Paranhos, a sole trader \(empresário em nome individual\) in Portugal, trading as Toone, and published under his\{` `\} <a href="https:\/\/www\.hexagonal\.io\/">Hexagonal\.io<\/a> brand\./);
  assert.match(flat, /a macOS app published by Matheus Paranhos, a sole trader in Portugal \(Hexagonal\.io\)/);
  assert.match(flat, /TRADER_DETAILS_COMPLETE \? <a href=\{`\/en\$\{LEGAL_NOTICE_PATH\}`\}>Legal notice<\/a> : <a href="\/en\/terms#toone-pro">Terms<\/a>\}/);
  assert.doesNotMatch(about, /macOS app by Hexagonal\.io, founded by/);
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
