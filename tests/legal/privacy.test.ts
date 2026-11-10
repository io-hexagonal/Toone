import { renderHtml, renderText } from "./render";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import {
  ANALYTICS_CHOICE_STORAGE_KEY,
  PRIVACY_CONTRACT_REQUEST_YEARS,
  PRIVACY_PAYMENT_RECORD_YEARS,
  PRIVACY_PURPOSES,
  PRIVACY_RECIPIENTS,
  PRIVACY_UPDATED_DATE,
  SESSION_STORAGE_KEY,
  privacyRecipients,
  privacyRetention,
} from "../../lib/legal/privacy";
import { TOONE_PRO_SELLERS, type TooneProSeller } from "../../lib/legal/seller";
import { SITE_SESSION_COOKIE } from "../../lib/site-session";
import { LOCALE_CHOICE_COOKIE } from "../../i18n/routing";
import { LOCALE_DISMISSED_KEY } from "../../lib/locale-preference";
import { TRADER_DETAILS_COMPLETE } from "../../lib/legal/trader";
import PrivacyContent from "../../app/[locale]/privacy/PrivacyContent";

const read = (path: string) => fs.readFileSync(path, "utf8");
const page = read("app/[locale]/privacy/page.tsx");
/** Renders as published (Legal notice live) unless `traderDetails` is false. */
const privacy = (seller: TooneProSeller, traderDetails = true) => renderText(createElement(PrivacyContent, { seller, traderDetails }));
const privacyHtml = (seller: TooneProSeller, traderDetails = true) => renderHtml(createElement(PrivacyContent, { seller, traderDetails }));

test("Privacy page renders the seller model and the bumped date", () => {
  assert.match(page, /<PrivacyContent seller=\{TOONE_PRO_SELLER\} \/>/);
  assert.match(page, /updated=\{PRIVACY_UPDATED_DATE\}/);
  assert.equal(PRIVACY_UPDATED_DATE, "November 10, 2026");
  for (const seller of TOONE_PRO_SELLERS) {
    assert.doesNotMatch(privacy(seller), /Toone Pro \(Mac App Store\)\s*$/m, "Pro is no longer described as Store-only");
  }
});

test("cookie and storage names match the code that sets them", () => {
  assert.equal(SITE_SESSION_COOKIE, "toone_site_session");
  assert.equal(LOCALE_CHOICE_COOKIE, "toone_locale");
  assert.equal(LOCALE_DISMISSED_KEY, "toone.locale.dismissed");
  assert.match(read("lib/privacy-choices.ts"), new RegExp(`STORAGE_KEY = "${ANALYTICS_CHOICE_STORAGE_KEY}"`));
  assert.ok(read("lib/api.ts").includes(`const SESSION_KEY = "${SESSION_STORAGE_KEY}"`));
  for (const seller of TOONE_PRO_SELLERS) {
    const text = privacy(seller);
    for (const name of [
      "toone_site_session", "toone_locale", "toone.session", "toone-web-analytics-choice-v1", "toone.locale.dismissed",
      "toone.pro.order:", "toone.pro.checkout:", "toone.pro.checkout", "toone.pro.from", "toone.redeem.pending",
    ]) {
      assert.ok(text.includes(name), `${seller}: ${name}`);
    }
    assert.match(text, /Cookie, httpOnly/);
    assert.match(text, /at most 30 days/);
    assert.match(text, /trytoone\.com sets no Stripe cookies and loads no Stripe script/);
    assert.match(text, /checkout\.stripe\.com/);
    assert.match(text, /allowing it adds no cookie/);
    assert.match(text, /up to five items in your browser's local storage and up to three in its session storage/);
  }
});

test("purchase records in local storage are forgotten on sign-out", async () => {
  const { forgetPurchaseRecords, ORDER_REF_KEY_PREFIX, CHECKOUT_KEY_PREFIX } = await import("../../lib/billing/purchase-storage");
  assert.equal(ORDER_REF_KEY_PREFIX, "toone.pro.order:");
  assert.equal(CHECKOUT_KEY_PREFIX, "toone.pro.checkout:");
  const items = new Map([
    ["toone.pro.order:usr_1", "TOONE-ABCDEFGH"], ["toone.pro.checkout:usr_1", "cs_test_1"],
    ["toone.pro.order:usr_2", "TOONE-IJKLMNOP"], ["toone.session", "{}"], ["toone.locale.dismissed", "1"],
  ]);
  const store = {
    get length() { return items.size; },
    key: (i: number) => [...items.keys()][i] ?? null,
    removeItem: (key: string) => void items.delete(key),
  };
  forgetPurchaseRecords(store);
  assert.deepEqual([...items.keys()], ["toone.session", "toone.locale.dismissed"]);
  assert.match(read("lib/api.ts"), /export function clearSession\(\): void \{[\s\S]*?forgetPurchaseRecords\(\);[\s\S]*?\n\}/);
});

test("Managed Payments: Stripe and Link, Link as seller and independent controller", () => {
  const text = privacy("managed_payments");
  for (const phrase of [
    /Stripe's Managed Payments service/,
    /the seller of the transaction is Sold through Link, LLC/,
    /never receives your full card number/,
    /billing country and address/,
    /IP address and country as evidence/,
    /subscription, checkout and invoice identifiers/,
    /Stripe processes this data for Toone as a service provider/,
    /independent controllers for their own purposes/,
    /Link sends your receipts and invoices/,
    /Link Privacy Policy/,
  ]) {
    assert.match(text, phrase);
  }
  const html = privacyHtml("managed_payments");
  assert.ok(html.includes("https://stripe.com/privacy"));
  assert.ok(html.includes("https://link.com/privacy"));
  assert.doesNotMatch(text, /Autoridade Tributária|VIES|certified accountant/);
});

test("Direct: Toone sells, Stripe processes, Stripe Tax, legal invoices to the tax authority", () => {
  const text = privacy("direct");
  for (const phrase of [
    /the seller is the trader named in the Legal notice, who is also the controller of the purchase data/,
    /Payments are processed by Stripe Payments Europe, Limited/,
    /Stripe Tax, Stripe's tax service/,
    /checked in VIES/,
    /For every accepted payment, Toone issues a Portuguese legal invoice, and a credit note for every refund of one/,
    /A payment refused because Toone Pro can't be sold yet to its billing country is refunded in full and gets neither/,
    /communicated to the Portuguese tax authority/,
    /Stripe processes payment data for Toone as a processor/,
    /Autoridade Tributária e Aduaneira/,
    /certified accountant/,
  ]) {
    assert.match(text, phrase);
  }
  assert.doesNotMatch(text, /Sold through Link|Link Privacy Policy|Managed Payments/);
});

test("recipients: every processor with its role and country, per seller", () => {
  const ids = (seller: TooneProSeller) => privacyRecipients(seller).map((row) => row.id);
  const shared = ["vercel", "api-hosting", "stripe", "resend", "openai", "discord", "umami", "apple", "google", "github"];
  for (const seller of TOONE_PRO_SELLERS) {
    for (const id of shared) assert.ok(ids(seller).includes(id), `${seller}: ${id}`);
  }
  assert.ok(ids("managed_payments").includes("link"));
  assert.ok(!ids("direct").includes("link"));
  for (const id of ["tax-authority", "vies", "accountant"]) {
    assert.ok(ids("direct").includes(id), id);
    assert.ok(!ids("managed_payments").includes(id), id);
  }
  for (const row of PRIVACY_RECIPIENTS) {
    assert.ok(row.role.trim() && row.where.trim() && row.purpose.trim(), row.id);
  }
  const managed = privacy("managed_payments");
  for (const phrase of [
    /Vercel Inc\. Processor/,
    /Stripe Payments Europe, Limited \(Stripe\) Processor for Toone's payments; independent controller/,
    /Sold through Link, LLC \(Link\) Seller of the transaction \(merchant of record\) and independent controller/,
    /Resend, Inc\. Processor/,
    /Umami analytics, self-hosted/,
    /Toone's server hosting provider Processor .* virtual private server[^|]*European Union/,
    /Google Independent controller Sign in with Google/,
    /Apple Independent controller Sign in with Apple/,
  ]) {
    assert.match(managed, phrase);
  }
  assert.match(privacy("direct"), /Autoridade Tributária e Aduaneira \(AT\), the Portuguese tax authority Public authority/);
});

test("purposes and legal bases table", () => {
  const bases = PRIVACY_PURPOSES.map((row) => row.basis).join(" ");
  for (const basis of ["6(1)(a)", "6(1)(b)", "6(1)(c)", "6(1)(f)"]) assert.ok(bases.includes(basis), basis);
  for (const seller of TOONE_PRO_SELLERS) {
    const text = privacy(seller);
    assert.match(text, /Why we use your data, and on what legal basis/);
    assert.match(text, /Count visits and clicks on trytoone\.com Consent \(art\. 6\(1\)\(a\)\)/);
    assert.match(text, /Legal obligation \(art\. 6\(1\)\(c\)\): tax, accounting and consumer law/);
  }
});

test("retention table covers payments, invoices, consent, contract requests, codes and bonuses", () => {
  assert.equal(PRIVACY_PAYMENT_RECORD_YEARS, 10);
  assert.equal(PRIVACY_CONTRACT_REQUEST_YEARS, 3);
  for (const seller of TOONE_PRO_SELLERS) {
    const rows = privacyRetention(seller);
    const ids = rows.map((row) => row.id);
    for (const id of ["account", "payments", "invoices", "consent", "contract-requests", "code-redemptions", "code-hash", "creation-bonuses"]) {
      assert.ok(ids.includes(id), `${seller}: ${id}`);
    }
    assert.equal(new Set(ids).size, ids.length, "unique ids");
    // Periods counsel or the accountant must confirm carry a flag, never shown on the page.
    for (const id of ["payments", "consent", "contract-requests", "code-hash"]) {
      assert.equal(rows.find((row) => row.id === id)?.confirm, true, `${seller}: ${id} is marked for confirmation`);
    }
    const text = privacy(seller);
    assert.match(text, /How long we keep data/);
    assert.match(text, /10 years after the end of the year of the payment/);
    assert.match(text, /Withdrawal and cancellation requests: .* 3 years after the request/);
    assert.match(text, /keyed hash of the email address that redeemed a code, without the address itself As long as the code exists, including after you delete your account\. So the same person cannot redeem the same code again with a new account/);
    assert.match(text, /Extra routine creations a code or Toone gave your account While your account exists\. Deleted with it/);
    assert.match(text, /which version of the text you saw As long as the payment record it belongs to/);
    assert.doesNotMatch(text, /\bconfirm: |to confirm|\bTODO\b/i);
  }
  assert.match(privacy("direct"), /Legal invoices and credit notes 10 years after the end of the year they were issued in/);
  assert.match(privacy("managed_payments"), /Receipts and invoices Link issues and keeps them/);
});

test("withdrawal and cancellation requests, codes and account deletion", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    const text = privacy(seller);
    for (const phrase of [
      /which version of that text you saw/,
      /Cancel contract here or Withdraw from contract here/,
      /confirmation link that works for 24 hours, and carries out the request only when you confirm it/,
      /keyed hash of the email address, never the address itself/,
      /When you check or redeem a code/,
      /keyed hash of the email address that redeemed it, without the address itself/,
      /deleting your account cancels it at Stripe straight away/,
      /less than 14 days before, that payment is refunded/,
      /Invoices and the records of your purchases, refunds, and codes are kept/,
      /Deleting your account does not cancel an Apple subscription/,
    ]) {
      assert.match(text, phrase, `${seller}: ${phrase}`);
    }
  }
});

test("controller, transfers, rights, automated decisions, security, children, Store edition, changes", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    const html = privacyHtml(seller);
    const text = privacy(seller);
    for (const id of ["controller", "third-parties", "purposes", "transfers", "retention", "automated-decisions", "security", "children", "your-rights", "changes", "cookies", "toone-pro", "toone-pro-app-store"]) {
      assert.ok(html.includes(`id="${id}"`), `${seller}: #${id}`);
    }
    for (const phrase of [
      /Matheus Paranhos/,
      /hello@trytoone\.com/,
      /data protection officer/,
      /EU-U\.S\. Data Privacy Framework/,
      /Standard Contractual Clauses/,
      /Stripe screens every payment for fraud automatically/,
      /Toone itself makes no decision about you based solely on automated processing that has legal or similarly significant effects/,
      /Checkout and the billing portal are hosted by Stripe, so Toone never sees or stores your card number/,
      /Toone is not for anyone under 16/,
      /Toone \(Mac App Store\) has no Stripe checkout and no web purchase/,
      /Apple's standard End User License Agreement/,
      /Comissão Nacional de Proteção de Dados \(CNPD/,
      /announces it on this page and in the release notes before it applies/,
      /Sign in with Google/,
    ]) {
      assert.match(text, phrase, `${seller}: ${phrase}`);
    }
    assert.ok(html.includes("https://www.cnpd.pt"));
    assert.ok(html.includes('href="/en/legal-notice"'));
  }
});

test("Privacy follows TRADER_DETAILS_COMPLETE unless told otherwise", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    assert.equal(
      renderHtml(createElement(PrivacyContent, { seller })),
      privacyHtml(seller, TRADER_DETAILS_COMPLETE),
      seller,
    );
  }
});

test("while the trader details are incomplete the Privacy Policy never links or points to the Legal notice", () => {
  for (const seller of TOONE_PRO_SELLERS) {
    const html = privacyHtml(seller, false);
    const text = privacy(seller, false);
    assert.ok(!html.includes("/legal-notice"), `${seller}: links the Legal notice`);
    assert.doesNotMatch(text, /Legal notice/, seller);
    assert.match(text, /can be reached at hello@trytoone\.com\. His address and tax number are available on request at the same email address\. Toone has not appointed/);
    assert.match(text, /Toone is published by Matheus Paranhos \(Hexagonal\.io\), Portugal\./);
  }
  assert.match(
    privacy("direct", false),
    /the seller is Toone's publisher, named under Who is responsible for your data, who is also the controller of the purchase data/,
  );
  assert.ok(privacyHtml("direct", false).includes('href="#controller"'));
  assert.match(privacy("managed_payments", false), /the seller of the transaction is Sold through Link, LLC/);
});
