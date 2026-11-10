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

test("Terms state the Toone Pro web purchase terms (Stripe Managed Payments, sold through Link)", () => {
  assert.match(page, /<section id="toone-pro">/);
  assert.match(page, /<h2>Toone Pro<\/h2>/);
  for (const phrase of [
    /Toone Pro Monthly/,
    /Toone Pro Yearly/,
    /Toone Pro Lifetime/,
    /Stripe&apos;s Managed Payments service/,
    /merchant of record is Sold through Link, LLC/,
    /&quot;Sold through Link&quot;/,
    /LINK_TERMS_URL/,
    /renew automatically every month or every year until you cancel/,
    /Prices in euros include VAT/,
    /before\s+sales tax/,
    /never\s+sees your full card number/,
    /Manage subscription/,
    /Toone Pro stays on until the end of the period you have paid for/,
    /at\s+least 30 days before the new price applies/,
    /consumer in Germany/,
    /Switching between Monthly and Yearly is not offered yet/,
    /full refund of your first payment within/,
    /withdraw from the contract within/,
    /Withdraw from contract here/,
    /Cancel contract here/,
    /I hereby give notice that I withdraw/,
    /Deleting your Toone account cancels a web subscription at once/,
    /Checkout is refused while your account already has a/,
    /Decreto-Lei 84\/2021/,
    /governed by Portuguese law/,
    /mandatory rules of the country where you live/,
    /Livro de\s+Reclamações Eletrónico/,
    /alternative dispute\s+resolution entity/,
  ]) {
    assert.match(page, phrase);
  }
});

test("Terms link the withdraw/cancel page, the legal notice, pricing and account pages", async () => {
  const terms = await import("../../lib/legal/terms");
  assert.equal(terms.CANCEL_CONTRACT_PATH, "/cancel-contract");
  assert.equal(terms.LEGAL_NOTICE_PATH, "/legal-notice");
  assert.equal(terms.ACCOUNT_PATH, "/account");
  assert.equal(terms.PRICING_PATH, "/pricing");
  for (const constant of ["CANCEL_CONTRACT_PATH", "LEGAL_NOTICE_PATH", "ACCOUNT_PATH", "PRICING_PATH"]) {
    assert.match(page, new RegExp(`href=\\{\`/en\\$\\{${constant}\\}\`\\}`), constant);
  }
  const labels = [...page.matchAll(/CANCEL_CONTRACT_PATH\}`\}>((?:Withdraw from|Cancel) contract here)</g)].map((m) => m[1]);
  assert.deepEqual(labels.sort(), ["Cancel contract here", "Withdraw from contract here"]);
});

test("Terms keep the Apple (Mac App Store) section for when Pro is sold there, without steering", () => {
  assert.match(page, /id="app-store"/);
  assert.match(page, /Toone Pro is not sold in Toone \(Mac App Store\) yet/);
  for (const phrase of [
    /charged to\s+your Apple Account/,
    /at least 24 hours before the end of the current period/,
    /App Store account settings/,
    /APPLE_REPORT_A_PROBLEM_URL/,
    /APPLE_MANAGE_SUBSCRIPTIONS_URL/,
    /Restore\s+Purchases links it again only to that same account/,
    /once per Apple Account/,
    /APPLE_STANDARD_EULA_URL[\s\S]*continues to govern/,
  ]) {
    assert.match(page, phrase);
  }
  assert.doesNotMatch(page, /sold only as an Apple in-app purchase|trytoone\.com\s+does not sell Toone Pro/);
});

test("Terms state the free plan and codes", () => {
  assert.match(page, /each Toone account can create \{TOONE_PRO_FREE_ROUTINE_CREATIONS\}/);
  assert.match(page, /Installing a routine from Explore counts/);
  assert.match(page, /Running routines is never limited/);
  assert.match(page, /\{TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS\} routine creations/);
  assert.match(page, /id="codes"/);
  for (const phrase of [
    /no cash value/,
    /once per person and per Toone account/,
    /verified email address/,
    /cannot be redeemed while your\s+account has a paid Toone Pro plan/,
    /not used up when it is refused/,
    /Codes\s+for extra routine creations can always be redeemed/,
    /Discount codes\s+are different/,
    /obtained by fraud, by mistake/,
    /does not include guest months to give/,
  ]) {
    assert.match(page, phrase);
  }
});

test("Toone Pro numbers match the server's limits (free plan = 2)", async () => {
  const terms = await import("../../lib/legal/terms");
  assert.equal(terms.TOONE_PRO_FREE_ROUTINE_CREATIONS, 2);
  assert.equal(terms.TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS, 5);
  assert.equal(terms.TOONE_PRO_GUEST_PASSES, 5);
  assert.equal(terms.TOONE_PRO_GUEST_MONTH_DAYS, 30);
  assert.equal(terms.TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS, 14);
  assert.equal(terms.TOONE_PRO_CODE_MAX_DAYS, 365);
  assert.equal(terms.APPLE_REPORT_A_PROBLEM_URL, "https://reportaproblem.apple.com");
  assert.notEqual(terms.TERMS_UPDATED_DATE, "September 28, 2026", "Terms date bumped with the Pro section");
});
