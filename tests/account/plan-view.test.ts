import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createTranslator } from "next-intl";
import { describePlan } from "../../components/account/plan-view";
import { legalInvoiceCopy } from "../../components/billing/legal-invoice";
import en from "../../messages/en.json";
import { normalizeEntitlement } from "../../lib/billing/api";

/* The account page's reading of GET /me/entitlement (contract fields billing_provider, manage, plan_interval). */

const base = {
  plan: "free", source: null, product_id: null, status: null, expires_at: null, will_renew: null,
  billing_provider: null, manage: null, plan_interval: null,
  app_account_token: "11111111-1111-4111-8111-111111111111",
  free_routine_creations: { used: 1, limit: 2 }, guest_passes: null, guest_of: null, email_verification_required: false,
};
const view = (patch: Record<string, unknown>) => describePlan(normalizeEntitlement({ ...base, ...patch }));
const END = "2027-09-30T12:00:00Z";

test("free plan: creations X of N, nothing to manage", () => {
  assert.deepEqual(view({}), {
    tier: "free", provider: null, interval: null, dateLine: null, manage: "none",
    creations: { used: 1, limit: 2, exhausted: false }, guestOf: null,
  });
  // `used` is raw and can exceed the limit (old 5-creation allowance): shown clamped, flagged as used up.
  assert.deepEqual(view({ free_routine_creations: { used: 4, limit: 2 } }).creations, { used: 2, limit: 2, exhausted: true });
  assert.deepEqual(view({ free_routine_creations: { used: 1, limit: 5 } }).creations, { used: 1, limit: 5, exhausted: false });
});

test("Stripe yearly: portal, renews or ends by will_renew; past_due is grace", () => {
  const stripe = { plan: "pro", source: "subscription", status: "active", product_id: "pro_yearly", expires_at: END,
    billing_provider: "stripe", manage: "stripe_portal", plan_interval: "year" };
  const renewing = view({ ...stripe, will_renew: true });
  assert.equal(renewing.tier, "pro");
  assert.equal(renewing.provider, "stripe");
  assert.equal(renewing.manage, "portal");
  assert.equal(renewing.interval, "year");
  assert.deepEqual(renewing.dateLine, { key: "renews", date: END });
  assert.equal(renewing.creations, null);
  assert.deepEqual(view({ ...stripe, will_renew: false }).dateLine, { key: "ends", date: END });
  assert.deepEqual(view({ ...stripe, status: "grace", will_renew: true }).dateLine, { key: "grace" });
});

test("Stripe lifetime keeps the portal (invoices); App Store lifetime has nothing to manage", () => {
  const stripeLife = view({ plan: "pro", source: "lifetime", status: "active", product_id: "pro_lifetime",
    billing_provider: "stripe", manage: "stripe_portal", plan_interval: "lifetime" });
  assert.equal(stripeLife.manage, "portal");
  assert.equal(stripeLife.interval, "lifetime");
  assert.deepEqual(stripeLife.dateLine, { key: "lifetime" });
  const appleLife = view({ plan: "pro", source: "lifetime", status: "active", product_id: "app.Toone.pro.lifetime",
    billing_provider: "app_store", manage: null, plan_interval: "lifetime" });
  assert.equal(appleLife.provider, "app_store");
  assert.equal(appleLife.manage, "none");
});

test("App Store subscription is managed by Apple, also on a server that predates the new fields", () => {
  const apple = view({ plan: "pro", source: "subscription", status: "active", expires_at: END, will_renew: true,
    billing_provider: "app_store", manage: "app_store", plan_interval: "month" });
  assert.equal(apple.manage, "app_store");
  assert.equal(apple.provider, "app_store");
  const old = describePlan(normalizeEntitlement({ plan: "pro", source: "subscription", status: "active", expires_at: END, will_renew: true }));
  assert.equal(old.provider, "app_store");
  assert.equal(old.manage, "app_store");
});

test("code grants and guest months: billed by nobody, nothing to manage", () => {
  const code = view({ plan: "pro", source: "grant", status: "active", expires_at: END, billing_provider: "toone" });
  assert.equal(code.provider, "toone");
  assert.equal(code.manage, "none");
  assert.deepEqual(code.dateLine, { key: "until", date: END });
  assert.deepEqual(view({ plan: "pro", source: "grant", status: "active", billing_provider: "toone" }).dateLine, { key: "noEnd" });
  const guest = view({ plan: "pro", source: "guest", status: "active", expires_at: END, billing_provider: "toone",
    guest_of: { email: "owner@example.com", name: "Ana" } });
  assert.equal(guest.provider, "guest");
  assert.equal(guest.guestOf, "Ana");
  assert.equal(guest.manage, "none");
});

test("values this site does not know yet never crash and never offer a manage button", () => {
  const future = view({ plan: "pro", source: "partner", status: "paused", billing_provider: "paddle", manage: "paddle_portal", plan_interval: "quarter" });
  assert.equal(future.tier, "pro");
  assert.equal(future.provider, "unknown");
  assert.equal(future.manage, "none");
  assert.equal(future.interval, null);
});

test("the account page shows the remembered order reference and, in Direct mode, the legal invoice", () => {
  const page = fs.readFileSync("components/account/AccountPage.tsx", "utf8");
  assert.match(page, /recallOrderRef\(session\.user\.id\)/);
  assert.match(page, /legalInvoiceCopy\(entitlement\.legal_invoice\)/);
  // The API sends legal_invoice only on the checkout status:
  // the page reads it from the last purchase's session, not the entitlement.
  assert.match(page, /recallCheckoutSession\(session\.user\.id\)/);
  assert.match(page, /getCheckoutStatus\(session\.token, sessionId\)\)\.legal_invoice/);
  const t = createTranslator({ locale: "en", messages: en, namespace: "account.page" });
  const say = (invoice: Parameters<typeof legalInvoiceCopy>[0]) => {
    const copy = legalInvoiceCopy(invoice);
    return copy && ("values" in copy ? t(copy.key, copy.values) : t(copy.key));
  };
  assert.equal(say(normalizeEntitlement({ plan: "pro" }).legal_invoice), null, "absent: nothing shown");
  assert.equal(say({ status: "pending", number: null, atcud: null }), "Legal invoice: being issued (emailed to you).");
  assert.equal(say({ status: "issued", number: "FR 2026/7", atcud: "JJ7K2M4P-7" }), "Legal invoice: FR 2026/7 · ATCUD JJ7K2M4P-7");
  assert.match(t("orderRefNote"), /contract form/);
});
