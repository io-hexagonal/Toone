import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";
import { createBillingMock } from "../../scripts/billing-mock-api.mjs";
import {
  BillingError,
  checkCode,
  getBillingFeatures,
  getCheckoutStatus,
  getEntitlement,
  getPrices,
  listCodeInvitations,
  listInvitationRedemptions,
  redeemCode,
  startCheckout,
  startPortal,
  submitContractRequest,
  type BillingFailure,
} from "../../lib/billing/api";
import { pollCheckoutReturn } from "../../lib/billing/checkout-return";

const env = process.env as Record<string, string | undefined>;
const TOKEN = "mock_token";
const mock = createBillingMock({ quiet: true, completeMs: 0, site: "http://site.test" });
let origin = "";

before(async () => {
  await new Promise<void>(resolve => mock.server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(mock.server.address() as AddressInfo).port}`;
  env.NEXT_PUBLIC_API_BASE_URL = `${origin}/v1`;
});

after(async () => {
  delete env.NEXT_PUBLIC_API_BASE_URL;
  await new Promise(resolve => mock.server.close(resolve));
});

beforeEach(() => mock.reset("free"));

async function scenario(name: string) {
  const res = await fetch(`${origin}/__test/scenario`, { method: "POST", body: JSON.stringify({ scenario: name }) });
  assert.equal(res.status, 200);
}

async function failureOf(promise: Promise<unknown>): Promise<BillingFailure> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof BillingError);
    return error.failure;
  }
  assert.fail("expected a failure");
}

test("mock: free account buys yearly, the success flow turns Pro on", async () => {
  assert.equal((await getEntitlement(TOKEN)).plan, "free");
  const session = await startCheckout(TOKEN, { plan: "pro_yearly", locale: "pt", return: "web" });
  assert.match(session.checkout_url, /^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_mock_\d+$/);
  assert.deepEqual(await getCheckoutStatus(TOKEN, session.session_id), { status: "open", entitled: false });

  const complete = await fetch(`${origin}/__mock/complete?session_id=${session.session_id}`, { redirect: "manual" });
  assert.equal(complete.status, 302);
  assert.equal(complete.headers.get("location"), `http://site.test/pt/success?session_id=${session.session_id}`);

  const final = await pollCheckoutReturn({ token: TOKEN, sessionId: session.session_id, sleep: async () => {} });
  assert.equal(final.kind, "active");
  assert.equal(final.kind === "active" && final.entitlement.billing_provider, "stripe");
  assert.equal(final.kind === "active" && final.entitlement.plan_interval, "year");

  const portal = await startPortal(TOKEN, { locale: "pt", return: "web" });
  assert.match(portal.url, /^https:\/\/billing\.stripe\.com\//);
});

test("mock: an expired checkout ends the success flow", async () => {
  const session = await startCheckout(TOKEN, { plan: "pro_monthly", locale: "en", return: "web" });
  await fetch(`${origin}/__mock/expire?session_id=${session.session_id}`, { redirect: "manual" });
  const final = await pollCheckoutReturn({ token: TOKEN, sessionId: session.session_id, sleep: async () => {} });
  assert.deepEqual(final, { kind: "error", reason: "expired", failure: null });
});

test("mock: App Store Pro is refused at checkout with its provider", async () => {
  await scenario("pro_app_store");
  assert.deepEqual(await failureOf(startCheckout(TOKEN, { plan: "pro_lifetime", locale: "en", return: "web" })), {
    kind: "already_pro", source: "subscription", provider: "app_store",
  });
  const entitlement = await getEntitlement(TOKEN);
  assert.equal(entitlement.manage, "app_store");
});

test("mock: payments off turns the flags off and checkout reports unavailable", async () => {
  await scenario("payments_off");
  const features = await getBillingFeatures();
  assert.equal(features.stripe_pro_checkout, false);
  assert.equal(features.billing_portal, false);
  assert.equal(features.pro_codes, true);
  assert.equal(features.payments_contract, 0);
  assert.equal((await failureOf(startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" }))).kind, "payments_unavailable");
  // Prices stay public so the page can still render them.
  assert.equal((await getPrices()).length, 3);
});

test("mock: signed out answers 401 everywhere signed-in", async () => {
  await scenario("signed_out");
  assert.equal((await failureOf(getEntitlement(TOKEN))).kind, "unauthenticated");
  assert.deepEqual(await pollCheckoutReturn({ token: TOKEN, sessionId: null, sleep: async () => {} }), { kind: "signed_out" });
});

test("mock: code outcomes", async () => {
  assert.equal((await failureOf(redeemCode(TOKEN, "nope"))).kind, "invalid_code");
  assert.equal((await failureOf(redeemCode(TOKEN, "INVALID"))).kind, "invalid_code");
  assert.equal((await failureOf(redeemCode(TOKEN, "USED"))).kind, "code_already_redeemed");
  assert.equal((await failureOf(redeemCode(TOKEN, "VERIFY"))).kind, "email_verification_required");
  assert.equal((await failureOf(checkCode(TOKEN, "LIMIT"))).kind, "rate_limited");

  const plus = await redeemCode(TOKEN, "plus3");
  assert.deepEqual(plus.benefit, { kind: "free_creations", value: 3 });
  assert.deepEqual(plus.entitlement.free_routine_creations, { used: 1, limit: 5 });
  assert.equal((await failureOf(redeemCode(TOKEN, "PLUS3"))).kind, "code_already_redeemed");

  const pro = await redeemCode(TOKEN, "PRO30");
  assert.equal(pro.entitlement.plan, "pro");
  assert.equal(pro.entitlement.source, "grant");
  assert.deepEqual(await failureOf(redeemCode(TOKEN, "LIFETIME")), { kind: "already_pro", source: "grant", provider: "toone" });

  await scenario("codes_off");
  assert.equal((await failureOf(redeemCode(TOKEN, "PRO30"))).kind, "payments_unavailable");
});

test("mock: future enum values decode without breaking", async () => {
  await scenario("future_enums");
  const entitlement = await getEntitlement(TOKEN);
  assert.equal(entitlement.plan, "pro");
  assert.equal(entitlement.source, "unknown");
  assert.equal(entitlement.billing_provider, "unknown");
  assert.equal(entitlement.manage, "unknown");
  assert.deepEqual((await getPrices()).map(p => p.plan), ["pro_monthly", "pro_yearly", "pro_lifetime"]);
});

test("mock: admin code list and redemption ledger", async () => {
  const [invitation] = await listCodeInvitations(TOKEN);
  assert.deepEqual(invitation.benefit, { kind: "pro_days", value: 30 });
  const page = await listInvitationRedemptions(TOKEN, invitation.id, { limit: 1 });
  assert.equal(page.entries.length, 1);
  assert.equal(page.has_more, true);
});

test("mock: contract requests are accepted without signing in", async () => {
  await submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-1" });
  assert.equal((await failureOf(submitContractRequest({ kind: "cancel", email: "nope", order_ref: "" }))).kind, "unknown");
});
