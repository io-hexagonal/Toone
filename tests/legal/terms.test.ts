import { renderHtml, renderText } from "./render";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import {
  APPLE_STANDARD_EULA_URL,
  TERMS_CANONICAL,
} from "../../lib/legal/terms";
import { TOONE_PRO_SELLERS, type TooneProSeller } from "../../lib/legal/seller";
import { ENGLISH_ONLY_PATHS, locales } from "../../i18n/routing";
import { TRADER_DETAILS_COMPLETE } from "../../lib/legal/trader";
import TermsContent from "../../app/[locale]/terms/TermsContent";

const read = (path: string) => fs.readFileSync(path, "utf8");
const page = read("app/[locale]/terms/page.tsx");
const content = read("app/[locale]/terms/TermsContent.tsx");
/** Renders as published (Legal notice live) unless `traderDetails` is false. */
const terms = (seller: TooneProSeller, traderDetails = true) => renderText(createElement(TermsContent, { seller, traderDetails }));
const termsHtml = (seller: TooneProSeller, traderDetails = true) => renderHtml(createElement(TermsContent, { seller, traderDetails }));

test("Terms page renders the seller model from lib/legal/seller.ts", () => {
  assert.match(page, /<TermsContent seller=\{TOONE_PRO_SELLER\} \/>/);
  assert.match(page, /updated=\{TERMS_UPDATED_DATE\}/);
});

test("Terms page points Store users to Apple's standard EULA", () => {
  assert.equal(TERMS_CANONICAL, "https://trytoone.com/en/terms");
  assert.equal(APPLE_STANDARD_EULA_URL, "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/");
  assert.match(content, /APPLE_STANDARD_EULA_URL/);
  for (const seller of TOONE_PRO_SELLERS) {
    const text = terms(seller);
    assert.match(text, /Mac App Store edition/);
    assert.match(text, /custom App Store license agreement/);
    assert.ok(termsHtml(seller).includes(APPLE_STANDARD_EULA_URL));
  }
  assert.doesNotMatch(content, /DRAFT|TERMS_SECTIONS|LICENSE GRANT/);
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

/** What both seller models say identically. */
const SHARED_PHRASES = [
  /<section id="toone-pro">/,
  /<h2>Toone Pro<\/h2>/,
];
const SHARED_TEXT = [
  /Toone Pro Monthly/,
  /Toone Pro Yearly/,
  /Toone Pro Lifetime/,
  /renew automatically every month or every year until you cancel/,
  /Prices in euros include VAT/,
  /before (any )?sales tax/,
  /never sees your full card number/,
  /Manage subscription/,
  /Toone Pro stays on until the end of the period you have paid for/,
  /at least 30 days before the new price applies/,
  /consumer in Germany/,
  /Switching between Monthly and Yearly is not offered yet/,
  /full refund of your first payment within 14 days/,
  /withdraw from the contract within 14 days/,
  /Withdraw from contract here/,
  /Cancel contract here/,
  /I hereby give notice that I withdraw/,
  /Deleting your Toone account cancels a web subscription at once/,
  /first payment was made less than 14 days before, it is refunded automatically/,
  /Checkout is refused while your account already has a paid Toone Pro plan/,
  /Decreto-Lei 84\/2021/,
  /governed by Portuguese law/,
  /mandatory rules of the country where you live/,
  /Livro de Reclamações Eletrónico/,
  /alternative dispute resolution entity/,
  /Toone Pro is not sold in Toone \(Mac App Store\) yet/,
  /no cash value/,
];

test("both seller variants carry the shared Toone Pro terms", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    const html = termsHtml(seller);
    const text = terms(seller);
    for (const phrase of SHARED_PHRASES) assert.match(html, phrase, `${seller}: ${phrase}`);
    for (const phrase of SHARED_TEXT) assert.match(text, phrase, `${seller}: ${phrase}`);
  }
});

test("Managed Payments: Link is the seller and handles VAT, receipts and invoices", () => {
  const text = terms("managed_payments");
  for (const phrase of [
    /Stripe's Managed Payments service/,
    /merchant of record is Sold through Link, LLC/,
    /"Sold through Link"/,
    /calculates and collects VAT or sales tax, sends your receipts and invoices/,
    /Toone does not issue its own invoice/,
    /Link support/,
  ]) {
    assert.match(text, phrase);
  }
  assert.ok(termsHtml("managed_payments").includes("https://link.com/terms#sold-through-link-terms"));
  assert.doesNotMatch(text, /ATCUD|Stripe Tax|reverse charge|credit note|Stripe Payments Europe/);
});

test("Direct: the trader sells, Stripe processes, Stripe Tax, a Portuguese invoice per payment", () => {
  const text = terms("direct");
  for (const phrase of [
    /sold on trytoone\.com by Toone: the seller is the trader named in the Legal notice/,
    /Payments are processed by Stripe Payments Europe, Limited \("Stripe"\), in Ireland/,
    /Stripe Tax, Stripe's tax service, calculates the VAT/,
    /Stripe's receipt/,
    /A Portuguese legal invoice \(fatura\), as a PDF/,
    /ATCUD/,
    /issued within 5 working days of the payment/,
    /separate document from Stripe's receipt/,
    /valid in VIES/,
    /reverse charge applies/,
    /credit note \(nota de crédito\)/,
    /Prices in euros include VAT for consumers/,
    /not sold to customers in the United Kingdom for now/,
    /refunded in full, Toone Pro is not activated/,
  ]) {
    assert.match(text, phrase);
  }
  assert.doesNotMatch(text, /Sold through Link|Link account|Link support|Managed Payments/);
});

test("withdrawal and cancellation match what the server does", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    const text = terms(seller);
    for (const phrase of [
      /Cancel a subscription: it stops renewing\. Toone Pro stays on until the end of the period you have paid for, and nothing is refunded/,
      /Withdraw from a subscription within 14 days of its first payment: the subscription ends straight away, Toone Pro ends, and the first payment is refunded in full/,
      /Withdraw from a subscription later: the request is treated as a cancellation/,
      /Withdraw from Lifetime within 14 days of the payment: the payment is refunded in full and Toone Pro is removed/,
      /Cancel Lifetime, or withdraw from it later: there is nothing to cancel/,
      /Nothing changes until you open the link and confirm: your request is carried out only then/,
      /works for 24 hours/,
    ]) {
      assert.match(text, phrase, `${seller}: ${phrase}`);
    }
  }
});

test("Terms link the withdraw/cancel page, the legal notice, pricing and account pages", async () => {
  const legal = await import("../../lib/legal/terms");
  assert.equal(legal.CANCEL_CONTRACT_PATH, "/cancel-contract");
  assert.equal(legal.LEGAL_NOTICE_PATH, "/legal-notice");
  assert.equal(legal.ACCOUNT_PATH, "/account");
  assert.equal(legal.PRICING_PATH, "/pricing");
  for (const constant of ["CANCEL_CONTRACT_PATH", "LEGAL_NOTICE_PATH", "ACCOUNT_PATH", "PRICING_PATH"]) {
    assert.match(content, new RegExp(`href=\\{\`/en\\$\\{${constant}\\}\`\\}`), constant);
  }
  const labels = [...content.matchAll(/CANCEL_CONTRACT_PATH\}`\}>((?:Withdraw from|Cancel) contract here)</g)].map((m) => m[1]);
  assert.deepEqual(labels.sort(), ["Cancel contract here", "Withdraw from contract here"]);
  for (const seller of TOONE_PRO_SELLERS) {
    const html = termsHtml(seller);
    for (const href of ["/en/cancel-contract", "/en/legal-notice", "/en/account", "/en/pricing"]) {
      assert.ok(html.includes(`href="${href}"`), `${seller}: ${href}`);
    }
  }
});

test("Terms keep the Apple (Mac App Store) section for when Pro is sold there, without steering", () => {
  assert.match(content, /id="app-store"/);
  assert.match(content, /APPLE_REPORT_A_PROBLEM_URL/);
  assert.match(content, /APPLE_MANAGE_SUBSCRIPTIONS_URL/);
  for (const seller of TOONE_PRO_SELLERS) {
    const text = terms(seller);
    for (const phrase of [
      /charged to your Apple Account/,
      /at least 24 hours before the end of the current period/,
      /App Store account settings/,
      /Restore Purchases links it again only to that same account/,
      /once per Apple Account/,
      /standard Licensed Application End User License Agreement, which continues to govern/,
    ]) {
      assert.match(text, phrase, `${seller}: ${phrase}`);
    }
    assert.doesNotMatch(text, /sold only as an Apple in-app purchase|trytoone\.com does not sell Toone Pro/);
  }
});

test("Terms state the free plan and codes", () => {
  assert.match(content, /each Toone account can create \{TOONE_PRO_FREE_ROUTINE_CREATIONS\}/);
  assert.match(content, /\{TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS\} routine creations/);
  assert.match(content, /id="codes"/);
  const text = terms("managed_payments");
  assert.match(text, /each Toone account can create 2 routines/);
  for (const phrase of [
    /Installing a routine from Explore counts/,
    /Running routines is never limited/,
    /no cash value/,
    /once per person and per Toone account/,
    /verified email address/,
    /cannot be redeemed while your account has a paid Toone Pro plan/,
    /not used up when it is refused/,
    /Codes for extra routine creations can always be redeemed/,
    /Discount codes are different/,
    /obtained by fraud, by mistake/,
    /does not include guest months to give/,
  ]) {
    assert.match(text, phrase);
  }
});

test("Toone Pro numbers match the server's limits (free plan = 2)", async () => {
  const legal = await import("../../lib/legal/terms");
  assert.equal(legal.TOONE_PRO_FREE_ROUTINE_CREATIONS, 2);
  assert.equal(legal.TOONE_PRO_PREVIOUS_FREE_ROUTINE_CREATIONS, 5);
  assert.equal(legal.TOONE_PRO_GUEST_PASSES, 5);
  assert.equal(legal.TOONE_PRO_GUEST_MONTH_DAYS, 30);
  assert.equal(legal.TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS, 14);
  assert.equal(legal.TOONE_PRO_CODE_MAX_DAYS, 365);
  assert.equal(legal.TOONE_PRO_CONTRACT_LINK_HOURS, 24);
  assert.equal(legal.APPLE_REPORT_A_PROBLEM_URL, "https://reportaproblem.apple.com");
  assert.notEqual(legal.TERMS_UPDATED_DATE, "September 28, 2026", "Terms date bumped with the Pro section");
});

test("Terms follow TRADER_DETAILS_COMPLETE unless told otherwise", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    assert.equal(
      renderHtml(createElement(TermsContent, { seller })),
      termsHtml(seller, TRADER_DETAILS_COMPLETE),
      seller,
    );
  }
});

test("while the trader details are incomplete the Terms never link or point to the Legal notice", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    const html = termsHtml(seller, false);
    const text = terms(seller, false);
    assert.ok(!html.includes("/legal-notice"), `${seller}: links the Legal notice`);
    assert.doesNotMatch(text, /Legal notice/, seller);
    for (const phrase of [
      /published by Matheus Paranhos under the Hexagonal\.io name in Portugal\. For the full trader details, address and tax number, write to hello@trytoone\.com\./,
      /alternative dispute resolution entity\. Write to hello@trytoone\.com and we send you the details of both\./,
      /To Toone \(hello@trytoone\.com\): I hereby give notice that I withdraw/,
      // The Pro purchase sections still read in full.
      /Withdraw from contract here/,
      /Cancel contract here/,
      /Checkout is refused while your account already has a paid Toone Pro plan/,
    ]) {
      assert.match(text, phrase, `${seller}: ${phrase}`);
    }
    assert.ok(html.includes('href="mailto:hello@trytoone.com"'));
  }
  assert.match(
    terms("direct", false),
    /sold on trytoone\.com by Toone: the seller is Toone's publisher, Matheus Paranhos \(Hexagonal\.io\), an individual trader in Portugal, who is responsible for the sale, for delivering Toone Pro, and for support\./,
  );
  assert.match(terms("managed_payments", false), /merchant of record is Sold through Link, LLC/);
});
