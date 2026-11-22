import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { ApiError } from "../../lib/api";
import {
  ADMIN_TOKEN_NAME_MAX,
  adminTokenNameProblem,
  adminTokenState,
  createAdminToken,
  listAdminTokens,
  revokeAdminToken,
  type AdminApiToken,
} from "../../lib/affiliates";

const BASE = "https://api.test/v1";
const SESSION = "session_jwt";
const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;

type Call = { url: string; method: string; headers: Headers; body: unknown; cache?: RequestCache };
let calls: Call[] = [];
let replies: Array<() => Response> = [];

const reply = (status: number, body: unknown) => () =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const stored: AdminApiToken = {
  id: "adt_one",
  name: "creator scripts",
  scopes: ["affiliates"],
  token_hint: "ab12",
  created_by: "usr_admin",
  created_at: "2026-11-22T10:00:00Z",
  last_used_at: null,
  expires_at: null,
  revoked_at: null,
};

beforeEach(() => {
  env.NEXT_PUBLIC_API_BASE_URL = BASE;
  calls = [];
  replies = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push({
      url: String(input),
      method: init.method ?? "GET",
      headers: new Headers(init.headers),
      body: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
      cache: init.cache,
    });
    const next = replies.shift();
    if (!next) throw new Error("unexpected request");
    return next();
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete env.NEXT_PUBLIC_API_BASE_URL;
});

test("tokens are listed with the signed-in session, uncached", async () => {
  replies.push(reply(200, { data: [stored] }));
  const tokens = await listAdminTokens(SESSION);
  assert.deepEqual(tokens, [stored]);
  assert.equal(calls[0].url, `${BASE}/admin/api-tokens`);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.get("Authorization"), `Bearer ${SESSION}`);
  assert.equal(calls[0].cache, "no-store");
});

test("a non-array list reads as empty", async () => {
  replies.push(reply(200, { data: null }));
  assert.deepEqual(await listAdminTokens(SESSION), []);
});

test("create sends a trimmed name with the affiliates scope and returns the token once", async () => {
  replies.push(reply(201, { data: { ...stored, token: "toone_adm_secret" } }));
  const created = await createAdminToken(SESSION, { name: "  creator scripts  " });
  assert.equal(created.token, "toone_adm_secret");
  assert.equal(calls[0].url, `${BASE}/admin/api-tokens`);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(calls[0].body, { scopes: ["affiliates"], name: "creator scripts" });
  assert.equal(calls[0].headers.get("Content-Type"), "application/json");
});

test("revoke posts to the token's revoke route", async () => {
  replies.push(reply(200, { data: { ...stored, revoked_at: "2026-11-22T11:00:00Z" } }));
  const revoked = await revokeAdminToken(SESSION, "adt_one/../x");
  assert.equal(revoked.revoked_at, "2026-11-22T11:00:00Z");
  assert.equal(calls[0].url, `${BASE}/admin/api-tokens/adt_one%2F..%2Fx/revoke`);
  assert.equal(calls[0].method, "POST");
});

test("server refusals surface as ApiError with the status", async () => {
  replies.push(reply(403, { code: "forbidden", message: "forbidden" }));
  await assert.rejects(createAdminToken(SESSION, { name: "x" }), (error: unknown) => error instanceof ApiError && error.status === 403);
});

test("token names follow the server's rules", () => {
  assert.equal(adminTokenNameProblem("creator scripts"), null);
  assert.notEqual(adminTokenNameProblem("   "), null);
  assert.notEqual(adminTokenNameProblem("a\nb"), null);
  assert.notEqual(adminTokenNameProblem("n".repeat(ADMIN_TOKEN_NAME_MAX + 1)), null);
  assert.equal(adminTokenNameProblem("n".repeat(ADMIN_TOKEN_NAME_MAX)), null);
});

test("token state: active, expired, revoked", () => {
  const now = new Date("2026-11-22T12:00:00Z");
  assert.equal(adminTokenState(stored, now), "active");
  assert.equal(adminTokenState({ ...stored, expires_at: "2026-11-23T00:00:00Z" }, now), "active");
  assert.equal(adminTokenState({ ...stored, expires_at: "2026-11-22T11:59:59Z" }, now), "expired");
  assert.equal(adminTokenState({ ...stored, revoked_at: "2026-11-22T11:00:00Z" }, now), "revoked");
});
