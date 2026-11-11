import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { ApiError, apiErrorFrom } from "../../lib/api";
import {
  BillingError,
  billingFailure,
  checkCode,
  checkInvitationBenefit,
  confirmEmailVerification,
  sendEmailVerification,
  createCodeInvitation,
  getBillingFeatures,
  getBillingFeaturesOrOff,
  getCheckoutStatus,
  getEntitlement,
  getPrices,
  isPro,
  listCodeInvitations,
  confirmContractRequest,
  mapApiError,
  normalizeBenefit,
  normalizeCheckoutStatus,
  normalizeEntitlement,
  normalizeLegalInvoice,
  normalizeOrderRef,
  planFromParam,
  planParam,
  redeemCode,
  revokeCodeInvitation,
  startCheckout,
  startPortal,
  submitContractRequest,
  type BillingFailure,
} from "../../lib/billing/api";

const BASE = "https://api.test/v1";
const TOKEN = "tok_123";
const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;

type Call = { url: string; method: string; headers: Headers; body: unknown; cache?: RequestCache };
let calls: Call[] = [];
let replies: Array<(call: Call) => Response | Promise<Response>> = [];

function reply(status: number, body?: unknown): (call: Call) => Response {
  return () => new Response(body === undefined ? null : JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
}
const data = (value: unknown) => reply(200, { data: value });

beforeEach(() => {
  env.NEXT_PUBLIC_API_BASE_URL = BASE;
  calls = [];
  replies = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const call: Call = {
      url: String(input),
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
      cache: init.cache,
    };
    calls.push(call);
    const next = replies.shift();
    if (!next) throw new Error(`unexpected request ${call.method} ${call.url}`);
    return next(call);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete env.NEXT_PUBLIC_API_BASE_URL;
});

async function failureOf(promise: Promise<unknown>): Promise<BillingFailure> {
  try {
    await promise;
  } catch (error) {
    assert.ok(error instanceof BillingError, `expected BillingError, got ${error}`);
    return error.failure;
  }
  assert.fail("expected the call to fail");
}

const PRO_STRIPE = {
  plan: "pro", source: "subscription", product_id: "pro_yearly", status: "active",
  expires_at: "2027-11-10T00:00:00Z", will_renew: true, app_account_token: "uuid",
  free_routine_creations: { used: 2, limit: 2 }, guest_passes: null, guest_of: null,
  email_verification_required: false, billing_provider: "stripe", manage: "stripe_portal", plan_interval: "year",
};

/* ---- request shapes */

test("checkout posts plan, locale and return with the bearer token, uncached", async () => {
  replies.push(data({ checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1", session_id: "cs_test_1" }));
  const session = await startCheckout(TOKEN, { plan: "pro_yearly", locale: "pt", return: "app" });
  assert.deepEqual(session, { checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1", session_id: "cs_test_1" });
  const [call] = calls;
  assert.equal(call.url, `${BASE}/billing/checkout`);
  assert.equal(call.method, "POST");
  assert.equal(call.headers.get("Authorization"), `Bearer ${TOKEN}`);
  assert.equal(call.headers.get("Content-Type"), "application/json");
  assert.equal(call.cache, "no-store");
  assert.deepEqual(call.body, { plan: "pro_yearly", locale: "pt", return: "app" });
});

test("checkout only sends the contract fields", async () => {
  replies.push(data({ checkout_url: "https://checkout.stripe.com/c/pay/cs_1", session_id: "cs_1" }));
  const input = { plan: "pro_monthly", locale: "en", return: "web", token: "leak" } as never;
  await startCheckout(TOKEN, input);
  assert.deepEqual(calls[0].body, { plan: "pro_monthly", locale: "en", return: "web" });
});

test("checkout never forwards redirects or a price id, even if a caller passes them", async () => {
  replies.push(data({ checkout_url: "https://checkout.stripe.com/c/pay/cs_1", session_id: "cs_1" }));
  const input = {
    plan: "pro_lifetime", locale: "de", return: "web",
    success_url: "https://evil.example/ok", cancel_url: "https://evil.example/no", price_id: "price_123",
  } as never;
  await startCheckout(TOKEN, input);
  assert.deepEqual(calls[0].body, { plan: "pro_lifetime", locale: "de", return: "web" });
});

test("409 conflict (another checkout still being created) is its own failure", async () => {
  replies.push(reply(409, { code: "conflict", message: "another checkout is being created; retry" }));
  assert.deepEqual(await failureOf(startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" })), { kind: "conflict" });
  assert.equal(calls.length, 1, "no entitlement lookup for a conflict");
});

test("a checkout URL off the Stripe allow-list is refused, never returned", async () => {
  replies.push(data({ checkout_url: "https://checkout.stripe.com.evil.com/pay", session_id: "cs_1" }));
  const failure = await failureOf(startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" }));
  assert.equal(failure.kind, "unknown");
  assert.equal(failure.kind === "unknown" && failure.code, "untrusted_redirect");

  replies.push(data({ checkout_url: "https://checkout.stripe.com/pay" }));
  assert.equal((await failureOf(startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" }))).kind, "unknown");
});

test("checkout status and entitlement are signed-in GETs; the session id is path-encoded", async () => {
  replies.push(data({ status: "complete", entitled: true, order_ref: "TOONE-ABCDEFGHIJKLMNOP" }));
  assert.deepEqual(await getCheckoutStatus(TOKEN, "cs_test/../x"), {
    status: "complete", entitled: true, order_ref: "TOONE-ABCDEFGHIJKLMNOP", legal_invoice: null,
  });
  assert.equal(calls[0].url, `${BASE}/billing/checkout/cs_test%2F..%2Fx`);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("Authorization"), `Bearer ${TOKEN}`);

  replies.push(data(PRO_STRIPE));
  await getEntitlement(TOKEN);
  assert.equal(calls[1].url, `${BASE}/me/entitlement`);
  assert.equal(calls[1].cache, "no-store");
});

test("portal posts locale and return and only follows the Stripe billing host", async () => {
  replies.push(data({ url: "https://billing.stripe.com/p/session/test_1" }));
  assert.deepEqual(await startPortal(TOKEN, { locale: "de", return: "web" }), { url: "https://billing.stripe.com/p/session/test_1" });
  assert.equal(calls[0].url, `${BASE}/billing/portal`);
  assert.deepEqual(calls[0].body, { locale: "de", return: "web" });

  replies.push(data({ portal_url: "https://billing.stripe.com/p/session/test_2" }));
  assert.equal((await startPortal(TOKEN, { locale: "en", return: "web" })).url, "https://billing.stripe.com/p/session/test_2");

  replies.push(data({ url: "https://checkout.stripe.com/p/session/test_3" }));
  assert.equal((await failureOf(startPortal(TOKEN, { locale: "en", return: "web" }))).kind, "unknown");
});

test("contract requests are public, trimmed and uncached, with the locale and an optional name", async () => {
  replies.push(reply(202, { data: { accepted: true } }));
  await submitContractRequest({ kind: "withdraw", email: " me@example.com ", order_ref: " TOONE-ABCDEFGH12 ", locale: "de", name: "  Ana Buyer " });
  const [call] = calls;
  assert.equal(call.url, `${BASE}/billing/contract-requests`);
  assert.equal(call.method, "POST");
  assert.equal(call.headers.get("Authorization"), null);
  assert.equal(call.cache, "no-store");
  assert.deepEqual(call.body, { kind: "withdraw", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12", locale: "de", name: "Ana Buyer" });

  replies.push(reply(202, { data: { accepted: true } }));
  await submitContractRequest({ kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12", name: "   " });
  assert.deepEqual(calls[1].body, { kind: "cancel", email: "me@example.com", order_ref: "TOONE-ABCDEFGH12" }, "an empty name and no locale are left out");
});

test("contract confirmation posts the token, uncached, and reads kind and outcome", async () => {
  replies.push(data({ kind: "withdraw", outcome: "withdrawn" }));
  assert.deepEqual(await confirmContractRequest("tok_abc"), { kind: "withdraw", outcome: "withdrawn" });
  assert.equal(calls[0].url, `${BASE}/billing/contract-requests/confirm`);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.get("Authorization"), null);
  assert.equal(calls[0].cache, "no-store");
  assert.deepEqual(calls[0].body, { token: "tok_abc" });

  replies.push(data({ kind: "cancel", outcome: "paused" }));
  assert.deepEqual(await confirmContractRequest("tok_abc"), { kind: "cancel", outcome: "unknown" });

  replies.push(reply(404, { code: "not_found", message: "resource not found" }));
  const failure = await failureOf(confirmContractRequest("tok_old"));
  assert.equal(failure.kind === "unknown" && failure.status, 404);
});

test("order references: TOONE- plus 8–64 letters or digits, upper-cased", () => {
  assert.equal(normalizeOrderRef(" toone-abcdefgh12 "), "TOONE-ABCDEFGH12");
  assert.equal(normalizeOrderRef(`TOONE-${"A".repeat(64)}`), `TOONE-${"A".repeat(64)}`);
  for (const bad of ["", "TOONE-", "TOONE-SHORT", `TOONE-${"A".repeat(65)}`, "ORDER-ABCDEFGH12", "TOONE-ABCD EFGH12", 42, null]) {
    assert.equal(normalizeOrderRef(bad), null, String(bad));
  }
  assert.equal(normalizeCheckoutStatus({ status: "open", entitled: false, order_ref: "<b>" }).order_ref, null);
});

test("legal invoice: optional, tolerated when absent or malformed", () => {
  assert.equal(normalizeLegalInvoice(undefined), null);
  assert.equal(normalizeLegalInvoice({ status: "voided" }), null);
  assert.equal(normalizeLegalInvoice("pending"), null);
  assert.deepEqual(normalizeLegalInvoice({ status: "pending" }), { status: "pending", number: null, atcud: null });
  assert.deepEqual(normalizeLegalInvoice({ status: "issued", number: "FR 2026/7", atcud: "JJ7K2M4P-7" }),
    { status: "issued", number: "FR 2026/7", atcud: "JJ7K2M4P-7" });
  assert.deepEqual(normalizeCheckoutStatus({ status: "complete", entitled: true, legal_invoice: { status: "pending" } }).legal_invoice,
    { status: "pending", number: null, atcud: null });
  assert.deepEqual(normalizeEntitlement({ ...PRO_STRIPE, legal_invoice: { status: "issued", number: "FR 1" } }).legal_invoice,
    { status: "issued", number: "FR 1", atcud: null });
});

test("prices while payments are off: 200 with an empty list", async () => {
  replies.push(data([]));
  assert.deepEqual(await getPrices(), []);
});

test("prices are public and accept a caching init", async () => {
  replies.push(data([
    { plan: "pro_monthly", interval: "month", amount: 900, currency: "eur", display_price: "€9", tax_inclusive: true },
    { plan: "pro_lifetime", interval: null, amount: 19900, currency: "eur", display_price: "€199", tax_inclusive: true },
    // Never shown: a regional price the site did not ask for.
    { plan: "pro_yearly", interval: "year", amount: 7999, currency: "usd", display_price: "$79.99", tax_inclusive: false },
  ]));
  const prices = await getPrices({ cache: "force-cache" });
  assert.equal(calls[0].url, `${BASE}/billing/prices?currency=eur`);
  assert.equal(calls[0].headers.get("Authorization"), null);
  assert.equal(calls[0].cache, "force-cache");
  assert.deepEqual(prices.map(p => [p.plan, p.interval]), [["pro_monthly", "month"], ["pro_lifetime", "lifetime"]]);
});

test("code check and redeem post the trimmed code; an empty code never reaches the API", async () => {
  replies.push(data({ benefit: { kind: "pro_days", value: 30 }, redeemable: true }));
  const checked = await checkCode(TOKEN, "  PRO30 ");
  assert.equal(calls[0].url, `${BASE}/me/codes/check`);
  assert.deepEqual(calls[0].body, { code: "PRO30" });
  assert.deepEqual(checked, { benefit: { kind: "pro_days", value: 30 }, redeemable: true });

  replies.push(data({ benefit: { kind: "pro_lifetime" }, entitlement: { ...PRO_STRIPE, source: "grant", billing_provider: "toone" } }));
  const redeemed = await redeemCode(TOKEN, "LIFETIME");
  assert.equal(calls[1].url, `${BASE}/me/codes/redeem`);
  assert.deepEqual(redeemed.benefit, { kind: "pro_lifetime", value: null });
  assert.equal(redeemed.entitlement.source, "grant");

  assert.equal((await failureOf(redeemCode(TOKEN, "   "))).kind, "invalid_code");
  assert.equal(calls.length, 2);
});

test("invite check reads the benefit and admits_signup (defaults to true for older servers)", async () => {
  replies.push(data({ valid: true, shared: true, label: "Launch", expires_at: "2026-12-01T00:00:00Z", benefit: { kind: "free_creations", value: 3 }, admits_signup: false }));
  const preview = await checkInvitationBenefit("PLUS3");
  assert.equal(calls[0].url, `${BASE}/auth/invite/check`);
  assert.equal(calls[0].headers.get("Authorization"), null);
  assert.deepEqual(preview.benefit, { kind: "free_creations", value: 3 });
  assert.equal(preview.admits_signup, false);

  replies.push(data({ valid: true, shared: false, label: "", expires_at: "2026-12-01T00:00:00Z" }));
  const legacy = await checkInvitationBenefit("OLD");
  assert.deepEqual(legacy.benefit, { kind: "none", value: null });
  assert.equal(legacy.admits_signup, true);
});

test("admin invitations carry benefit fields; create sends the benefit nested", async () => {
  replies.push(data([
    { id: "inv_1", recipient_name: "A", code_hint: "PRO…", status: "pending", email: "", user_id: "", account_name: "",
      created_at: "2026-11-01T00:00:00Z", expires_at: "2026-12-01T00:00:00Z", used_at: null, max_uses: 10, use_count: 1,
      benefit_kind: "pro_days", benefit_value: 30, admits_signup: false, campaign: "launch", created_by: "usr_admin" },
    { id: "inv_2", recipient_name: "B", code_hint: "OLD…", status: "redeemed", email: "", user_id: "", account_name: "",
      created_at: "2026-10-01T00:00:00Z", expires_at: "2026-11-01T00:00:00Z", used_at: null, max_uses: 1, use_count: 1 },
    null,
  ]));
  const list = await listCodeInvitations(TOKEN);
  assert.equal(calls[0].url, `${BASE}/admin/invitations`);
  assert.equal(list.length, 2);
  assert.deepEqual(list[0].benefit, { kind: "pro_days", value: 30 });
  assert.equal(list[0].admits_signup, false);
  assert.equal(list[0].campaign, "launch");
  assert.equal(list[0].created_by, "usr_admin");
  assert.deepEqual(list[1].benefit, { kind: "none", value: null });
  assert.equal(list[1].admits_signup, true);

  replies.push(reply(201, { data: { id: "inv_3", recipient_name: "C", code: "LIFE", expires_at: "2026-12-01T00:00:00Z", max_uses: 5,
    signup_url: "https://trytoone.com/invite#code=LIFE", email_queued: false, benefit: { kind: "pro_lifetime", value: null }, admits_signup: false, campaign: "",
    warnings: ["unlimited_pro_code", 7, ""] } }));
  const created = await createCodeInvitation(TOKEN, {
    recipient_name: "C", code: "LIFE", days: 30, max_uses: 5,
    benefit: { kind: "pro_lifetime", value: 99 }, admits_signup: false,
  });
  assert.equal(calls[1].method, "POST");
  assert.deepEqual(calls[1].body, {
    recipient_name: "C", code: "LIFE", days: 30, max_uses: 5, benefit: { kind: "pro_lifetime" }, admits_signup: false,
  });
  assert.deepEqual(created.benefit, { kind: "pro_lifetime", value: null });
  assert.equal(created.code, "LIFE");
  assert.deepEqual(created.warnings, ["unlimited_pro_code"]);

  replies.push(reply(201, { data: { id: "inv_4" } }));
  const plain = await createCodeInvitation(TOKEN, { recipient_name: "D", code: "PLUS", days: 7, benefit: { kind: "free_creations", value: 3 } });
  assert.deepEqual(plain.warnings, []);
  assert.deepEqual((calls[2].body as { benefit: unknown }).benefit, { kind: "free_creations", value: 3 });
});

test("admin revoke (the redemption ledger lives in lib/billing/redemptions)", async () => {
  replies.push(reply(204));
  await revokeCodeInvitation(TOKEN, "inv/1");
  assert.equal(calls[0].method, "DELETE");
  assert.equal(calls[0].url, `${BASE}/admin/invitations/inv%2F1`);

});

test("billing feature flags come from public capabilities and fail closed", async () => {
  replies.push(data({ schema_version: 1, features: { stripe_pro_checkout: true, billing_portal: false, pro_codes: true, payments: true }, contracts: { payments: 2 }, legacy_contracts: [] }));
  assert.deepEqual(await getBillingFeatures(), { stripe_pro_checkout: true, billing_portal: false, pro_codes: true, payments_contract: 2, billing_seller: null });
  assert.equal(calls[0].url, `${BASE}/capabilities`);
  assert.equal(calls[0].headers.get("Authorization"), null);

  // A server that predates the flags: everything off.
  replies.push(data({ schema_version: 1, features: { payments: false, stripe_pro_checkout: "yes" }, contracts: {} }));
  assert.deepEqual(await getBillingFeatures(), { stripe_pro_checkout: false, billing_portal: false, pro_codes: false, payments_contract: 0, billing_seller: null });

  replies.push(reply(502));
  assert.deepEqual(await getBillingFeaturesOrOff(), { stripe_pro_checkout: false, billing_portal: false, pro_codes: false, payments_contract: 0, billing_seller: null });
});

test("the seller model comes from features.billing_seller; unknown values read as unknown", async () => {
  for (const [wire, expected] of [
    ["managed_payments", "managed_payments"], ["managed", "managed_payments"], ["direct", "direct"],
    ["Direct", null], ["link", null], [true, null], [undefined, null],
  ] as const) {
    replies.push(data({ schema_version: 1, features: { stripe_pro_checkout: true, billing_seller: wire }, contracts: {} }));
    assert.equal((await getBillingFeatures()).billing_seller, expected, String(wire));
  }
});

/* ---- error mapping */

const ERROR_CASES: [string, number, unknown, BillingFailure["kind"]][] = [
  ["401 unauthorized", 401, { code: "unauthorized", message: "authentication required" }, "unauthenticated"],
  ["401 token_expired", 401, { code: "token_expired", message: "token expired" }, "unauthenticated"],
  ["401 without a body", 401, undefined, "unauthenticated"],
  ["503 payments off", 503, { code: "service_unavailable", message: "service temporarily unavailable" }, "payments_unavailable"],
  ["503 proxy page", 503, undefined, "payments_unavailable"],
  ["dedicated payments code", 409, { code: "payments_unavailable", message: "x" }, "payments_unavailable"],
  ["invalid_invitation", 403, { code: "invalid_invitation", message: "invitation is invalid" }, "invalid_code"],
  ["invalid_code", 400, { code: "invalid_code", message: "wrong" }, "invalid_code"],
  ["code_already_redeemed", 409, { code: "code_already_redeemed", message: "x" }, "code_already_redeemed"],
  ["email_verification_required", 403, { code: "email_verification_required", message: "x" }, "email_verification_required"],
  ["429", 429, { code: "rate_limit_exceeded", message: "slow down" }, "rate_limited"],
  ["nested error envelope", 429, { error: { code: "rate_limit_exceeded", message: "x" } }, "rate_limited"],
  ["409 conflict", 409, { code: "conflict", message: "retry" }, "conflict"],
  ["admin forbidden", 403, { code: "forbidden", message: "forbidden" }, "forbidden"],
  ["anything else", 400, { code: "invalid_input", message: "invalid request" }, "unknown"],
  ["500", 500, { code: "internal_error", message: "internal error" }, "unknown"],
];

for (const [name, status, body, kind] of ERROR_CASES) {
  test(`error mapping: ${name} → ${kind}`, async () => {
    replies.push(reply(status, body));
    const failure = await failureOf(getEntitlement(TOKEN));
    assert.equal(failure.kind, kind);
  });
}

test("unknown failures keep status, code and message", async () => {
  replies.push(reply(400, { code: "invalid_input", message: "plan is not offered" }));
  assert.deepEqual(await failureOf(startCheckout(TOKEN, { plan: "pro_yearly", locale: "en", return: "web" })), {
    kind: "unknown", status: 400, code: "invalid_input", message: "plan is not offered",
  });
});

test("already_pro names the account's current source and provider", async () => {
  replies.push(reply(409, { code: "already_pro", message: "this person already has Toone Pro", source: "subscription" }));
  replies.push(data({ ...PRO_STRIPE, billing_provider: "app_store", manage: "app_store" }));
  const failure = await failureOf(startCheckout(TOKEN, { plan: "pro_lifetime", locale: "en", return: "web" }));
  assert.deepEqual(failure, { kind: "already_pro", source: "subscription", provider: "app_store" });
  assert.equal(calls[1].url, `${BASE}/me/entitlement`);
});

test("already_pro names the blocking Pro from the error body, not the entitlement", async () => {
  // The Stripe yearly wins the entitlement, but the App Store subscription blocks Lifetime.
  replies.push(reply(409, { code: "already_pro", message: "x", source: "subscription", billing_provider: "app_store" }));
  replies.push(data(PRO_STRIPE));
  const failure = await failureOf(startCheckout(TOKEN, { plan: "pro_lifetime", locale: "en", return: "web" }));
  assert.deepEqual(failure, { kind: "already_pro", source: "subscription", provider: "app_store" });
  assert.equal(calls.length, 1, "no entitlement lookup when the body names the blocker");
});

test("ApiError keeps the error body's extra top-level fields", () => {
  const error = apiErrorFrom({ code: "already_pro", message: "x", source: "grant", billing_provider: "toone" }, 409);
  assert.deepEqual(error.fields, { source: "grant", billing_provider: "toone" });
  assert.deepEqual(apiErrorFrom({ error: { code: "x", message: "y", hint: 1 } }, 400).fields, { hint: 1 });
});

test("already_pro still maps when the entitlement lookup fails", async () => {
  replies.push(reply(409, { code: "already_pro", message: "x" }));
  replies.push(reply(500));
  assert.deepEqual(await failureOf(redeemCode(TOKEN, "PRO30")), { kind: "already_pro", source: null, provider: null });
});

test("network failures and aborts map to unknown with status 0", async () => {
  replies.push(() => { throw new TypeError("fetch failed"); });
  const failure = await failureOf(getEntitlement(TOKEN));
  assert.equal(failure.kind, "unknown");
  assert.equal(failure.kind === "unknown" && failure.status, 0);
  assert.equal(failure.kind === "unknown" && failure.code, "network_error");

  const abort = new DOMException("aborted", "AbortError");
  assert.equal((billingFailure(abort) as { code: string }).code, "aborted");
});

test("mapApiError and billingFailure accept plain ApiErrors", () => {
  const error = new ApiError("already_pro", "x", 409);
  assert.deepEqual(mapApiError(error, { source: "lifetime", provider: "stripe" }), { kind: "already_pro", source: "lifetime", provider: "stripe" });
  assert.deepEqual(mapApiError(error, { source: "partner" }), { kind: "already_pro", source: "unknown", provider: null });
  assert.deepEqual(billingFailure(new ApiError("token_expired", "x", 401)), { kind: "unauthenticated" });
});

/* ---- tolerant decoding */

test("entitlement keeps known values and the optional billing fields", () => {
  const entitlement = normalizeEntitlement(PRO_STRIPE);
  assert.deepEqual(entitlement, {
    plan: "pro", source: "subscription", status: "active", product_id: "pro_yearly",
    expires_at: "2027-11-10T00:00:00Z", will_renew: true, billing_provider: "stripe", manage: "stripe_portal",
    plan_interval: "year", free_routine_creations: { used: 2, limit: 2 }, email_verification_required: false, guest_of: null,
    legal_invoice: null,
  });
  assert.equal(isPro(entitlement), true);
  assert.equal("app_account_token" in entitlement, false);
});

test("entitlement from a server without the new fields", () => {
  const { billing_provider: _b, manage: _m, plan_interval: _p, ...legacy } = PRO_STRIPE;
  const entitlement = normalizeEntitlement({ ...legacy, source: "lifetime", expires_at: null, will_renew: null });
  assert.equal(entitlement.billing_provider, null);
  assert.equal(entitlement.manage, null);
  assert.equal(entitlement.plan_interval, null);
  assert.equal(entitlement.expires_at, null);
  assert.equal(entitlement.will_renew, null);
  assert.equal(entitlement.source, "lifetime");
});

test("unknown enum values are tolerated as \"unknown\"", () => {
  const entitlement = normalizeEntitlement({
    ...PRO_STRIPE, plan: "pro_plus", source: "partner", status: "paused", billing_provider: "paddle",
    manage: "paddle_portal", plan_interval: "quarter", guest_of: { email: "g@example.com" },
  });
  assert.equal(entitlement.plan, "unknown");
  assert.equal(isPro(entitlement), false);
  assert.equal(entitlement.source, "unknown");
  assert.equal(entitlement.status, "unknown");
  assert.equal(entitlement.billing_provider, "unknown");
  assert.equal(entitlement.manage, "unknown");
  assert.equal(entitlement.plan_interval, "unknown");
  assert.deepEqual(entitlement.guest_of, { email: "g@example.com", name: "" });
});

test("malformed entitlement bodies decode to a free account", () => {
  for (const raw of [null, undefined, "x", [], { free_routine_creations: { used: "1", limit: 2 } }]) {
    const entitlement = normalizeEntitlement(raw);
    assert.equal(entitlement.plan, "free");
    assert.equal(entitlement.free_routine_creations, null);
    assert.equal(isPro(entitlement), false);
  }
  assert.equal(isPro(null), false);
});

test("prices skip unknown plans and malformed rows; checkout status tolerates new states", async () => {
  replies.push(data({ prices: [
    { plan: "pro_yearly", interval: "year", amount: 7900, currency: "eur", display_price: "€79", tax_inclusive: true },
    { plan: "pro_team", interval: "month", amount: 2900, currency: "eur", display_price: "€29", tax_inclusive: true },
    { plan: "pro_monthly", amount: "9", currency: "eur", display_price: "€9" },
    "junk",
  ] }));
  assert.deepEqual(await getPrices(), [
    { plan: "pro_yearly", interval: "year", amount: 7900, currency: "eur", display_price: "€79", tax_inclusive: true },
  ]);

  replies.push(data({ status: "processing", entitled: "yes" }));
  assert.deepEqual(await getCheckoutStatus(TOKEN, "cs_1"), { status: "unknown", entitled: false, order_ref: null, legal_invoice: null });
});

test("benefits: nested, flat, unknown and missing", () => {
  assert.deepEqual(normalizeBenefit({ benefit: { kind: "free_creations", value: 3 } }), { kind: "free_creations", value: 3 });
  assert.deepEqual(normalizeBenefit({ benefit_kind: "pro_days", benefit_value: 14 }), { kind: "pro_days", value: 14 });
  assert.deepEqual(normalizeBenefit({ benefit: { kind: "pro_lifetime", value: 1 } }), { kind: "pro_lifetime", value: null });
  assert.deepEqual(normalizeBenefit({ benefit: { kind: "discount", value: 20 } }), { kind: "unknown", value: 20 });
  assert.deepEqual(normalizeBenefit({}), { kind: "none", value: null });
  assert.deepEqual(normalizeBenefit(null), { kind: "none", value: null });
});

test("plan query values", () => {
  assert.equal(planFromParam("yearly"), "pro_yearly");
  assert.equal(planFromParam("pro_lifetime"), "pro_lifetime");
  for (const bad of ["", "Yearly", "pro_team", "constructor", "__proto__", null, 1]) assert.equal(planFromParam(bad), null);
  assert.equal(planParam("pro_monthly"), "monthly");
  assert.equal(planParam("pro_lifetime"), "lifetime");
});

test("email verification: send posts nothing; confirm posts the trimmed code and returns the entitlement", async () => {
  replies.push(reply(202, { data: { sent: true } }));
  await sendEmailVerification(TOKEN);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url, `${BASE}/me/email-verification`);
  assert.equal(calls[0].headers.get("Authorization"), `Bearer ${TOKEN}`);

  replies.push(data({ plan: "pro", status: "active", source: "grant", expires_at: "2026-12-11T00:00:00Z", email_verification_required: false }));
  const entitlement = await confirmEmailVerification(TOKEN, " 123456 ");
  assert.equal(calls[1].url, `${BASE}/me/email-verification/confirm`);
  assert.deepEqual(calls[1].body, { code: "123456" });
  assert.equal(entitlement.plan, "pro");
  assert.equal(entitlement.email_verification_required, false);

  replies.push(reply(400, { code: "invalid_code", message: "the code is wrong" }));
  await assert.rejects(confirmEmailVerification(TOKEN, "000000"), (error) => billingFailure(error).kind === "invalid_code");
  replies.push(reply(409, { code: "already_verified", message: "already verified" }));
  await assert.rejects(confirmEmailVerification(TOKEN, "000000"), (error) => {
    const failure = billingFailure(error);
    return failure.kind === "unknown" && failure.status === 409 && failure.code === "already_verified";
  });
});
