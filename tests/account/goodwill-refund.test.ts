import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { NextRequest } from "next/server";
import ContractRequestPage from "../../components/account/ContractRequestPage";
import {
  GOODWILL_REASON_MAX_LENGTH,
  GOODWILL_REASON_MIN_LENGTH,
  GOODWILL_REFUND_KIND,
  goodwillDiscordMessage,
  goodwillRefundFrom,
  reasonLength,
} from "../../lib/billing/goodwill-refund";
import { locales } from "../../i18n/routing";
import en from "../../messages/en.json";

/* /cancel-contract#goodwill-refund: a voluntary Lifetime refund request with a reason, apart from the statutory withdrawal. */

const REASON = "The app does not fit my workflow after all.";
const VALID = { email: " buyer@example.com ", orderRef: " toone-abcdefgh12 ", reason: `  ${REASON}  `, locale: "de" };

test("a goodwill request needs the purchase email, a TOONE- order reference and a reason of 20 to 2000 characters", () => {
  assert.equal(GOODWILL_REASON_MIN_LENGTH, 20);
  assert.equal(GOODWILL_REASON_MAX_LENGTH, 2000);
  assert.deepEqual(goodwillRefundFrom(VALID), {
    ok: true,
    request: { kind: GOODWILL_REFUND_KIND, email: "buyer@example.com", orderRef: "TOONE-ABCDEFGH12", reason: REASON, locale: "de" },
  });
  assert.deepEqual(goodwillRefundFrom({ ...VALID, name: "  Ana  " }), {
    ok: true,
    request: { kind: GOODWILL_REFUND_KIND, email: "buyer@example.com", orderRef: "TOONE-ABCDEFGH12", reason: REASON, locale: "de", name: "Ana" },
  });
  assert.deepEqual(goodwillRefundFrom({ ...VALID, email: "buyer@example" }), { ok: false, error: "goodwillErrEmail" });
  assert.deepEqual(goodwillRefundFrom({ ...VALID, email: 42 }), { ok: false, error: "goodwillErrEmail" });
  for (const orderRef of ["", "TOONE-1", "ORDER-ABCDEFGH12", null]) {
    assert.deepEqual(goodwillRefundFrom({ ...VALID, orderRef }), { ok: false, error: "goodwillErrOrderRef" }, String(orderRef));
  }
  const nineteen = "x".repeat(19);
  assert.deepEqual(goodwillRefundFrom({ ...VALID, reason: `   ${nineteen}   ` }), { ok: false, error: "goodwillErrReason" }, "trimmed");
  assert.equal(goodwillRefundFrom({ ...VALID, reason: "é".repeat(20) }).ok, true, "characters, not bytes");
  assert.equal(reasonLength(" é ".repeat(10)), 28);
  assert.deepEqual(goodwillRefundFrom({ ...VALID, reason: "x".repeat(2001) }), { ok: false, error: "goodwillErrReason" });
  assert.deepEqual(goodwillRefundFrom({ ...VALID, reason: undefined }), { ok: false, error: "goodwillErrReason" });
  assert.deepEqual(goodwillRefundFrom({ ...VALID, reason: `${REASON}\u0000` }), { ok: false, error: "goodwillErrReason" });
  assert.equal(goodwillRefundFrom({ ...VALID, reason: `${REASON}\nSecond line.` }).ok, true, "line breaks are fine");
  assert.deepEqual(goodwillRefundFrom({ ...VALID, name: "x".repeat(201) }), { ok: false, error: "goodwillErrName" });
  const odd = goodwillRefundFrom({ ...VALID, locale: "../etc" });
  assert.equal(odd.ok && odd.request.locale, "en", "an odd locale falls back to en");
});

test("the Discord message names the order, the purchase email, the reason and what to do", () => {
  const checked = goodwillRefundFrom({ ...VALID, name: "Ana", reason: "y".repeat(1500) });
  assert.ok(checked.ok);
  const message = goodwillDiscordMessage(checked.request, new Date("2026-11-21T10:00:00Z"));
  const [embed] = message.embeds;
  assert.equal(embed.title, "Goodwill refund request (Lifetime)");
  assert.match(embed.description, /Review in Stripe; refund by hand in the Dashboard \(refund revokes lifetime Pro\)/);
  const fields = Object.fromEntries(embed.fields.map((field) => [field.name, field.value]));
  assert.equal(fields.Order, "TOONE-ABCDEFGH12");
  assert.equal(fields["Purchase email"], "buyer@example.com");
  assert.equal(fields.Name, "Ana");
  assert.equal(fields.Locale, "de");
  assert.equal(fields["Submitted at"], "2026-11-21T10:00:00.000Z");
  assert.equal(fields.Reason.length + fields["Reason (continued)"].length, 1500, "a long reason is split, never cut");
  for (const field of embed.fields) assert.ok(field.value.length <= 1024, field.name);
});

const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; delete env.DISCORD_WEBHOOK_URL; });

/** The route reads DISCORD_WEBHOOK_URL once, when it is first imported: every test here uses the same webhook. */
async function loadRoute(webhook: string) {
  env.DISCORD_WEBHOOK_URL = webhook;
  return import("../../app/api/contact/route");
}

let nextIp = 1;
/** Each request from its own IP: the route's per-IP rate limit is not under test here (contact-guard.test.ts). */
function post(body: unknown) {
  return new NextRequest("https://trytoone.com/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": `192.0.2.${nextIp++}` }, body: JSON.stringify(body),
  });
}

test("/api/contact posts a goodwill request as its own Discord message, after checking it again", async () => {
  const sent: { url: string; body: { embeds: { title: string; fields: { name: string; value: string }[] }[] } }[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    sent.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  const { POST } = await loadRoute("https://discord.test/webhook");

  const ok = await POST(post({ kind: GOODWILL_REFUND_KIND, ...VALID }));
  assert.equal(ok.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, "https://discord.test/webhook");
  assert.equal(sent[0].body.embeds[0].title, "Goodwill refund request (Lifetime)");

  const short = await POST(post({ kind: GOODWILL_REFUND_KIND, ...VALID, reason: "too short" }));
  assert.equal(short.status, 400);
  assert.deepEqual(await short.json(), { error: "Invalid input", field: "goodwillErrReason" });
  assert.equal(sent.length, 1, "nothing posted for invalid input");

  // A contact message is unchanged: name, email and message, the old embed.
  const contact = await POST(post({ name: "Ana", email: "ana@example.com", message: "Hello", source: "pricing" }));
  assert.equal(contact.status, 200);
  assert.equal(sent[1].body.embeds[0].title, "💬 New contact from trytoone.com");
  assert.equal((await POST(post({ name: "", email: "ana@example.com", message: "Hello" }))).status, 400);
});

test("/api/contact reports a goodwill request it could not deliver, so the form offers email instead", async () => {
  globalThis.fetch = (async () => new Response("no", { status: 500 })) as typeof fetch;
  const { POST } = await loadRoute("https://discord.test/webhook");
  assert.equal((await POST(post({ kind: GOODWILL_REFUND_KIND, ...VALID }))).status, 502);
});

function render() {
  return renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale: "en", messages: en, timeZone: "UTC", children: createElement(ContractRequestPage),
  }));
}

test("the contract page shows the goodwill request apart from withdraw and cancel; the withdrawal stays reason-free", () => {
  const html = render();
  assert.match(html, /<section id="goodwill-refund"[^>]*aria-labelledby="goodwill-refund-title"/);
  assert.match(html, /<h2 id="goodwill-refund-title">Ask for a goodwill refund \(Lifetime\)<\/h2>/);
  assert.ok(html.indexOf('id="contract-withdraw"') < html.indexOf('id="goodwill-refund"'), "the statutory functions come first");
  assert.match(html, /<textarea id="goodwill-reason"[^>]*required/);
  assert.match(html, /At least 20 characters \(0 so far\)\./);
  // The withdraw/cancel form itself is untouched: no goodwill fields, no reason for a withdrawal.
  const page = fs.readFileSync("components/account/ContractRequestPage.tsx", "utf8");
  assert.doesNotMatch(page, /goodwill-reason|goodwillReason/);
  assert.match(page, /\{step\.name === "choose" && <GoodwillRefundForm \/>\}/);
  const form = fs.readFileSync("components/account/GoodwillRefundForm.tsx", "utf8");
  assert.match(form, /fetch\("\/api\/contact"/);
  assert.match(form, /mailto:\$\{SUPPORT_EMAIL\}/);
});

test("the contract copy no longer promises a full refund for every first purchase, and says how earlier buyers keep theirs", () => {
  const c = en.account.contract;
  assert.doesNotMatch(c.withdrawBody, /^Within 14 days of buying, you can withdraw from the contract and Toone Pro ends\. Your first Toone Pro purchase is refunded in full/);
  assert.match(c.withdrawBody, /withdraw without giving a reason: it ends at once and the unused part of the period you paid for is refunded/);
  assert.match(c.withdrawBody, /you can ask for a goodwill refund instead/);
  assert.match(c.withdrawBody, /Purchases made before 20 November 2026 keep the refund promised then/);
  assert.match(c.goodwillBody, /\{days\} days/);
  assert.match(c.goodwillErrSend, /<link>\{email\}<\/link>/);
  for (const locale of locales) {
    const local = JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8")).account.contract as Record<string, string>;
    if (locale !== "en") assert.notEqual(local.goodwillTitle, en.account.contract.goodwillTitle, `${locale} translated`);
    assert.match(local.goodwillEarlier, new RegExp(local.withdrawTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${locale} names the withdraw function as the page does`);
  }
});
