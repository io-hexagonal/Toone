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
  confirmContractRequest,
  createCodeInvitation,
  redeemCode,
  startCheckout,
  startPortal,
  submitContractRequest,
  type BillingFailure,
} from "../../lib/billing/api";
import { pollCheckoutReturn } from "../../lib/billing/checkout-return";
import { listCodeLedger } from "../../lib/billing/redemptions";

const env = process.env as Record<string, string | undefined>;
const TOKEN = "mock_token";
const mock = createBillingMock({ quiet: true, completeMs: 0, invoiceMs: 0, site: "http://site.test" });
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
  const open = await getCheckoutStatus(TOKEN, session.session_id);
  assert.equal(open.status, "open");
  assert.equal(open.entitled, false);
  assert.match(open.order_ref ?? "", /^TOONE-[A-Z0-9]{16}$/);
  assert.equal(open.legal_invoice, null, "no legal invoice outside Direct mode");

  const complete = await fetch(`${origin}/__mock/complete?session_id=${session.session_id}`, { redirect: "manual" });
  assert.equal(complete.status, 302);
  assert.equal(complete.headers.get("location"), `http://site.test/pt/success?session_id=${session.session_id}`);

  const final = await pollCheckoutReturn({ token: TOKEN, sessionId: session.session_id, sleep: async () => {} });
  assert.equal(final.kind, "active");
  assert.equal(final.kind === "active" && final.entitlement.billing_provider, "stripe");
  assert.equal(final.kind === "active" && final.entitlement.plan_interval, "year");
  assert.equal(final.kind === "active" && final.orderRef, open.order_ref);

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
  // Prices answer 200 with an empty list, which the pricing page reads as "coming soon".
  assert.deepEqual(await getPrices(), []);
  assert.equal((await failureOf(submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12" }))).kind, "payments_unavailable");
});

test("mock: the checkout body is exactly {plan, locale, return}; anything else is 400", async () => {
  for (const extra of [{ success_url: "https://x" }, { cancel_url: "https://x" }, { price_id: "price_1" }]) {
    const res = await fetch(`${origin}/v1/billing/checkout`, {
      method: "POST", headers: { Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ plan: "pro_yearly", locale: "en", return: "web", ...extra }),
    });
    assert.equal(res.status, 400, JSON.stringify(extra));
    assert.equal((await res.json()).code, "invalid_input");
  }
});

test("mock: another checkout being created is a 409 conflict", async () => {
  await scenario("checkout_busy");
  assert.deepEqual(await failureOf(startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" })), { kind: "conflict" });
});

test("mock: a delayed payment keeps the session open until it clears", async () => {
  await scenario("slow_payment");
  const session = await startCheckout(TOKEN, { plan: "pro_monthly", locale: "en", return: "app" });
  const back = await fetch(`${origin}/__mock/complete?session_id=${session.session_id}`, { redirect: "manual" });
  assert.equal(back.headers.get("location"), `http://site.test/en/success?session_id=${session.session_id}&return=app`);
  const waiting = await pollCheckoutReturn({ token: TOKEN, sessionId: session.session_id, sleep: async () => {}, config: { processingAfterMs: 0 } });
  assert.equal(waiting.kind, "processing");
  assert.match(waiting.kind === "processing" ? waiting.orderRef ?? "" : "", /^TOONE-/);

  await fetch(`${origin}/__mock/clear?session_id=${session.session_id}`);
  const cleared = await pollCheckoutReturn({ token: TOKEN, sessionId: session.session_id, sleep: async () => {} });
  assert.equal(cleared.kind, "active");
});

test("mock: Direct mode adds the legal invoice to the checkout status and the entitlement", async () => {
  await scenario("direct");
  const session = await startCheckout(TOKEN, { plan: "pro_lifetime", locale: "pt", return: "web" });
  assert.equal((await getCheckoutStatus(TOKEN, session.session_id)).legal_invoice, null, "nothing before payment");
  await fetch(`${origin}/__mock/complete?session_id=${session.session_id}`, { redirect: "manual" });
  const status = await getCheckoutStatus(TOKEN, session.session_id);
  assert.equal(status.legal_invoice?.status, "issued", "invoiceMs 0 issues at once");
  assert.match(status.legal_invoice?.number ?? "", /^FR TOONE2026\//);
  assert.match(status.legal_invoice?.atcud ?? "", /-/);
  assert.deepEqual((await getEntitlement(TOKEN)).legal_invoice, status.legal_invoice);
});

test("mock: lifetime stays buyable over a Stripe subscription, not over App Store or lifetime Pro", async () => {
  await scenario("pro_stripe");
  assert.equal((await startCheckout(TOKEN, { plan: "pro_lifetime", locale: "en", return: "web" })).checkout_url.startsWith("https://checkout.stripe.com/"), true);
  assert.deepEqual(await failureOf(startCheckout(TOKEN, { plan: "pro_monthly", locale: "en", return: "web" })), {
    kind: "already_pro", source: "subscription", provider: "stripe",
  });
  await scenario("pro_lifetime");
  assert.equal((await failureOf(startCheckout(TOKEN, { plan: "pro_lifetime", locale: "en", return: "web" }))).kind, "already_pro");
  await scenario("pro_code");
  assert.ok((await startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" })).session_id, "grants never refuse");
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

  assert.deepEqual(await checkCode(TOKEN, "PRO30"), { benefit: { kind: "pro_days", value: 30 }, redeemable: true });
  const raw = await fetch(`${origin}/v1/me/codes/check`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ code: "LIFETIME" }),
  });
  assert.deepEqual((await raw.json()).data, { benefit: { kind: "pro_lifetime", value: null }, redeemable: true });

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

test("mock: admin code list, create warnings and the cursor-paged redemption ledger", async () => {
  const [invitation] = await listCodeInvitations(TOKEN);
  assert.deepEqual(invitation.benefit, { kind: "pro_days", value: 30 });

  const first = await listCodeLedger(TOKEN, invitation.id, { limit: 2 });
  assert.equal(first.entries.length, 2);
  assert.equal(first.has_more, true);
  assert.ok(first.next_cursor);
  assert.deepEqual(first.entries[1], { redeemed_at: first.entries[1].redeemed_at, account_id: null, channel: "signup", benefit: { kind: "pro_days", value: 30 } });
  const page = await listCodeLedger(TOKEN, invitation.id, { cursor: first.next_cursor });
  assert.equal(page.entries.length, 50);
  assert.equal(page.has_more, true);
  const last = await listCodeLedger(TOKEN, invitation.id, { cursor: page.next_cursor });
  assert.equal(last.entries.length, 10);
  assert.deepEqual([last.has_more, last.next_cursor], [false, null]);
  const offset = await fetch(`${origin}/v1/admin/invitations/${invitation.id}/redemptions?offset=60`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  assert.equal((await offset.json()).data.entries.length, 50, "offset is ignored: there is no offset paging");

  const unlimited = await createCodeInvitation(TOKEN, { recipient_name: "Launch", code: "LAUNCH-2026-PRO", days: 30, max_uses: 0, benefit: { kind: "pro_days", value: 30 } });
  assert.deepEqual(unlimited.warnings, ["unlimited_pro_code"]);
  const capped = await createCodeInvitation(TOKEN, { recipient_name: "Launch", code: "LAUNCH-2026-CAP", days: 30, max_uses: 5, benefit: { kind: "pro_days", value: 30 } });
  assert.deepEqual(capped.warnings, []);
});

async function contractLinks(): Promise<string[]> {
  return (await (await fetch(`${origin}/__test/state`)).json()).data.contract_links;
}

test("mock: contract requests are accepted without signing in and email a confirm link in the request's locale", async () => {
  await submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12", locale: "de", name: "Ana" });
  const [link] = await contractLinks();
  assert.match(link, /^http:\/\/site\.test\/de\/cancel-contract\/confirm#token=[A-Za-z0-9_-]{43}$/);
  assert.equal((await failureOf(submitContractRequest({ kind: "cancel", email: "nope", order_ref: "" }))).kind, "unknown");
  assert.equal((await failureOf(submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-1" }))).kind, "unknown");
  assert.equal((await failureOf(submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12", name: "x".repeat(201) }))).kind, "unknown");
});

test("mock: confirming carries out the request once; an unknown token is 404", async () => {
  await scenario("pro_stripe");
  await submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12" });
  const token = new URL((await contractLinks())[0]).hash.replace("#token=", "");
  assert.deepEqual(await confirmContractRequest(token), { kind: "cancel", outcome: "cancelled" });
  assert.equal((await getEntitlement(TOKEN)).will_renew, false);
  assert.deepEqual(await confirmContractRequest(token), { kind: "cancel", outcome: "cancelled" }, "the first outcome again");

  await submitContractRequest({ kind: "withdraw", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12" });
  const withdraw = new URL((await contractLinks())[1]).hash.replace("#token=", "");
  assert.deepEqual(await confirmContractRequest(withdraw), { kind: "withdraw", outcome: "withdrawn" });
  assert.equal((await getEntitlement(TOKEN)).plan, "free");

  await scenario("pro_lifetime");
  await submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12" });
  const lifetime = new URL((await contractLinks())[0]).hash.replace("#token=", "");
  assert.deepEqual(await confirmContractRequest(lifetime), { kind: "cancel", outcome: "nothing_to_cancel" });

  const expired = await failureOf(confirmContractRequest("x".repeat(43)));
  assert.equal(expired.kind === "unknown" && expired.status, 404);
});
