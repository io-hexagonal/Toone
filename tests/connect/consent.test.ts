import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiError } from "../../lib/api";
import {
  consentFailure,
  decide,
  expiryTimerMs,
  getConsentRequest,
  listAccountMacs,
  listConnectorMacs,
  recallAnswer,
  rememberAnswer,
  msUntilExpiry,
  normalizeConsentRequest,
  parseRequestId,
  postConsentDecision,
  safeRedirect,
  type ConsentRequest,
} from "../../lib/connect/consent";

/* /connect: the request id, the API calls, the decision and where the browser may go afterwards. */

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

type Call = { url: string; method: string; auth: string | null; body: string | null; cache: RequestCache | undefined; credentials: RequestCredentials | undefined };

function stubApi(status: number, body: unknown) {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ url: String(url), method: init?.method ?? "GET", auth: headers.get("Authorization"), body: (init?.body as string) ?? null, cache: init?.cache, credentials: init?.credentials });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

const claude: ConsentRequest = {
  id: "car_abc234", clientName: "Claude", redirectHost: "claude.ai", clientKind: "claude",
  scopes: ["read", "act"], expiresAt: "2026-11-24T18:40:00Z", eligible: true, ineligibleReason: null, macChoice: false,
};
const local: ConsentRequest = { ...claude, clientName: "Claude Code", redirectHost: "localhost", clientKind: "local" };
const CODE = "https://claude.ai/api/mcp/auth_callback?code=tc_ac_x&iss=https%3A%2F%2Fapi.trytoone.com&state=s1";
const DENIED = "https://claude.ai/api/mcp/auth_callback?error=access_denied&error_description=the+person+declined&iss=https%3A%2F%2Fapi.trytoone.com&state=s1";

test("only a well-formed request id is accepted; nothing else ever reaches the API", () => {
  assert.equal(parseRequestId("car_abc234xyz"), "car_abc234xyz");
  assert.equal(parseRequestId(["car_abc"]), "car_abc");
  for (const bad of [undefined, null, "", "car_", "CAR_abc", "car_ABC", "car_abc/../me", "car_abc?x=1", "car_a-b", "grant_abc",
    " car_abc", "car_" + "a".repeat(65), ["car_a", "car_b"]]) {
    assert.equal(parseRequestId(bad as never), null, String(bad));
  }
});

test("the request is read with the session bearer, uncached, and normalized", async () => {
  const calls = stubApi(200, { data: { id: "car_abc", client_name: " Claude ", redirect_host: "Claude.AI", client_kind: "claude",
    scopes: ["read", "act", "admin"], expires_at: "2026-11-24T18:40:00Z", eligible: true } });
  const request = await getConsentRequest("tok", "car_abc");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/connector/authorizations/car_abc");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].auth, "Bearer tok");
  assert.equal(calls[0].cache, "no-store");
  assert.equal(calls[0].credentials, "include", "the API's browser-binding cookie goes along (M1)");
  assert.deepEqual(request, { id: "car_abc", clientName: "Claude", redirectHost: "claude.ai", clientKind: "claude",
    scopes: ["read", "act"], expiresAt: "2026-11-24T18:40:00Z", eligible: true, ineligibleReason: null, macChoice: false });
});

test("unknown values fall to the cautious side", () => {
  const odd = normalizeConsentRequest({ client_kind: "gemini", scopes: ["act"], eligible: "yes", ineligible_reason: "weird" });
  assert.equal(odd.clientKind, "other", "an unknown kind is treated as not Claude");
  assert.deepEqual(odd.scopes, ["read", "act"], "read is always part of it");
  assert.equal(odd.eligible, false);
  assert.equal(odd.ineligibleReason, "not_allowed");
  assert.equal(normalizeConsentRequest({ eligible: false, ineligible_reason: "subscription_required" }).ineligibleReason, "subscription_required");
  assert.equal(normalizeConsentRequest({ client_kind: "chatgpt" }).clientKind, "chatgpt");
});

test("the Mac choice is offered only when the API says so", () => {
  assert.equal(normalizeConsentRequest({}).macChoice, false);
  assert.equal(normalizeConsentRequest({ mac_choice: true }).macChoice, true);
  assert.equal(normalizeConsentRequest({ macChoice: true }).macChoice, true);
  assert.equal(normalizeConsentRequest({ mac_choice: "yes" }).macChoice, false);
});

test("the decision posts approve, and narrows to read only when asked", async () => {
  let calls = stubApi(200, { data: { redirect_to: CODE } });
  assert.equal(await postConsentDecision("tok", "car_abc", true), CODE);
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/connector/authorizations/car_abc/decision");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].auth, "Bearer tok");
  assert.equal(calls[0].credentials, "include", "the decision carries the browser-binding cookie too (M1)");
  assert.deepEqual(JSON.parse(calls[0].body!), { approve: true });

  calls = stubApi(200, { data: { redirect_to: CODE } });
  await postConsentDecision("tok", "car_abc", true, true);
  assert.deepEqual(JSON.parse(calls[0].body!), { approve: true, scopes: ["read"] });

  calls = stubApi(200, { data: { redirect_to: DENIED } });
  await postConsentDecision("tok", "car_abc", false, true, "mac_2");
  assert.deepEqual(JSON.parse(calls[0].body!), { approve: false }, "a denial carries no scopes and no Mac");

  calls = stubApi(200, { data: { redirect_to: CODE } });
  await postConsentDecision("tok", "car_abc", true, false, "mac_2");
  assert.deepEqual(JSON.parse(calls[0].body!), { approve: true, mac_id: "mac_2" });
});

test("the Macs list is read and tolerates odd entries", async () => {
  const calls = stubApi(200, { data: [{ mac_id: "mac_1", name: "Studio" }, { name: "no id" }, { mac_id: "mac_2", name: " " }] });
  assert.deepEqual(await listConnectorMacs("tok"), [{ id: "mac_1", name: "Studio" }, { id: "mac_2", name: "Mac" }]);
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/me/connector/macs");
  assert.equal(calls[0].auth, "Bearer tok");
});

test("the account's Macs: only active ones, from the enveloped {macs} answer; the Mac list never sends cookies", async () => {
  const calls = stubApi(200, { data: { macs: [
    { id: "mac_1", name: "Studio", state: "active" }, { id: "mac_2", name: "Old", state: "removed" },
    { id: "mac_3", name: "Paused", state: "paused" }, { id: "mac_4", name: "", state: "active" }, { name: "no id", state: "active" },
  ] } });
  assert.deepEqual(await listAccountMacs("tok"), [{ id: "mac_1", name: "Studio" }, { id: "mac_4", name: "Mac" }]);
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/macs");
  assert.equal(calls[0].credentials, undefined);
});

test("this tab remembers an answered request (for Back), and nothing else", () => {
  const store = new Map<string, string>();
  const g = globalThis as unknown as { window?: unknown };
  const before = g.window;
  g.window = { sessionStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); } } };
  try {
    assert.equal(recallAnswer("car_a"), null);
    rememberAnswer("car_a", true);
    rememberAnswer("car_b", false);
    assert.equal(recallAnswer("car_a"), "allowed");
    assert.equal(recallAnswer("car_b"), "denied");
    assert.deepEqual([...store.values()].sort(), ["allowed", "denied"], "only the answer, never an address or code");
  } finally {
    g.window = before;
  }
});

test("redirect safety: only the announced host, https (http only to loopback), carrying the expected answer", () => {
  assert.equal(safeRedirect(CODE, claude, true), CODE);
  assert.equal(safeRedirect(DENIED, claude, false), DENIED);
  assert.equal(safeRedirect("http://localhost:53124/callback?code=tc_ac_x&state=s", local, true), "http://localhost:53124/callback?code=tc_ac_x&state=s");
  assert.equal(safeRedirect("http://127.0.0.1:9/cb?error=access_denied", { redirectHost: "127.0.0.1" }, false), "http://127.0.0.1:9/cb?error=access_denied");

  const refused: [string, Pick<ConsentRequest, "redirectHost">, boolean, string][] = [
    ["https://evil.example/cb?code=x", claude, true, "another host"],
    ["https://claude.ai.evil.example/cb?code=x", claude, true, "a host that only starts the same"],
    ["https://evil.example/?u=https://claude.ai/cb&code=x", claude, true, "the right host only in the query"],
    ["https://claude.ai@evil.example/cb?code=x", claude, true, "userinfo trick"],
    ["https://user:pw@claude.ai/cb?code=x", claude, true, "credentials"],
    ["http://claude.ai/cb?code=x", claude, true, "plain http off loopback"],
    ["javascript:alert(1)//claude.ai?code=x", claude, true, "javascript:"],
    ["data:text/html,claude.ai?code=x", claude, true, "data:"],
    ["//claude.ai/cb?code=x", claude, true, "relative"],
    ["/en/account?code=x", claude, true, "a same-site path"],
    ["https://claude.ai/cb?state=s", claude, true, "Allow without a code"],
    ["https://claude.ai/cb?code=x", claude, false, "a denial that carries a code"],
    ["ftp://localhost/cb?code=x", local, true, "another scheme to loopback"],
    ["", claude, true, "empty"],
    [CODE, { redirectHost: "" }, true, "no announced host"],
  ];
  for (const [url, request, approve, label] of refused) assert.equal(safeRedirect(url, request, approve), null, label);
});

test("decide navigates only to a checked address and never throws", async () => {
  const seen: unknown[][] = [];
  const post = (async (...args: unknown[]) => { seen.push(args); return CODE; }) as typeof postConsentDecision;
  assert.deepEqual(await decide("tok", claude, true, true, post), { kind: "navigate", url: CODE });
  assert.deepEqual(seen[0], ["tok", "car_abc234", true, false, null], "act kept: no narrowing");
  await decide("tok", claude, true, false, post);
  assert.deepEqual(seen[1], ["tok", "car_abc234", true, true, null], "act unticked: read only");
  await decide("tok", { ...claude, scopes: ["read"] }, true, false, post);
  assert.deepEqual(seen[2], ["tok", "car_abc234", true, false, null], "nothing to narrow when only read was asked");
  await decide("tok", claude, true, true, post, "mac_2");
  assert.deepEqual(seen[3], ["tok", "car_abc234", true, false, null], "a picked Mac is not sent when the API does not offer the choice");
  await decide("tok", { ...claude, macChoice: true }, true, true, post, "mac_2");
  assert.deepEqual(seen[4], ["tok", "car_abc234", true, false, "mac_2"], "the picked Mac goes with Allow");
  const denied = (async (...args: unknown[]) => { seen.push(args); return DENIED; }) as typeof postConsentDecision;
  await decide("tok", { ...claude, macChoice: true }, false, true, denied, "mac_2");
  assert.deepEqual(seen[5], ["tok", "car_abc234", false, false, null], "never with Don't allow");

  const tampered = (async () => "https://evil.example/cb?code=tc_ac_x") as typeof postConsentDecision;
  assert.deepEqual(await decide("tok", claude, true, true, tampered), { kind: "bad-redirect" });

  const failing = (status: number, code: string) =>
    (async () => { throw new ApiError(code, "x", status); }) as typeof postConsentDecision;
  assert.deepEqual(await decide("tok", claude, true, true, failing(403, "subscription_required")), { kind: "failure", failure: "needs-pro" });
  assert.deepEqual(await decide("tok", claude, true, true, failing(403, "forbidden")), { kind: "failure", failure: "not-allowed" });
  assert.deepEqual(await decide("tok", claude, false, true, failing(404, "not_found")), { kind: "failure", failure: "expired" });
  const offline = (async () => { throw new TypeError("Failed to fetch"); }) as typeof postConsentDecision;
  assert.deepEqual(await decide("tok", claude, true, true, offline), { kind: "failure", failure: "unreachable" });
});

test("every server answer maps to one plain outcome (contract §3.1, §3.2)", () => {
  const cases: [number, string, string][] = [
    [401, "unauthorized", "signed-out"],
    [404, "not_found", "expired"],
    [503, "service_unavailable", "unavailable"],
    [403, "subscription_required", "needs-pro"],
    [403, "forbidden", "not-allowed"],
    [403, "consent_browser_mismatch", "other-browser"],
    [403, "something_new", "other-browser"],
    [400, "nonce_mismatch", "other-browser"],
    [429, "rate_limit_exceeded", "rate-limited"],
    [400, "invalid_input", "page-error"],
    [500, "internal_error", "unreachable"],
    [502, "unknown", "unreachable"],
  ];
  for (const [status, code, expected] of cases) assert.equal(consentFailure(new ApiError(code, "m", status)), expected, `${status} ${code}`);
  assert.equal(consentFailure(new Error("boom")), "unreachable");
});

test("expiry: time left, zero once past, null when unreadable", () => {
  const now = Date.parse("2026-11-24T18:30:00Z");
  assert.equal(msUntilExpiry({ expiresAt: "2026-11-24T18:40:00Z" }, now), 600_000);
  assert.equal(msUntilExpiry({ expiresAt: "2026-11-24T18:00:00Z" }, now), 0);
  assert.equal(msUntilExpiry({ expiresAt: "" }, now), null);
});

test("the expiry timer trusts the API over a wrong device clock", () => {
  const now = Date.parse("2026-11-24T18:30:00Z");
  assert.equal(expiryTimerMs({ expiresAt: "2026-11-24T18:36:00Z" }, now), 360_000);
  assert.equal(expiryTimerMs({ expiresAt: "2026-11-24T18:00:00Z" }, now), null, "device clock ahead: no timer, the API answers a late decision");
  assert.equal(expiryTimerMs({ expiresAt: "2026-11-24T19:30:00Z" }, now), 600_000, "device clock behind: at most the request's ten minutes");
  assert.equal(expiryTimerMs({ expiresAt: "soon" }, now), null);
});
