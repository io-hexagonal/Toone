import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "../../lib/api";
import { BillingError, normalizeEntitlement, type CheckoutStatus, type Entitlement } from "../../lib/billing/api";
import {
  CHECKOUT_RETURN_DEFAULTS,
  initialCheckoutReturn,
  isFinalCheckoutReturn,
  pollCheckoutReturn,
  splitSessionId,
  stepCheckoutReturn,
  stripSessionId,
  type CheckoutReturnConfig,
  type CheckoutReturnState,
} from "../../lib/billing/checkout-return";

const FREE = normalizeEntitlement({ plan: "free", free_routine_creations: { used: 2, limit: 2 } });
const PRO = normalizeEntitlement({ plan: "pro", source: "subscription", status: "active", billing_provider: "stripe" });
const CONFIG: CheckoutReturnConfig = { timeoutMs: 10_000, delaysMs: [1_000, 2_000, 4_000], processingAfterMs: 60_000 };
const NO_RECEIPT = { orderRef: null, legalInvoice: null } as const;

/** A checkout status as the server sends it (no order reference or invoice unless given). */
function status(value: Partial<CheckoutStatus> & Pick<CheckoutStatus, "status" | "entitled">): CheckoutStatus {
  return { order_ref: null, legal_invoice: null, ...value };
}

/* ---- pure transitions */

test("no session: pending → active as soon as the entitlement says Pro", () => {
  const { state, delayMs } = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: PRO, hasSession: false }, 0, CONFIG);
  assert.deepEqual(state, { kind: "active", entitlement: PRO, ...NO_RECEIPT });
  assert.equal(delayMs, null);
  assert.equal(isFinalCheckoutReturn(state), true);
});

test("with a session: active only once the checkout is complete and the entitlement says Pro", () => {
  const complete = status({ status: "complete", entitled: true });
  const { state, delayMs } = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: PRO, hasSession: true, checkout: complete }, 0, CONFIG);
  assert.deepEqual(state, { kind: "active", entitlement: PRO, ...NO_RECEIPT });
  assert.equal(delayMs, null);
});

test("a complete, entitled checkout alone never turns Pro on", () => {
  const { state } = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: true, checkout: status({ status: "complete", entitled: true }) }, 0, CONFIG);
  assert.equal(state.kind, "pending");
});

test("already Pro (a code, a guest month): an open checkout is not active", () => {
  const open = status({ status: "open", entitled: true, order_ref: "TOONE-SLOWPAY0001" });
  const config = { ...CONFIG, timeoutMs: 60_000, processingAfterMs: 20_000 };
  let step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: PRO, hasSession: true, checkout: open }, 0, config);
  assert.equal(step.state.kind, "pending");
  step = stepCheckoutReturn(step.state, { entitlement: PRO, hasSession: true, checkout: open }, 20_000, config);
  assert.deepEqual(step.state, { kind: "processing", orderRef: "TOONE-SLOWPAY0001", legalInvoice: null });
});

test("already Pro: an expired (refused or refunded) checkout is an error, not active", () => {
  const expired = status({ status: "expired", entitled: true });
  const { state } = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: PRO, hasSession: true, checkout: expired }, 0, CONFIG);
  assert.deepEqual(state, { kind: "error", reason: "expired", failure: null });
});

test("already Pro: without any checkout status the session is not confirmed", () => {
  let step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: PRO, hasSession: true, checkout: null }, 0, CONFIG);
  assert.equal(step.state.kind, "pending");
  step = stepCheckoutReturn(step.state, { entitlement: PRO, hasSession: true, checkout: null }, 10_000, CONFIG);
  assert.deepEqual(step.state, { kind: "timeout" });
});

test("pending keeps polling with the backoff, the last delay repeating", () => {
  let state = initialCheckoutReturn();
  const delays: (number | null)[] = [];
  for (const elapsed of [0, 1_000, 3_000]) {
    const step = stepCheckoutReturn(state, { entitlement: FREE, hasSession: false }, elapsed, { ...CONFIG, timeoutMs: 60_000 });
    state = step.state;
    delays.push(step.delayMs);
  }
  const step = stepCheckoutReturn(state, { entitlement: FREE, hasSession: false }, 7_000, { ...CONFIG, timeoutMs: 60_000 });
  delays.push(step.delayMs);
  assert.deepEqual(delays, [1_000, 2_000, 4_000, 4_000]);
  assert.deepEqual(step.state, { kind: "pending", attempts: 4, reached: true, lastFailure: null, checkout: null });
});

test("the last wait is shortened so a final poll lands on the deadline", () => {
  const step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: false }, 9_500, CONFIG);
  assert.equal(step.delayMs, 500);
});

test("pending → timeout at the deadline once the API has answered", () => {
  const step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: false }, 10_000, CONFIG);
  assert.deepEqual(step.state, { kind: "timeout" });
  assert.equal(step.delayMs, null);
});

test("pending → signed_out on a 401, immediately", () => {
  const { state, delayMs } = stepCheckoutReturn(initialCheckoutReturn(), { failure: { kind: "unauthenticated" } }, 0, CONFIG);
  assert.deepEqual(state, { kind: "signed_out" });
  assert.equal(delayMs, null);
});

test("pending → error(expired) when the checkout session expired unpaid", () => {
  const { state } = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: true, checkout: status({ status: "expired", entitled: false }) }, 0, CONFIG);
  assert.deepEqual(state, { kind: "error", reason: "expired", failure: null });
});

test("transient failures keep polling; never reaching the API ends in error(unreachable)", () => {
  const unavailable = { kind: "payments_unavailable" } as const;
  let step = stepCheckoutReturn(initialCheckoutReturn(), { failure: { kind: "rate_limited" } }, 0, CONFIG);
  assert.equal(step.state.kind, "pending");
  step = stepCheckoutReturn(step.state, { failure: unavailable }, 5_000, CONFIG);
  assert.equal(step.state.kind, "pending");
  step = stepCheckoutReturn(step.state, { failure: unavailable }, 10_000, CONFIG);
  assert.deepEqual(step.state, { kind: "error", reason: "unreachable", failure: unavailable });
});

test("a failure at the deadline after an earlier answer is a timeout, not an error", () => {
  let step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: false }, 0, CONFIG);
  step = stepCheckoutReturn(step.state, { failure: { kind: "rate_limited" } }, 10_000, CONFIG);
  assert.deepEqual(step.state, { kind: "timeout" });
});

test("active carries the order reference and legal invoice of the last checkout status", () => {
  const invoice = { status: "issued", number: "FR 2026/7", atcud: "JJ7K-7" } as const;
  let step = stepCheckoutReturn(initialCheckoutReturn(), {
    entitlement: FREE, hasSession: true, checkout: status({ status: "complete", entitled: false, order_ref: "TOONE-ABCDEFGH12", legal_invoice: invoice }),
  }, 0, CONFIG);
  // A failed status request (null) keeps the last answer.
  step = stepCheckoutReturn(step.state, { entitlement: PRO, hasSession: true, checkout: null }, 1_000, CONFIG);
  assert.deepEqual(step.state, { kind: "active", entitlement: PRO, orderRef: "TOONE-ABCDEFGH12", legalInvoice: invoice });
});

test("a session still open after processingAfterMs is a delayed payment: processing", () => {
  const config = { ...CONFIG, timeoutMs: 60_000, processingAfterMs: 20_000 };
  const open = status({ status: "open", entitled: false, order_ref: "TOONE-SLOWPAY0001" });
  let step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: true, checkout: open }, 19_999, config);
  assert.equal(step.state.kind, "pending");
  step = stepCheckoutReturn(step.state, { entitlement: FREE, hasSession: true, checkout: open }, 20_000, config);
  assert.deepEqual(step.state, { kind: "processing", orderRef: "TOONE-SLOWPAY0001", legalInvoice: null });
  assert.equal(step.delayMs, null);
  assert.equal(isFinalCheckoutReturn(step.state), true);
});

test("at the deadline, an open session reads as processing, anything else as timeout", () => {
  const open = status({ status: "open", entitled: false, order_ref: "TOONE-SLOWPAY0001" });
  let step = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: true, checkout: open }, 0, CONFIG);
  step = stepCheckoutReturn(step.state, { failure: { kind: "rate_limited" } }, 10_000, CONFIG);
  assert.deepEqual(step.state, { kind: "processing", orderRef: "TOONE-SLOWPAY0001", legalInvoice: null });
  const complete = stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: true, checkout: status({ status: "complete", entitled: false }) }, 10_000, CONFIG);
  assert.deepEqual(complete.state, { kind: "timeout" });
});

test("final states do not move", () => {
  for (const state of [{ kind: "timeout" }, { kind: "signed_out" }, { kind: "active", entitlement: PRO, ...NO_RECEIPT }] as CheckoutReturnState[]) {
    assert.deepEqual(stepCheckoutReturn(state, { entitlement: PRO, hasSession: false }, 0, CONFIG), { state, delayMs: null });
  }
});

test("defaults: about a minute, starting at one second; processing after 20 s", () => {
  assert.equal(CHECKOUT_RETURN_DEFAULTS.timeoutMs, 60_000);
  assert.equal(CHECKOUT_RETURN_DEFAULTS.processingAfterMs, 20_000);
  assert.equal(CHECKOUT_RETURN_DEFAULTS.delaysMs[0], 1_000);
  assert.equal(stepCheckoutReturn(initialCheckoutReturn(), { entitlement: FREE, hasSession: false }, 0).delayMs, 1_000);
});

/* ---- driver with a fake clock */

function fakeClock() {
  let now = 1_000_000;
  const sleeps: number[] = [];
  return {
    now: () => now,
    sleep: async (ms: number) => { sleeps.push(ms); now += ms; },
    sleeps,
  };
}

test("driver: polls entitlement and checkout status until Pro, reporting every state", async () => {
  const clock = fakeClock();
  const answers: Entitlement[] = [FREE, FREE, PRO];
  const statuses: CheckoutStatus["status"][] = ["open", "complete", "complete"];
  const statusCalls: string[] = [];
  const states: string[] = [];
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: "cs_test_1", config: CONFIG, now: clock.now, sleep: clock.sleep,
    fetchEntitlement: async token => { assert.equal(token, "tok"); return answers.shift()!; },
    fetchCheckoutStatus: async (_token, id): Promise<CheckoutStatus> => {
      statusCalls.push(id);
      return status({ status: statuses.shift()!, entitled: false });
    },
    onState: state => states.push(state.kind),
  });
  assert.deepEqual(final, { kind: "active", entitlement: PRO, ...NO_RECEIPT });
  assert.deepEqual(states, ["pending", "pending", "pending", "active"]);
  assert.deepEqual(clock.sleeps, [1_000, 2_000]);
  assert.deepEqual(statusCalls, ["cs_test_1", "cs_test_1", "cs_test_1"]);
});

test("driver: no token means signed_out without any request", async () => {
  let requests = 0;
  const final = await pollCheckoutReturn({
    token: null, sessionId: "cs_test_1",
    fetchEntitlement: async () => { requests++; return PRO; },
  });
  assert.deepEqual(final, { kind: "signed_out" });
  assert.equal(requests, 0);
});

test("driver: times out after the configured time when Pro never arrives", async () => {
  const clock = fakeClock();
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: null, config: CONFIG, now: clock.now, sleep: clock.sleep,
    fetchEntitlement: async () => FREE,
  });
  assert.deepEqual(final, { kind: "timeout" });
  assert.deepEqual(clock.sleeps, [1_000, 2_000, 4_000, 3_000]);
});

test("driver: a 401 from the API ends the session state", async () => {
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: null,
    fetchEntitlement: async () => { throw new BillingError({ kind: "unauthenticated" }); },
  });
  assert.deepEqual(final, { kind: "signed_out" });

  const raw = await pollCheckoutReturn({
    token: "tok", sessionId: null,
    fetchEntitlement: async () => { throw new ApiError("token_expired", "token expired", 401); },
  });
  assert.deepEqual(raw, { kind: "signed_out" });
});

test("driver: a failing checkout status request keeps the last answer and polling goes on", async () => {
  const clock = fakeClock();
  const answers = [FREE, PRO, PRO];
  const results: (CheckoutStatus | Error)[] = [
    status({ status: "complete", entitled: false }),
    new BillingError({ kind: "rate_limited" }),
    new BillingError({ kind: "rate_limited" }),
  ];
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: "cs_test_1", config: CONFIG, now: clock.now, sleep: clock.sleep,
    fetchEntitlement: async () => answers.shift()!,
    fetchCheckoutStatus: async () => {
      const next = results.shift()!;
      if (next instanceof Error) throw next;
      return next;
    },
  });
  assert.equal(final.kind, "active");
  assert.deepEqual(clock.sleeps, [1_000]);
});

test("driver: an account already Pro sees its open purchase as not confirmed, never as active", async () => {
  const clock = fakeClock();
  const states: string[] = [];
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: "cs_test_1", config: CONFIG, now: clock.now, sleep: clock.sleep,
    fetchEntitlement: async () => PRO,
    fetchCheckoutStatus: async () => status({ status: "open", entitled: true }),
    onState: state => states.push(state.kind),
  });
  assert.equal(final.kind, "processing");
  assert.ok(!states.includes("active"));
});

test("pending → wrong_account when the checkout status says 404, whatever the entitlement", () => {
  const { state, delayMs } = stepCheckoutReturn(initialCheckoutReturn(), { checkoutNotFound: true }, 0, CONFIG);
  assert.deepEqual(state, { kind: "wrong_account" });
  assert.equal(delayMs, null);
  assert.ok(isFinalCheckoutReturn(state));
});

test("driver: another account's checkout (404 not_found) is wrong_account at once, even when this account is Pro", async () => {
  const clock = fakeClock();
  for (const entitlement of [FREE, PRO]) {
    let polls = 0;
    const final = await pollCheckoutReturn({
      token: "tok", sessionId: "cs_test_1", config: CONFIG, now: clock.now, sleep: clock.sleep,
      fetchEntitlement: async () => { polls++; return entitlement; },
      fetchCheckoutStatus: async () => { throw new ApiError("not_found", "resource not found", 404); },
    });
    assert.deepEqual(final, { kind: "wrong_account" }, "never active, and nothing about the other account");
    assert.equal(polls, 1);
  }
  assert.deepEqual(clock.sleeps, []);
});

test("driver: a 404 status with a failing entitlement is still wrong_account; a 401 is still signed_out", async () => {
  const notFound = async (): Promise<CheckoutStatus> => { throw new ApiError("not_found", "resource not found", 404); };
  const flaky = await pollCheckoutReturn({
    token: "tok", sessionId: "cs_test_1", config: CONFIG,
    fetchEntitlement: async () => { throw new BillingError({ kind: "rate_limited" }); },
    fetchCheckoutStatus: notFound,
  });
  assert.deepEqual(flaky, { kind: "wrong_account" });
  const expired = await pollCheckoutReturn({
    token: "tok", sessionId: "cs_test_1", config: CONFIG,
    fetchEntitlement: async () => { throw new ApiError("token_expired", "token expired", 401); },
    fetchCheckoutStatus: notFound,
  });
  assert.deepEqual(expired, { kind: "signed_out" });
});

test("driver: other status failures (403, 404 without not_found, 5xx) are transient, not wrong_account", async () => {
  for (const error of [
    new ApiError("forbidden", "forbidden", 403),
    new ApiError("http_404", "Not Found", 404),
    new ApiError("internal", "boom", 500),
  ]) {
    const clock = fakeClock();
    const final = await pollCheckoutReturn({
      token: "tok", sessionId: "cs_test_1", config: CONFIG, now: clock.now, sleep: clock.sleep,
      fetchEntitlement: async () => FREE,
      fetchCheckoutStatus: async () => { throw error; },
    });
    assert.deepEqual(final, { kind: "timeout" }, `${error.status} ${error.code}`);
  }
});

test("driver: an expired session stops polling", async () => {
  const clock = fakeClock();
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: "cs_test_1", config: CONFIG, now: clock.now, sleep: clock.sleep,
    fetchEntitlement: async () => FREE,
    fetchCheckoutStatus: async () => status({ status: "expired", entitled: false }),
  });
  assert.deepEqual(final, { kind: "error", reason: "expired", failure: null });
  assert.deepEqual(clock.sleeps, []);
});

test("driver: network errors all the way are an unreachable error", async () => {
  const clock = fakeClock();
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: null, config: CONFIG, now: clock.now, sleep: clock.sleep, fetchCheckoutStatus: null,
    fetchEntitlement: async () => { throw new TypeError("fetch failed"); },
  });
  assert.equal(final.kind, "error");
  assert.equal(final.kind === "error" && final.reason, "unreachable");
  assert.equal(final.kind === "error" && final.failure?.kind, "unknown");
});

test("driver: abort stops polling and silences further states", async () => {
  const controller = new AbortController();
  const clock = fakeClock();
  const states: string[] = [];
  let polls = 0;
  const final = await pollCheckoutReturn({
    token: "tok", sessionId: null, config: CONFIG, now: clock.now, signal: controller.signal,
    sleep: async ms => { await clock.sleep(ms); controller.abort(); },
    fetchEntitlement: async () => { polls++; return FREE; },
    onState: state => states.push(state.kind),
  });
  assert.equal(final.kind, "pending");
  assert.equal(polls, 1);
  assert.deepEqual(states, ["pending", "pending"]);
});

/* ---- session_id stripping */

test("splitSessionId removes only session_id and keeps the rest of the URL", () => {
  assert.deepEqual(splitSessionId("https://trytoone.com/en/success?session_id=cs_test_a1B2c3&from=app#done"), {
    sessionId: "cs_test_a1B2c3",
    cleaned: "/en/success?from=app#done",
  });
  assert.deepEqual(splitSessionId("/pt/success?session_id=cs_live_X9"), { sessionId: "cs_live_X9", cleaned: "/pt/success" });
  assert.deepEqual(splitSessionId("/en/success?from=app"), { sessionId: null, cleaned: null });
});

test("a malformed session_id is still stripped but not returned", () => {
  for (const bad of ["", "abc", "cs_", "cs_test_1/../../me", "cs_test_<script>", `cs_${"a".repeat(300)}`]) {
    const { sessionId, cleaned } = splitSessionId(`/en/success?session_id=${encodeURIComponent(bad)}`);
    assert.equal(sessionId, null, bad);
    assert.equal(cleaned, "/en/success");
  }
});

test("stripSessionId rewrites the address bar before anything else reads it", () => {
  const replaced: [unknown, string, string | URL | null | undefined][] = [];
  const win = {
    location: { href: "https://trytoone.com/en/success?session_id=cs_test_1&x=1" },
    history: { state: { keep: true }, replaceState: (data: unknown, unused: string, url?: string | URL | null) => { replaced.push([data, unused, url]); } },
  };
  assert.equal(stripSessionId(win), "cs_test_1");
  assert.deepEqual(replaced, [[{ keep: true }, "", "/en/success?x=1"]]);

  replaced.length = 0;
  win.location.href = "https://trytoone.com/en/success";
  assert.equal(stripSessionId(win), null);
  assert.deepEqual(replaced, []);
});

test("stripSessionId outside a browser is a no-op", () => {
  assert.equal(stripSessionId(undefined), null);
  assert.equal(stripSessionId(), null);
});
