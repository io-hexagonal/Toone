import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { locales } from "../../i18n/routing";
import { GET as siteSitemap } from "../../app/sitemap.xml/route";
import { pricingMetadata } from "../../app/[locale]/pricing/pricing-metadata";
import PricingPlans from "../../components/billing/PricingPlans";
import {
  checkoutErrorKey,
  hasTemporaryPro,
  orderedPrices,
  ownedReason,
  planAvailability,
  readPricingParams,
  taxNoteKey,
  tidyPricingSearch,
} from "../../components/billing/PricingPlans.helpers";
import { normalizeEntitlement, normalizePrices, type Price } from "../../lib/billing/api";
import messages from "../../messages/en.json" with { type: "json" };

const read = (path: string) => fs.readFileSync(path, "utf8");

const PRICES: Price[] = normalizePrices([
  { plan: "pro_lifetime", interval: "lifetime", amount: 19999, currency: "eur", display_price: "€199.99", tax_inclusive: true },
  { plan: "pro_monthly", interval: "month", amount: 999, currency: "eur", display_price: "€9.99", tax_inclusive: true },
  { plan: "pro_yearly", interval: "year", amount: 7999, currency: "eur", display_price: "€79.99", tax_inclusive: true },
]);

function render(props: Partial<Parameters<typeof PricingPlans>[0]> = {}) {
  return renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale: "en",
    messages,
    timeZone: "UTC",
    children: createElement(PricingPlans, { prices: PRICES, checkoutEnabled: true, freeCreations: 2, refundDays: 14, ...props }),
  }));
}

/* ---- indexing */

test("pricing: indexable and in the sitemap in English only, self-canonical everywhere", async () => {
  for (const locale of locales) {
    const meta = pricingMetadata(locale, "Title", "Description");
    assert.deepEqual(meta.robots, { index: locale === "en", follow: true }, locale);
    assert.equal(meta.alternates?.canonical, `https://trytoone.com/${locale}/pricing`, locale);
    assert.equal((meta.alternates as Record<string, unknown>).languages, undefined, `${locale} declares hreflang`);
    assert.equal((meta.openGraph as { url?: string }).url, `https://trytoone.com/${locale}/pricing`);
  }
  const xml = await (await siteSitemap()).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls.filter((url) => url.endsWith("/pricing")), ["https://trytoone.com/en/pricing"]);
});

test("the page goes through pricingMetadata and never reads the query on the server", () => {
  const page = read("app/[locale]/pricing/page.tsx");
  assert.match(page, /pricingMetadata\(locale,/);
  assert.doesNotMatch(page, /searchParams/);
  assert.match(page, /getBillingFeaturesOrOff\(/);
  assert.match(page, /export const revalidate = \d+;/);
});

test("header and footer link to pricing", () => {
  assert.match(read("components/Footer.tsx"), /<Link href="\/pricing">\{billing\("nav"\)\}<\/Link>/);
  assert.match(read("components/SiteHeader.tsx"), /<Link href="\/pricing" data-optional>\{billing\("nav"\)\}<\/Link>/);
});

/* ---- server HTML */

test("with checkout on, the plans render in order with the disclosures", () => {
  const html = render();
  const order = ["Monthly", "Yearly", "Lifetime"].map((name) => html.indexOf(`<h2>${name}</h2>`));
  assert.ok(order.every((at) => at >= 0) && order[0] < order[1] && order[1] < order[2], "monthly, yearly, lifetime");
  assert.match(html, /€9\.99/);
  assert.match(html, /Prices include VAT where applicable\./);
  assert.match(html, /renew automatically until you cancel/);
  assert.match(html, /full refund of your first payment within 14 days/);
  assert.match(html, /href="\/en\/terms#toone-pro"/);
  // The session is only known in the browser: no buy button in the server HTML.
  assert.doesNotMatch(html, /Get (Monthly|Yearly|Lifetime)/);
  assert.doesNotMatch(html, /coming soon/i);
});

test("with checkout off, there is no purchase control, only 'coming soon'", () => {
  const html = render({ checkoutEnabled: false, prices: [] });
  assert.match(html, /Toone Pro on the web is coming soon/);
  assert.match(html, /every account can create 2 routines for free/);
  assert.doesNotMatch(html, /<button/);
  assert.doesNotMatch(html, /Sign in to buy|Checking your account/);
});

/* ---- plan availability and errors */

const entitlement = (raw: Record<string, unknown>) => normalizeEntitlement(raw);

test("which plans the account may buy", () => {
  const free = entitlement({ plan: "free" });
  const appStore = entitlement({ plan: "pro", source: "subscription", billing_provider: "app_store" });
  const web = entitlement({ plan: "pro", source: "subscription", billing_provider: "stripe" });
  const lifetime = entitlement({ plan: "pro", source: "lifetime", billing_provider: "stripe" });
  const code = entitlement({ plan: "pro", source: "grant", billing_provider: "toone" });
  const guest = entitlement({ plan: "pro", source: "guest", billing_provider: "toone" });
  const future = entitlement({ plan: "pro", source: "partner", billing_provider: "paddle" });
  for (const plan of ["pro_monthly", "pro_yearly", "pro_lifetime"] as const) {
    assert.equal(planAvailability(plan, null), "open");
    assert.equal(planAvailability(plan, free), "open");
    assert.equal(planAvailability(plan, code), "open");
    assert.equal(planAvailability(plan, guest), "open");
    assert.equal(planAvailability(plan, appStore), "app_store");
    assert.equal(planAvailability(plan, lifetime), "lifetime");
    assert.equal(planAvailability(plan, future), "other");
  }
  assert.equal(planAvailability("pro_monthly", web), "web_subscription");
  assert.equal(planAvailability("pro_yearly", web), "web_subscription");
  assert.equal(planAvailability("pro_lifetime", web), "open", "a web subscription can move to Lifetime");
  assert.equal(hasTemporaryPro(code), true);
  assert.equal(hasTemporaryPro(web), false);
});

test("checkout failures map to copy, and already_pro names where Pro comes from", () => {
  assert.equal(checkoutErrorKey({ kind: "unauthenticated" }), "errSession");
  assert.equal(checkoutErrorKey({ kind: "payments_unavailable" }), "errUnavailable");
  assert.equal(checkoutErrorKey({ kind: "rate_limited" }), "errRate");
  assert.equal(checkoutErrorKey({ kind: "unknown", status: 0, code: "untrusted_redirect", message: "" }), "errGeneric");
  assert.equal(checkoutErrorKey({ kind: "already_pro", source: "subscription", provider: "app_store" }), "ownedAppStore");
  assert.equal(checkoutErrorKey({ kind: "already_pro", source: "subscription", provider: "stripe" }), "ownedWeb");
  assert.equal(checkoutErrorKey({ kind: "already_pro", source: "lifetime", provider: "stripe" }), "ownedLifetime");
  assert.equal(checkoutErrorKey({ kind: "already_pro", source: "lifetime", provider: "app_store" }), "ownedLifetime");
  assert.equal(checkoutErrorKey({ kind: "already_pro", source: null, provider: null }), "ownedOther");
  assert.equal(ownedReason("unknown", "unknown"), "other");
  const copy = messages.billing.pricing as Record<string, string>;
  for (const key of ["errSession", "errUnavailable", "errRate", "errGeneric", "ownedAppStore", "ownedWeb", "ownedLifetime", "ownedOther"]) {
    assert.ok(copy[key], key);
  }
  assert.match(copy.ownedAppStore, /App Store/);
  assert.match(copy.ownedWeb, /trytoone\.com/);
});

/* ---- query parameters and prices */

test("plan, from=app and checkout=cancelled are read; the one-shot ones are tidied away", () => {
  assert.deepEqual(readPricingParams("?plan=yearly&from=app"), { plan: "pro_yearly", fromApp: true, cancelled: false });
  assert.deepEqual(readPricingParams("?checkout=cancelled"), { plan: null, fromApp: false, cancelled: true });
  assert.deepEqual(readPricingParams("?plan=team&from=web"), { plan: null, fromApp: false, cancelled: false });
  assert.equal(tidyPricingSearch("?plan=yearly&from=app"), "?plan=yearly");
  assert.equal(tidyPricingSearch("?checkout=cancelled"), "");
  assert.equal(tidyPricingSearch("?plan=yearly"), null);
  assert.equal(tidyPricingSearch(""), null);
});

test("prices: known plans in display order, unknown plans skipped, tax line from the server flag", () => {
  const withUnknown = normalizePrices([
    ...PRICES,
    { plan: "pro_team", interval: "month", amount: 2900, currency: "eur", display_price: "€29", tax_inclusive: true },
  ]);
  assert.deepEqual(orderedPrices(withUnknown).map((price) => price.plan), ["pro_monthly", "pro_yearly", "pro_lifetime"]);
  assert.equal(taxNoteKey(PRICES), "vatIncluded");
  assert.equal(taxNoteKey(PRICES.map((price) => ({ ...price, tax_inclusive: false }))), "taxExcluded");
  assert.equal(taxNoteKey([]), "taxExcluded");
});
