import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { GOODWILL_REFUND_KIND, goodwillDiscordMessage, goodwillRefundFrom } from "../../lib/billing/goodwill-refund";
import {
  CONTACT_RATE_LIMIT,
  CONTACT_RATE_WINDOW_MS,
  HONEYPOT_FIELD,
  clientIp,
  createRateLimiter,
  honeypotFilled,
  originAllowed,
} from "../../lib/contact-guard";

/* /api/contact abuse guards: honeypot, per-IP rate limit, Origin allowlist, no Discord pings. */

const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

type Sent = { embeds: { title: string }[]; allowed_mentions?: { parse: string[] } };
const sent: Sent[] = [];
function stubDiscord(status = 204) {
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    return new Response(null, { status });
  }) as typeof fetch;
}

/** The route reads DISCORD_WEBHOOK_URL once, at import; its rate limiter lives as long as the module. */
async function route() {
  env.DISCORD_WEBHOOK_URL = "https://discord.test/webhook";
  return import("../../app/api/contact/route");
}

let nextIp = 1;
/** A fresh client IP per call unless one is given, so tests never share a rate-limit bucket by accident. */
function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://trytoone.com/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `198.51.100.${nextIp++}`, ...headers },
    body: JSON.stringify(body),
  });
}

const CONTACT = { name: "Ana", email: "ana@example.com", message: "Hello @everyone", source: "pricing" };
const GOODWILL = {
  kind: GOODWILL_REFUND_KIND, email: "buyer@example.com", orderRef: "TOONE-ABCDEFGH12",
  reason: "The app does not fit my workflow @here", locale: "en",
};

test("a filled honeypot answers 200 and posts nothing, for contact and goodwill requests alike", async () => {
  stubDiscord();
  const { POST } = await route();
  const before = sent.length;
  for (const body of [CONTACT, GOODWILL]) {
    const res = await POST(post({ ...body, [HONEYPOT_FIELD]: "https://spam.example" }));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { message: "Sent" });
  }
  assert.equal(sent.length, before, "nothing reached Discord");
  // An empty (or whitespace) honeypot is a person: the message goes through.
  assert.equal((await POST(post({ ...CONTACT, [HONEYPOT_FIELD]: " " }))).status, 200);
  assert.equal(sent.length, before + 1);

  assert.equal(honeypotFilled({ [HONEYPOT_FIELD]: "x" }), true);
  assert.equal(honeypotFilled({ [HONEYPOT_FIELD]: "" }), false);
  assert.equal(honeypotFilled({}), false);
  assert.equal(honeypotFilled(null), false);
});

test("both forms render the honeypot and send it", () => {
  const field = fs.readFileSync("components/HoneypotField.tsx", "utf8");
  assert.match(field, /aria-hidden="true"/);
  assert.match(field, /tabIndex=\{-1\}/);
  assert.match(field, /autoComplete="off"/);
  assert.match(field, /position: "absolute", left: "-10000px"/, "off screen, not display:none");
  assert.match(field, /name=\{HONEYPOT_FIELD\}/);
  for (const file of ["components/ContactModal.tsx", "components/account/GoodwillRefundForm.tsx"]) {
    const form = fs.readFileSync(file, "utf8");
    assert.match(form, /<HoneypotField value=\{honeypot\} onChange=\{setHoneypot\} \/>/, file);
    assert.match(form, /\[HONEYPOT_FIELD\]: honeypot/, `${file} sends the field`);
  }
});

test("more than 5 requests per IP in 10 minutes get a 429; other IPs are unaffected", async () => {
  stubDiscord();
  const { POST } = await route();
  const ip = { "x-forwarded-for": "203.0.113.7, 10.0.0.1" };
  for (let i = 0; i < CONTACT_RATE_LIMIT; i++) assert.equal((await POST(post(CONTACT, ip))).status, 200, `request ${i + 1}`);
  const before = sent.length;
  const limited = await POST(post(CONTACT, ip));
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { error: "Too many requests. Please try again later." });
  assert.equal(sent.length, before, "a limited request posts nothing");
  assert.equal((await POST(post(CONTACT, { "x-forwarded-for": "203.0.113.8" }))).status, 200);
});

test("the limiter slides: requests age out of the window, and old IPs are pruned", () => {
  let now = 0;
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => now });
  assert.equal(limiter.allow("a"), true);
  now = 500;
  assert.equal(limiter.allow("a"), true);
  assert.equal(limiter.allow("a"), false);
  now = 1001; // the first request left the window
  assert.equal(limiter.allow("a"), true);
  assert.equal(limiter.allow("a"), false);

  const big = createRateLimiter({ now: () => now });
  for (let i = 0; i < 1000; i++) big.allow(`ip-${i}`);
  now += CONTACT_RATE_WINDOW_MS + 1;
  big.allow("fresh");
  assert.equal(big.size, 1, "expired IPs are pruned once the map is large");
});

test("the client IP is the first x-forwarded-for entry, else x-real-ip", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" })), "203.0.113.7");
  assert.equal(clientIp(new Headers({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
  assert.equal(clientIp(new Headers()), "unknown");
});

test("a foreign Origin is refused; the site, www, local dev and no Origin are accepted", async () => {
  stubDiscord();
  const { POST } = await route();
  const before = sent.length;
  for (const origin of ["https://evil.example", "https://trytoone.com.evil.example", "http://trytoone.com", "null"]) {
    const res = await POST(post(CONTACT, { origin }));
    assert.equal(res.status, 403, origin);
  }
  assert.equal(sent.length, before, "nothing posted for a foreign origin");
  for (const origin of ["https://trytoone.com", "https://www.trytoone.com", "http://localhost:3000", "http://127.0.0.1:3100"]) {
    assert.equal((await POST(post(CONTACT, { origin }))).status, 200, origin);
  }
  assert.equal((await POST(post(CONTACT))).status, 200, "no Origin header");
  assert.equal(originAllowed("http://localhost"), true);
  assert.equal(originAllowed("http://localhost.evil.example"), false);
});

test("Discord never parses mentions from user text, for contact and goodwill messages", async () => {
  stubDiscord();
  const { POST } = await route();
  const before = sent.length;
  assert.equal((await POST(post(CONTACT))).status, 200);
  assert.equal((await POST(post(GOODWILL))).status, 200);
  assert.equal(sent.length, before + 2);
  for (const body of sent.slice(before)) assert.deepEqual(body.allowed_mentions, { parse: [] }, body.embeds[0].title);

  const checked = goodwillRefundFrom(GOODWILL);
  assert.ok(checked.ok);
  assert.deepEqual(goodwillDiscordMessage(checked.request, new Date()).allowed_mentions, { parse: [] });
});
