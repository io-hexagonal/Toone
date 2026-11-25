import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import fs from "node:fs";

/* /api/waitlist: the /api/contact guards, the visitor IP upstream, one answer for new and known addresses. */

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Sent = { url: string; headers: Headers; body: unknown };

function upstream(status: number): Sent[] {
  const sent: Sent[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    sent.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    return new Response(status === 201 ? "{}" : "{}", { status });
  }) as typeof fetch;
  return sent;
}

/** A fresh module per test: the limiter lives as long as the module. */
let n = 0;
async function route() {
  return import(`../../app/api/waitlist/route.ts?case=${n++}`) as Promise<typeof import("../../app/api/waitlist/route")>;
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://trytoone.com/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://trytoone.com", "x-forwarded-for": "203.0.113.7", ...headers },
    body: JSON.stringify(body),
  });
}

test("new and already-registered addresses get the same answer", async () => {
  const { POST } = await route();
  upstream(201);
  const created = await POST(post({ email: "a@example.com", source: "web" }));
  upstream(409);
  const known = await POST(post({ email: "a@example.com", source: "web" }));
  assert.equal(created.status, 201);
  assert.equal(known.status, 201);
  const [a, b] = [await created.json(), await known.json()];
  assert.equal(a.outcome_state, "created");
  assert.equal(b.outcome_state, "created");
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  assert.equal(a.message, b.message);
});

test("the visitor IP goes upstream; the honeypot answers success without calling the API", async () => {
  const { POST } = await route();
  const sent = upstream(201);
  await POST(post({ email: "b@example.com", source: "web" }));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].headers.get("x-forwarded-for"), "203.0.113.7");
  assert.deepEqual(sent[0].body, { email: "b@example.com", source: "web" }, "the honeypot field is not forwarded");

  const trapped = await POST(post({ email: "c@example.com", source: "web", website: "https://spam.example" }));
  assert.equal(trapped.status, 201);
  assert.equal((await trapped.json()).outcome_state, "created");
  assert.equal(sent.length, 1, "nothing sent for a filled honeypot");
});

test("a foreign Origin is refused before anything else", async () => {
  const { POST } = await route();
  const sent = upstream(201);
  const response = await POST(post({ email: "d@example.com" }, { origin: "https://evil.example" }));
  assert.equal(response.status, 403);
  assert.equal(sent.length, 0);
});

test("more than 5 requests per visitor IP in 10 minutes get a 429; another visitor is unaffected", async () => {
  const { POST } = await route();
  const sent = upstream(201);
  for (let i = 0; i < 5; i++) assert.equal((await POST(post({ email: `e${i}@example.com` }))).status, 201);
  const sixth = await POST(post({ email: "e6@example.com" }));
  assert.equal(sixth.status, 429);
  assert.equal(sent.length, 5);
  assert.equal((await POST(post({ email: "f@example.com" }, { "x-forwarded-for": "198.51.100.2" }))).status, 201);
});

test("both waitlist forms render the honeypot and send it", () => {
  for (const file of ["components/WaitlistPage.tsx", "components/HeroAuth.tsx"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /<HoneypotField value=\{honeypot\} onChange=\{setHoneypot\} \/>/, file);
    assert.match(source, /\[HONEYPOT_FIELD\]: honeypot/, file);
  }
});
