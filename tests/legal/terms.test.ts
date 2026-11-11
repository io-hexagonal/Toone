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
const terms = (seller: TooneProSeller | null, traderDetails = true) => renderText(createElement(TermsContent, { seller, traderDetails }));
const termsHtml = (seller: TooneProSeller | null, traderDetails = true) => renderHtml(createElement(TermsContent, { seller, traderDetails }));
/** Who sells new purchases, as the API may say: either seller, or nothing (unreachable). */
const RENDERINGS: readonly (TooneProSeller | null)[] = [...TOONE_PRO_SELLERS, null];

test("Terms page renders the seller model from lib/legal/seller.ts", () => {
  assert.match(page, /<TermsContent seller=\{seller\} \/>/);
  assert.match(page, /updated=\{TERMS_UPDATED_DATE\}/);
});

test("Terms page points Store users to Apple's standard EULA", () => {
  assert.equal(TERMS_CANONICAL, "https://trytoone.com/en/terms");
  assert.equal(APPLE_STANDARD_EULA_URL, "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/");
  assert.match(content, /APPLE_STANDARD_EULA_URL/);
  for (const seller of RENDERINGS) {
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

/** What every rendering says, whoever sells new purchases. */
const SHARED_PHRASES = [
  /<section id="toone-pro">/,
  /<h2>Toone Pro<\/h2>/,
];
const SHARED_TEXT = [
  /Toone Pro Monthly/,
  /Toone Pro Yearly/,
  /Toone Pro Lifetime/,
  /renew automatically every month or every year until you cancel/,
  /The pricing page shows prices in euros, including VAT/,
  /Checkout may show and charge the price in your local currency instead, with any sales tax that applies where you are; it shows the exact amount and currency before you pay/,
  /A purchase keeps the seller it was made under, including its renewals, invoices and refunds, even if Toone later changes how it sells Toone Pro/,
  /never sees your full card number/,
  /Manage subscription/,
  /Toone Pro stays on until the end of the period you have paid for/,
  /at least 30 days before the new price applies/,
  /consumer with a billing address in Germany and your Yearly subscription has renewed at least once, you can cancel it at any time with one month's notice: the subscription then ends one month after the day we receive your cancellation, and the part of the period you paid for that falls after that date is refunded automatically, pro rata/,
  /Switching between Monthly and Yearly is not offered yet/,
  /If you withdraw from your Toone account's first paid Toone Pro purchase within 14 days of paying, it is refunded in full, whatever the plan/,
  /It applies once per Toone account/,
  /withdraw from a later subscription within 14 days of paying for it, without giving a reason\. Because you asked for Toone Pro to start straight away, you pay for the days you had it: the unused part of the period you paid for is refunded, pro rata/,
  /A later Lifetime purchase is digital content: you asked for it to start straight away and confirmed that your right of withdrawal ends when it does, so it is not refunded on withdrawal/,
  /A withdrawal counts as made within 14 days when you send it within 14 days, even if the refund is made later/,
  /These terms and the other legal pages of trytoone\.com are published in English, and a Toone Pro purchase is made under the English text/,
  /Anything that is not available in your language, including these terms and some emails, is shown in English/,
  /Withdraw from contract here/,
  /Cancel contract here/,
  /I hereby give notice that I withdraw/,
  /Deleting your Toone account cancels a web subscription at once/,
  /If you paid for it less than 14 days before, it is refunded automatically, as for a withdrawal/,
  /Checkout is refused while your account already has a paid Toone Pro plan/,
  /Decreto-Lei 84\/2021/,
  /governed by Portuguese law/,
  /mandatory rules of the country where you live/,
  /Livro de Reclamações Eletrónico/,
  /alternative dispute resolution entity/,
  /Toone Pro is not sold in Toone \(Mac App Store\) yet/,
  /no cash value/,
];

test("every rendering carries the shared Toone Pro terms", () => {
  for (const seller of RENDERINGS) {
    const html = termsHtml(seller);
    const text = terms(seller);
    for (const phrase of SHARED_PHRASES) assert.match(html, phrase, `${seller}: ${phrase}`);
    for (const phrase of SHARED_TEXT) assert.match(text, phrase, `${seller}: ${phrase}`);
  }
});

const LINK_TERMS = [
  /Toone Pro on trytoone\.com is sold in one of two ways: sold through Link, or sold by Toone\. Checkout shows which one applies before you pay, and your purchase confirmation email names it/,
  /Where these terms say "sold through Link" or "sold by Toone", that part applies only to purchases sold that way/,
  /Sold through Link\. If checkout shows "Sold through Link", Toone Pro is sold through Stripe's Managed Payments service/,
  /merchant of record is Sold through Link, LLC/,
  /calculates and collects VAT or sales tax, sends your receipts and invoices/,
  /Toone does not issue its own invoice for a purchase sold through Link/,
  /in your Link account for a purchase sold through Link/,
  /for a purchase sold through Link, ask Link support and give "withdrawal period" as the reason/,
  /For a purchase sold through Link, Link may also refund a payment under its own policy/,
  /Link keeps the invoices of purchases sold through Link/,
  /Payment questions about a purchase sold through Link can also go to Link support/,
];
const TOONE_TERMS = [
  /Sold by Toone\. Any other purchase on trytoone\.com is sold by Toone: the seller is the trader named in the Legal notice/,
  /Payments are processed by Stripe Payments Europe, Limited \("Stripe"\), in Ireland/,
  /Sold by Toone\. Stripe Tax, Stripe's tax service, calculates the VAT/,
  /Stripe's receipt/,
  /A Portuguese legal invoice \(fatura\), as a PDF/,
  /ATCUD/,
  /issued within 5 working days of the payment/,
  /separate document from Stripe's receipt/,
  /valid in VIES/,
  /reverse charge applies/,
  /credit note \(nota de crédito\)/,
  /The pricing page shows prices in euros, including VAT for consumers/,
  /For a purchase sold by Toone, if you buy for a business with a valid EU VAT number, VAT may not be charged/,
  /When a purchase is sold by Toone, the countries where we can't sell yet are named at checkout, judged by the billing address you give there/,
  /Each accepted payment then gets two documents/,
  /If an accepted payment is refunded, in full or in part, you also receive a credit note/,
  // A refused payment: the server refunds it and issues no legal document.
  /A payment from one of them is refused: it is refunded in full, doesn't start Toone Pro, and gets no legal invoice and no credit note/,
  /Stripe emails you the confirmation of the refund/,
  /Toone keeps the purchase records the law requires, with the invoices and credit notes of purchases sold by Toone/,
];

test("whoever sells new purchases, the Terms describe both sellers and say which applies to a purchase", () => {
  // Review #15: after a switch, buyers of the other model must still find their own terms.
  for (const seller of RENDERINGS) {
    const text = terms(seller);
    for (const phrase of [...LINK_TERMS, ...TOONE_TERMS]) assert.match(text, phrase, `${seller}: ${phrase}`);
    const html = termsHtml(seller);
    assert.ok(html.includes("https://link.com/terms#sold-through-link-terms"), `${seller}: Link terms`);
    for (const id of ["seller-of-your-purchase", "sold-through-link", "sold-by-toone", "invoices", "invoices-link", "invoices-toone", "not-sold-in"]) {
      assert.ok(html.includes(`id="${id}"`), `${seller}: #${id}`);
    }
    assert.doesNotMatch(text, /Each payment then gets two documents|you receive the credit note for the refund/, `${seller}`);
  }
});

test("only the 'currently sold' sentence follows the API, and it is left out when the API does not say", () => {
  // Review #63: an unreachable API can no longer bring back a wrong seller.
  assert.match(terms("managed_payments"), /that part applies only to purchases sold that way\. New purchases are currently sold through Link\./);
  assert.match(terms("direct"), /that part applies only to purchases sold that way\. New purchases are currently sold by Toone\./);
  assert.doesNotMatch(terms(null), /currently sold/);
  const strip = (text: string) => text.replace(/ New purchases are currently sold (through Link|by Toone)\./, "");
  assert.equal(strip(terms("managed_payments")), terms(null));
  assert.equal(strip(terms("direct")), terms(null));
  assert.equal(renderHtml(createElement(TermsContent, { traderDetails: true })), termsHtml(null), "no seller prop reads as unknown");
  assert.doesNotMatch(content, /isManagedPayments|managed \?/, "no seller-dependent branch left in the Terms");
});

test("withdrawal and cancellation match what the server does", () => {
  for (const seller of RENDERINGS) {
    const text = terms(seller);
    for (const phrase of [
      /Cancel a subscription: it stops renewing\. Toone Pro stays on until the end of the period you have paid for, and nothing is refunded, except as described for Germany above/,
      /Withdraw from a subscription within 14 days of paying for it: the subscription ends straight away and Toone Pro ends\. The payment is refunded in full if it was your account's first paid Toone Pro purchase; otherwise the unused part of the period is refunded/,
      /Withdraw from a subscription later: the request is treated as a cancellation/,
      /Withdraw from Lifetime within 14 days of the payment, when it was your account's first paid Toone Pro purchase: the payment is refunded in full and Toone Pro is removed/,
      /Withdraw from Lifetime bought while a web subscription was active: buying Lifetime had set that subscription to stop renewing\. If the subscription is still running when you withdraw, it renews again as before\. If it has already ended, it is not restarted, and Toone Pro ends with the Lifetime purchase/,
      /Cancel Lifetime, or withdraw from it later: there is nothing to cancel/,
      // Pressing the button is the declaration (no emailed link to open).
      /Pressing it is your declaration: if the details match a Toone Pro purchase, your withdrawal or cancellation takes effect at that moment, with no further step and no link to open/,
      /the date and time we received it and, for a cancellation, the date the contract ends/,
      /Enter the email address of your Toone account or the one you entered at checkout, and the order reference \(TOONE-…\) from the purchase confirmation email Toone sends after every purchase/,
      /whether it is an ordinary or an extraordinary termination \(with the reason\), and when the contract should end: at the next possible date, or on a later date you choose/,
      /Both are linked at the bottom of every page of trytoone\.com, and neither needs a sign-in/,
      /Cancel contract here applies this by itself/,
    ]) {
      assert.match(text, phrase, `${seller}: ${phrase}`);
    }
    assert.doesNotMatch(text, /Nothing changes until you open the link|works for 24 hours|order reference from your receipt|Whatever the plan, you can ask for a full refund of your first payment|Prices in US dollars/, String(seller));
  }
});

test("the Terms say where the order reference is, and how to withdraw or cancel without it", () => {
  for (const seller of RENDERINGS) {
    const text = terms(seller);
    assert.match(text, /Your Toone account page also shows it for a purchase made in the browser you use there/, String(seller));
    assert.match(text, /If you don't have the order reference, you can still cancel a subscription on your Toone account page \(Manage subscription\), or withdraw or cancel by email to hello@trytoone\.com from the email address of your Toone account or the one you entered at checkout\. The order reference helps us find your purchase, but you don't need it there\./, String(seller));
    assert.ok(termsHtml(seller).includes('id="no-order-reference"'), String(seller));
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
  assert.deepEqual([...new Set(labels)].sort(), ["Cancel contract here", "Withdraw from contract here"]);
  for (const seller of RENDERINGS) {
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
  for (const seller of RENDERINGS) {
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
  for (const seller of RENDERINGS) {
    assert.equal(
      renderHtml(createElement(TermsContent, { seller })),
      termsHtml(seller, TRADER_DETAILS_COMPLETE),
      String(seller),
    );
  }
});

test("while the trader details are incomplete the Terms never link or point to the Legal notice", () => {
  for (const seller of RENDERINGS) {
    const html = termsHtml(seller, false);
    const text = terms(seller, false);
    assert.ok(!html.includes("/legal-notice"), `${seller}: links the Legal notice`);
    assert.doesNotMatch(text, /Legal notice/, String(seller));
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
  for (const seller of RENDERINGS) {
    const text = terms(seller, false);
    assert.match(
      text,
      /Any other purchase on trytoone\.com is sold by Toone: the seller is Toone's publisher, Matheus Paranhos \(Hexagonal\.io\), an individual trader in Portugal, who is responsible for the sale, for delivering Toone Pro, and for support\./,
      `${seller}`,
    );
    assert.match(text, /merchant of record is Sold through Link, LLC/, `${seller}`);
  }
});

test("the Terms name no blocked country: the server's list is shown at checkout", () => {
  assert.doesNotMatch(content, /United Kingdom|DIRECT_BLOCKED_COUNTRIES/);
  for (const seller of RENDERINGS) {
    assert.doesNotMatch(terms(seller), /not sold to customers in/, String(seller));
  }
});

test("the footer links the withdraw and cancel functions on every page, in every locale, unconditionally", () => {
  const footer = read("components/Footer.tsx");
  assert.match(footer, /<Link href="\/cancel-contract\?kind=withdraw">\{t\("withdrawContract"\)\}<\/Link>/);
  assert.match(footer, /<Link href="\/cancel-contract\?kind=cancel">\{t\("cancelContract"\)\}<\/Link>/);
  const block = footer.slice(footer.indexOf('href="/terms"'), footer.indexOf('kind=cancel'));
  assert.doesNotMatch(block, /&&|\?\s*</, "not behind a flag or a session");
  for (const locale of locales) {
    const messages = JSON.parse(read(`messages/${locale}.json`));
    assert.equal(messages.footer.withdrawContract, messages.account.page.withdrawLink, locale);
    assert.equal(messages.footer.cancelContract, messages.account.page.cancelLink, locale);
  }
  const de = JSON.parse(read("messages/de.json"));
  assert.equal(de.footer.cancelContract, "Verträge hier kündigen");
});
