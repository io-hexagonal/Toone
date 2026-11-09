import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { signInReturnPath } from "../../components/AuthPage";
import * as sessionRoute from "../../app/api/session/route";

/* /how-to is for signed-in accounts: the session cookie route and the return path after sign-in. */

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Stubs the Toone API's GET /me: 200 for `live`, 401 otherwise. */
function stubMe(live: string) {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push(String(url));
    const auth = new Headers(init?.headers).get("Authorization");
    return new Response("{}", { status: auth === `Bearer ${live}` ? 200 : 401 });
  }) as typeof fetch;
  return calls;
}

function post(body: unknown, origin: string | null = "https://trytoone.com") {
  const headers: Record<string, string> = { "Content-Type": "application/json", Host: "trytoone.com" };
  if (origin) headers.Origin = origin;
  return new NextRequest("https://trytoone.com/api/session", { method: "POST", headers, body: JSON.stringify(body) });
}

test("a live token becomes an httpOnly, secure, lax cookie", async () => {
  const calls = stubMe("tok-live");
  const res = await sessionRoute.POST(post({ token: "tok-live", expiresAt: new Date(Date.now() + 3_600_000).toISOString() }));
  assert.equal(res.status, 204);
  assert.match(calls[0], /\/me$/);
  const cookie = res.headers.get("set-cookie") ?? "";
  assert.match(cookie, /^toone_site_session=tok-live/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=lax/i);
  const maxAge = Number(/Max-Age=(\d+)/i.exec(cookie)?.[1]);
  assert.ok(maxAge > 3500 && maxAge <= 3600, `cookie ends with the session (${maxAge}s)`);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
});

test("a token the API rejects is not stored and clears any old cookie", async () => {
  stubMe("tok-live");
  const res = await sessionRoute.POST(post({ token: "tok-revoked", expiresAt: "2099-01-01T00:00:00Z" }));
  assert.equal(res.status, 401);
  assert.match(res.headers.get("set-cookie") ?? "", /toone_site_session=;/);
});

test("other origins cannot set or clear the cookie", async () => {
  const calls = stubMe("tok-live");
  assert.equal((await sessionRoute.POST(post({ token: "tok-live" }, "https://evil.example"))).status, 403);
  assert.equal((await sessionRoute.POST(post({ token: "tok-live" }, null))).status, 403);
  assert.equal(calls.length, 0);
  const del = new NextRequest("https://trytoone.com/api/session", { method: "DELETE", headers: { Origin: "https://evil.example", Host: "trytoone.com" } });
  assert.equal((await sessionRoute.DELETE(del)).status, 403);
});

test("sign-out clears the cookie", async () => {
  const del = new NextRequest("https://trytoone.com/api/session", { method: "DELETE", headers: { Origin: "https://trytoone.com", Host: "trytoone.com" } });
  const res = await sessionRoute.DELETE(del);
  assert.equal(res.status, 204);
  assert.match(res.headers.get("set-cookie") ?? "", /toone_site_session=;/);
});

test("after sign-in, only a /how-to path is a return target", () => {
  assert.equal(signInReturnPath("?next=%2Fhow-to"), "/how-to");
  assert.equal(signInReturnPath("?next=%2Fhow-to%2Ffeatures%2Fexplore"), "/how-to/features/explore");
  for (const search of ["", "?next=", "?next=https%3A%2F%2Fevil.example", "?next=%2F%2Fevil.example",
    "?next=%2Fdownloads", "?next=%2Fhow-to%2F..%2Fadmin", "?next=%2Fhow-tox"]) {
    assert.equal(signInReturnPath(search), null, search);
  }
});
