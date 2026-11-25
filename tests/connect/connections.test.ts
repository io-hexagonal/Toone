import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { connectionLabel, disconnect, formatConnectionDate, listConnections, normalizeConnections } from "../../lib/connect/connections";
import { ENGLISH_ONLY_PATHS } from "../../i18n/routing";

/* /en/connections: the account's connected apps, each with a Disconnect button (linked from the new-connection email). */

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function stubApi(status: number, body: unknown) {
  const calls: { url: string; method: string; auth: string | null; credentials: RequestCredentials | undefined }[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? "GET", auth: new Headers(init?.headers).get("Authorization"), credentials: init?.credentials });
    return status === 204 ? new Response(null, { status }) : new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

test("the list is read with the bearer only and normalized; odd entries are dropped", async () => {
  const calls = stubApi(200, { data: [
    { id: "cgr_1", client_name: "Claude", redirect_host: "claude.ai", scopes: ["read", "act", "x"], created_at: "2026-11-25T10:00:00Z", last_used_at: "2026-11-25T11:00:00Z", expires_at: "2027-11-25T10:00:00Z", access_mode: "auto" },
    { id: "bad id!", client_name: "x" },
    { id: "cgr_2", client_name: "Tool", redirect_host: "LOCALHOST", scopes: ["read"], access_mode: "weird" },
  ] });
  const list = await listConnections("tok");
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/me/connector/connections");
  assert.equal(calls[0].auth, "Bearer tok");
  assert.notEqual(calls[0].credentials, "include", "no cookies on the account routes");
  assert.deepEqual(list.map((c) => [c.id, c.scopes, c.accessMode, c.redirectHost]), [
    ["cgr_1", ["read", "act"], "auto", "claude.ai"],
    ["cgr_2", ["read"], "ask", "localhost"],
  ]);
  assert.deepEqual(normalizeConnections({ not: "a list" }), []);
});

test("disconnect deletes one connection by id; a malformed id never reaches the API", async () => {
  const calls = stubApi(204, null);
  await disconnect("tok", "cgr_1");
  assert.equal(calls[0].url, "https://api.trytoone.com/v1/me/connector/connections/cgr_1");
  assert.equal(calls[0].method, "DELETE");
  await assert.rejects(disconnect("tok", "../x"));
  assert.equal(calls.length, 1);
});

test("labels name the host; only Claude's own hosts are called Claude", () => {
  assert.equal(connectionLabel({ clientName: "anything", redirectHost: "claude.ai" }), "Claude (claude.ai)");
  assert.equal(connectionLabel({ clientName: "Claude", redirectHost: "localhost" }), "Claude (localhost)");
  assert.equal(connectionLabel({ clientName: "", redirectHost: "" }), "An app (an unknown address)");
  assert.equal(formatConnectionDate("2026-11-25T10:00:00Z"), "25 November 2026");
  assert.equal(formatConnectionDate("nope"), "");
});

test("the page is English only, like /connect", () => {
  assert.ok((ENGLISH_ONLY_PATHS as readonly string[]).includes("/connections"));
});
