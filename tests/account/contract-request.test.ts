import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ContractRequestPage from "../../components/account/ContractRequestPage";
import {
  CONTRACT_NAME_MAX,
  CONTRACT_REASON_MAX,
  ORDER_REF_MAX,
  contractOutcome,
  contractRequestFrom,
  receivedAt,
} from "../../components/account/contract-request";
import { ApiError } from "../../lib/api";
import { submitContractRequest } from "../../lib/billing/api";
import en from "../../messages/en.json";

/* /cancel-contract: login-free withdraw and cancel, two steps, one answer for every accepted request. */

test("step 1 needs the purchase email and a TOONE- order reference; the name is optional", () => {
  assert.deepEqual(contractRequestFrom("withdraw", " buyer@example.com ", " toone-abcdefgh12 "), {
    ok: true, request: { kind: "withdraw", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12" },
  });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "TOONE-ABCDEFGH12", "  Ana Buyer "), {
    ok: true, request: { kind: "cancel", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12", name: "Ana Buyer", termination: "ordinary" },
  });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example", "TOONE-ABCDEFGH12"), { ok: false, error: "errEmail" });
  for (const ref of ["   ", "TOONE-1", "1234", `TOONE-${"A".repeat(65)}`, "TOONE\u0000-ABCDEFGH12", "ORDER-ABCDEFGH12"]) {
    assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", ref), { ok: false, error: "errOrderRef" }, ref);
  }
  assert.equal(ORDER_REF_MAX, 70);
  assert.equal(CONTRACT_NAME_MAX, 200);
  assert.equal(contractRequestFrom("cancel", "buyer@example.com", "TOONE-ABCDEFGH12", "é".repeat(200)).ok, true, "200 characters, not bytes");
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "TOONE-ABCDEFGH12", "x".repeat(201)), { ok: false, error: "errName" });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "TOONE-ABCDEFGH12", "Ana\nBuyer"), { ok: false, error: "errName" });
});

test("every accepted request gets the same outcome; errors never say whether a purchase exists", () => {
  assert.deepEqual(contractOutcome(), { state: "sent" });
  assert.deepEqual(contractOutcome(new ApiError("invalid_input", "bad", 400)), { state: "error", key: "errInput" });
  assert.deepEqual(contractOutcome(new ApiError("rate_limit_exceeded", "slow", 429)), { state: "error", key: "errRate" });
  assert.deepEqual(contractOutcome(new ApiError("service_unavailable", "off", 503)), { state: "error", key: "errNotReceived" });
  assert.deepEqual(contractOutcome(new ApiError("not_found", "no such order", 404)), { state: "error", key: "errGeneric" });
  assert.deepEqual(contractOutcome(new TypeError("Failed to fetch")), { state: "error", key: "errGeneric" });
});

test("a cancellation states its type (§ 312k BGB): extraordinary needs a reason; the end date is optional and after today", () => {
  const base = ["cancel", "buyer@example.com", "TOONE-ABCDEFGH12", ""] as const;
  const TODAY = "2026-11-10";
  assert.deepEqual(contractRequestFrom(...base, { termination: "ordinary", reason: "ignored", endDate: "" }, TODAY), {
    ok: true, request: { kind: "cancel", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12", termination: "ordinary" },
  });
  assert.deepEqual(contractRequestFrom(...base, { termination: "extraordinary", reason: "  Moved abroad  ", endDate: "2026-12-01" }, TODAY), {
    ok: true,
    request: {
      kind: "cancel", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12",
      termination: "extraordinary", termination_reason: "Moved abroad", end_date: "2026-12-01",
    },
  });
  assert.deepEqual(contractRequestFrom(...base, { termination: "extraordinary", reason: "  ", endDate: "" }, TODAY), { ok: false, error: "errReason" });
  assert.deepEqual(contractRequestFrom(...base, { termination: "extraordinary", reason: "x".repeat(CONTRACT_REASON_MAX + 1), endDate: "" }, TODAY), { ok: false, error: "errReason" });
  assert.equal(contractRequestFrom(...base, { termination: "extraordinary", reason: "Line one\nline two", endDate: "" }, TODAY).ok, true);
  for (const endDate of ["2026-11-10", "2026-11-09", "2026-02-30", "11/12/2026", "2026-1-5"]) {
    assert.deepEqual(contractRequestFrom(...base, { termination: "ordinary", reason: "", endDate }, TODAY), { ok: false, error: "errEndDate" }, endDate);
  }
  // A withdrawal carries none of it.
  assert.deepEqual(contractRequestFrom("withdraw", "buyer@example.com", "TOONE-ABCDEFGH12", "", { termination: "extraordinary", reason: "x", endDate: "2027-01-01" }, TODAY), {
    ok: true, request: { kind: "withdraw", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12" },
  });
});

test("pressing the button is the declaration: no emailed link, effect on receipt, conditional on a match", () => {
  const c = en.account.contract;
  assert.match(c.confirmNote, /^Pressing the button below is your declaration/);
  assert.match(c.confirmNote, /takes effect at that moment/);
  assert.match(c.confirmNote, /you don't need to confirm anything/);
  assert.match(c.sent, /^If these details match a Toone Pro purchase, your request took effect when we received it/);
  assert.match(c.sent, /\{email\} an acknowledgement with its content, date and time/);
  assert.equal(c.sentTitle, "Request received");
  for (const [key, value] of Object.entries(c)) {
    assert.doesNotMatch(value, /no (account|purchase) (was )?found|doesn't exist|not registered/i, key);
    assert.doesNotMatch(value, /confirmation link|Open it to finish|nothing changes before/i, `${key} still describes the emailed link`);
  }
  // The email field takes the account's address or the checkout one.
  assert.match(c.email, /Toone account, or the one you entered at checkout/);
  assert.match(c.orderRefHelp, /purchase confirmation email from Toone/);
  // The receipt time is the server's when it sends one.
  assert.equal(receivedAt("2026-11-10T12:00:00Z").toISOString(), "2026-11-10T12:00:00.000Z");
  const now = new Date("2026-11-10T13:00:00Z");
  assert.equal(receivedAt(null, now), now);
  assert.equal(receivedAt("garbage", now), now);
});

test("the confirm and acknowledgement steps show the termination type and end date", () => {
  const page = fs.readFileSync("components/account/ContractRequestPage.tsx", "utf8");
  const summary = page.slice(page.indexOf("function summary("), page.indexOf("return (\n    <main"));
  for (const key of ["kindShort", "emailShort", "orderRef", "terminationShort", "terminationExtraordinary", "terminationOrdinary", "reasonShort", "endShort", "endNext"]) {
    assert.match(summary, new RegExp(`t\\("${key}"\\)`), key);
  }
  assert.match(page, /\{step\.name === "confirm" && \([\s\S]*?\{summary\(step\.request\)\}/);
  assert.match(page, /\{step\.name === "sent" && \([\s\S]*?\{summary\(step\.request\)\}/);
  // Date and time with the time zone on the acknowledgement.
  assert.match(page, /t\("sentAt", \{ at: step\.at\.toLocaleString\(locale, \{ dateStyle: "long", timeStyle: "long" \}\) \}\)/);
  assert.match(page, /type="radio" name="contract-termination"/);
  assert.match(page, /id="contract-reason"/);
  assert.match(page, /type="radio" name="contract-end"/);
  assert.match(page, /id="contract-end-date" type="date"/);
});

const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; delete env.NEXT_PUBLIC_API_BASE_URL; });

test("a 202 for an unknown email and for a real one resolve the same way, without a session", async () => {
  env.NEXT_PUBLIC_API_BASE_URL = "https://api.test/v1";
  const seen: { auth: string | null; body: unknown }[] = [];
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    seen.push({ auth: new Headers(init?.headers).get("Authorization"), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ data: { accepted: true, received_at: "2026-11-10T12:00:00Z" } }), { status: 202, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const outcomes = [];
  for (const email of ["known@example.com", "nobody@example.com"]) {
    let caught: unknown;
    try { await submitContractRequest({ kind: "withdraw", email, order_ref: "TOONE-ABCDEFGH12", locale: "pt" }); } catch (error) { caught = error; }
    outcomes.push(contractOutcome(caught));
  }
  assert.deepEqual(outcomes, [{ state: "sent" }, { state: "sent" }]);
  assert.deepEqual(seen.map((call) => call.auth), [null, null]);
  assert.deepEqual(seen[1].body, { kind: "withdraw", email: "nobody@example.com", order_ref: "TOONE-ABCDEFGH12", locale: "pt" });
});

test("a cancellation sends its type, reason and end date; a withdrawal never does", async () => {
  env.NEXT_PUBLIC_API_BASE_URL = "https://api.test/v1";
  const bodies: unknown[] = [];
  let reply: unknown = { data: { accepted: true, received_at: "2026-11-10T12:00:00Z" } };
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify(reply), { status: 202, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const receipt = await submitContractRequest({
    kind: "cancel", email: "a@example.com", order_ref: "TOONE-ABCDEFGH12", locale: "de",
    termination: "extraordinary", termination_reason: " Umzug ", end_date: "2026-12-31",
  });
  assert.deepEqual(receipt, { received_at: "2026-11-10T12:00:00Z" });
  assert.deepEqual(bodies[0], {
    kind: "cancel", email: "a@example.com", order_ref: "TOONE-ABCDEFGH12", locale: "de",
    termination: "extraordinary", termination_reason: "Umzug", end_date: "2026-12-31",
  });
  reply = { data: { accepted: true } };
  assert.deepEqual(await submitContractRequest({
    kind: "withdraw", email: "a@example.com", order_ref: "TOONE-ABCDEFGH12", termination: "ordinary", end_date: "2026-12-31",
  }), { received_at: null }, "an older server without received_at still works");
  assert.deepEqual(bodies[1], { kind: "withdraw", email: "a@example.com", order_ref: "TOONE-ABCDEFGH12" });
});

test("a 503 means not received: the page says so and never shows the sent step", async () => {
  env.NEXT_PUBLIC_API_BASE_URL = "https://api.test/v1";
  let reply: { status: number; body: unknown } = { status: 503, body: { code: "service_unavailable", message: "try again" } };
  globalThis.fetch = (async () => new Response(JSON.stringify(reply.body), {
    status: reply.status, headers: { "Content-Type": "application/json" },
  })) as typeof fetch;
  const outcome = async () => {
    try {
      await submitContractRequest({ kind: "withdraw", email: "a@example.com", order_ref: "TOONE-ABCDEFGH12" });
    } catch (error) {
      return contractOutcome(error);
    }
    return contractOutcome();
  };
  assert.deepEqual(await outcome(), { state: "error", key: "errNotReceived" });
  // Only the 202 answer counts as received; a success without `accepted: true` does not.
  for (const body of [{ data: {} }, { data: { accepted: false } }, {}]) {
    reply = { status: 200, body };
    assert.deepEqual(await outcome(), { state: "error", key: "errNotReceived" }, JSON.stringify(body));
  }
  reply = { status: 202, body: { data: { accepted: true, received_at: "2026-11-10T12:00:00Z" } } };
  assert.deepEqual(await outcome(), { state: "sent" });

  assert.match(en.account.contract.errNotReceived, /^We couldn't receive your request — please try again\./);
  assert.equal(Object.hasOwn(en.account.contract, "errUnavailable"), false);
  const page = fs.readFileSync("components/account/ContractRequestPage.tsx", "utf8");
  assert.match(page, /t\("errNotReceived", \{ email: SUPPORT_EMAIL \}\)/);
});

test("the page opens on the two labelled functions, with no sign-in form", () => {
  const html = renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale: "en", messages: en, timeZone: "UTC", children: createElement(ContractRequestPage),
  }));
  assert.match(html, /<h2 id="contract-withdraw">Withdraw from contract here<\/h2>/);
  assert.match(html, /<h2 id="contract-cancel">Cancel contract here<\/h2>/);
  assert.match(html, /<button[^>]*type="button"[^>]*>Withdraw from contract here<\/button>/);
  assert.match(html, /<button[^>]*type="button"[^>]*>Cancel contract here<\/button>/);
  assert.doesNotMatch(html, /type="password"/);
});

test("the request sends the page's locale (the acknowledgement uses it) and the optional name", () => {
  const page = fs.readFileSync("components/account/ContractRequestPage.tsx", "utf8");
  assert.match(page, /submitContractRequest\(\{ \.\.\.request, locale \}\)/);
  assert.match(page, /id="contract-name"/);
  assert.match(page, /autoComplete="name" maxLength=\{CONTRACT_NAME_MAX\}/);
  assert.equal(en.account.contract.name, "Your name (optional)");
});

test("withdrawal copy follows the refund rules: first purchase in full, later subscription pro rata, later Lifetime not refunded", async () => {
  const en = (await import("../../messages/en.json", { with: { type: "json" } })).default as { account: Record<string, Record<string, string>> };
  assert.match(en.account.contract.withdrawBody, /Your first Toone Pro purchase is refunded in full; a later subscription is refunded for the unused part of the period, and a later Lifetime purchase is not refunded\./);
  // A withdrawn Lifetime that had stopped a running web subscription: that subscription renews again.
  assert.match(en.account.contractConfirm.withdrawnBody, /that subscription renews again/);
  assert.doesNotMatch(en.account.contractConfirm.withdrawnBody, /Your payment is being refunded and Toone Pro has ended\./);
});
