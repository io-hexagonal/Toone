import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiError } from "../../lib/api";
import {
  cleanCode,
  confirmWithCode,
  decide,
  normalizeCodePending,
  normalizeConsentRequest,
  postConsentDecision,
  resendConsentCode,
  verifyConsentCode,
  type ConsentRequest,
} from "../../lib/connect/consent";

/* /connect: Allow on a new connection is confirmed with a code emailed to the account. */

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

type Call = { url: string; method: string; body: string | null; credentials: RequestCredentials | undefined };
function stubApi(status: number, body: unknown) {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? "GET", body: (init?.body as string) ?? null, credentials: init?.credentials });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

const claude: ConsentRequest = {
  id: "car_abc234", clientName: "Claude", redirectHost: "claude.ai", clientKind: "claude",
  scopes: ["read", "act"], expiresAt: "2026-11-24T18:40:00Z", eligible: true, ineligibleReason: null, macChoice: false, accessModes: [], codePending: null,
};
const CODE = "https://claude.ai/api/mcp/auth_callback?code=tc_ac_x&iss=https%3A%2F%2Fapi.trytoone.com&state=s1";
const DENIED = "https://claude.ai/api/mcp/auth_callback?error=access_denied&iss=https%3A%2F%2Fapi.trytoone.com&state=s1";
const REQUIRED = { status: "code_required", email_hint: "a•••@example.com", code_expires_at: "2026-11-24T18:50:00Z", resends_left: 3, attempts_left: 5 };
const PENDING = { emailHint: "a•••@example.com", codeExpiresAt: "2026-11-24T18:50:00Z", resendsLeft: 3, attemptsLeft: 5 };

test("Allow answered with 202 code_required gives the code step, never a redirect", async () => {
  const calls = stubApi(202, { data: REQUIRED });
  assert.deepEqual(await postConsentDecision("tok", claude.id, true), PENDING);
  assert.equal(calls[0].credentials, "include");
  assert.deepEqual(await decide("tok", claude, true, { allowAct: true }), { kind: "code", pending: PENDING });
});

test("a review account's Allow (200 redirect_to) and Don't allow still go straight back", async () => {
  stubApi(200, { data: { redirect_to: CODE } });
  assert.deepEqual(await decide("tok", claude, true, { allowAct: true }), { kind: "navigate", url: CODE });
  stubApi(200, { data: { redirect_to: DENIED } });
  assert.deepEqual(await decide("tok", claude, false, { allowAct: true }), { kind: "navigate", url: DENIED });
  // A deny never turns into a code step, whatever the answer says.
  assert.deepEqual(await decide("tok", claude, false, { allowAct: true }, async () => PENDING), { kind: "bad-redirect" });
});

test("the request view carries a pending code, so a reloaded page shows the code entry", () => {
  assert.deepEqual(normalizeConsentRequest({ id: "car_abc", client_kind: "claude", code_pending: REQUIRED }).codePending, PENDING);
  assert.equal(normalizeConsentRequest({ id: "car_abc", code_pending: null }).codePending, null);
  assert.equal(normalizeCodePending({ resends_left: -1 }), null);
  assert.deepEqual(normalizeCodePending({ email_hint: "x", resends_left: "3", attempts_left: 1.5 }), { emailHint: "x", codeExpiresAt: "", resendsLeft: 0, attemptsLeft: 0 });
});

test("the code is typed as 6 digits; anything shorter is never sent", async () => {
  assert.equal(cleanCode(" 12-34 56 7"), "123456");
  let sent = 0;
  const verify = async () => { sent++; return { status: "approved" as const, redirectTo: CODE }; };
  assert.deepEqual(await confirmWithCode("tok", claude, "12345", verify), { kind: "incomplete" });
  assert.equal(sent, 0);
});

test("no code, no redirect: only a correct code returns the address with the authorization code", async () => {
  const calls = stubApi(200, { data: { status: "approved", redirect_to: CODE } });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456"), { kind: "navigate", url: CODE, approve: true });
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/connector/authorizations/car_abc234/verify");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].body, JSON.stringify({ code: "123456" }));
  assert.equal(calls[0].credentials, "include", "the code is bound to this browser's consent cookie");
  // An "approved" answer without a code in the address is refused.
  stubApi(200, { data: { status: "approved", redirect_to: DENIED } });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456"), { kind: "bad-redirect" });
});

test("a wrong code says how many tries are left; the fifth cancels and goes back with access_denied", async () => {
  stubApi(400, { code: "invalid_code", message: "That code is not right.", attempts_left: 3 });
  assert.deepEqual(await confirmWithCode("tok", claude, "000000"), { kind: "wrong", attemptsLeft: 3 });
  stubApi(200, { data: { status: "cancelled", redirect_to: DENIED } });
  assert.deepEqual(await confirmWithCode("tok", claude, "000000"), { kind: "navigate", url: DENIED, approve: false });
  // A "cancelled" answer carrying a code is refused.
  stubApi(200, { data: { status: "cancelled", redirect_to: CODE } });
  assert.deepEqual(await confirmWithCode("tok", claude, "000000"), { kind: "bad-redirect" });
});

test("an expired code, another browser's or another request's code end the page; nothing pending reloads it", async () => {
  stubApi(404, { code: "not_found", message: "gone" });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456"), { kind: "failure", failure: "expired" });
  stubApi(403, { code: "consent_other_browser", message: "x" });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456"), { kind: "failure", failure: "other-browser" });
  stubApi(409, { code: "conflict", message: "no code" });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456"), { kind: "failure", failure: "no-code" });
  stubApi(429, { code: "rate_limit_exceeded", message: "slow down" });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456"), { kind: "failure", failure: "rate-limited" });
  assert.deepEqual(await confirmWithCode("tok", claude, "123456", async () => { throw new TypeError("offline"); }), { kind: "failure", failure: "unreachable" });
});

test("resend: a new code with the same shape; no more resends is a 429", async () => {
  const calls = stubApi(202, { data: { ...REQUIRED, resends_left: 2 } });
  assert.deepEqual(await resendConsentCode("tok", claude.id), { ...PENDING, resendsLeft: 2 });
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/connector/authorizations/car_abc234/resend");
  assert.equal(calls[0].credentials, "include");
  stubApi(429, { code: "rate_limit_exceeded", message: "no more codes for this request" });
  await assert.rejects(resendConsentCode("tok", claude.id), (error: unknown) => error instanceof ApiError && error.status === 429);
  stubApi(200, { data: { status: "approved", redirect_to: CODE } });
  assert.deepEqual(await verifyConsentCode("tok", claude.id, "123456"), { status: "approved", redirectTo: CODE });
});
