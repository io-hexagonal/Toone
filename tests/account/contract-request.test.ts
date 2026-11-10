import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import { afterEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ContractRequestPage from "../../components/account/ContractRequestPage";
import { CONTRACT_NAME_MAX, ORDER_REF_MAX, contractOutcome, contractRequestFrom } from "../../components/account/contract-request";
import { ApiError } from "../../lib/api";
import { submitContractRequest } from "../../lib/billing/api";
import en from "../../messages/en.json";

/* /cancel-contract: login-free withdraw and cancel, two steps, one answer for every accepted request. */

test("step 1 needs the purchase email and a TOONE- order reference; the name is optional", () => {
  assert.deepEqual(contractRequestFrom("withdraw", " buyer@example.com ", " toone-abcdefgh12 "), {
    ok: true, request: { kind: "withdraw", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12" },
  });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "TOONE-ABCDEFGH12", "  Ana Buyer "), {
    ok: true, request: { kind: "cancel", email: "buyer@example.com", order_ref: "TOONE-ABCDEFGH12", name: "Ana Buyer" },
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
  assert.deepEqual(contractOutcome(new ApiError("service_unavailable", "off", 503)), { state: "error", key: "errUnavailable" });
  assert.deepEqual(contractOutcome(new ApiError("not_found", "no such order", 404)), { state: "error", key: "errGeneric" });
  assert.deepEqual(contractOutcome(new TypeError("Failed to fetch")), { state: "error", key: "errGeneric" });
});

test("the success copy is conditional and names only the address the visitor typed", () => {
  const sent = en.account.contract.sent;
  assert.match(sent, /^If we find a matching purchase, we've emailed a confirmation link to \{email\}/);
  for (const [key, value] of Object.entries(en.account.contract)) {
    assert.doesNotMatch(value, /no (account|purchase) (was )?found|doesn't exist|not registered/i, key);
  }
});

const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; delete env.NEXT_PUBLIC_API_BASE_URL; });

test("a 202 for an unknown email and for a real one resolve the same way, without a session", async () => {
  env.NEXT_PUBLIC_API_BASE_URL = "https://api.test/v1";
  const seen: { auth: string | null; body: unknown }[] = [];
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    seen.push({ auth: new Headers(init?.headers).get("Authorization"), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ data: { accepted: true } }), { status: 202, headers: { "Content-Type": "application/json" } });
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

test("the request sends the page's locale (the emailed link uses it) and the optional name", () => {
  const page = fs.readFileSync("components/account/ContractRequestPage.tsx", "utf8");
  assert.match(page, /submitContractRequest\(\{ kind, email: confirmedEmail, order_ref: confirmedRef, name: confirmedName, locale \}\)/);
  assert.match(page, /id="contract-name"/);
  assert.match(page, /autoComplete="name" maxLength=\{CONTRACT_NAME_MAX\}/);
  assert.equal(en.account.contract.name, "Your name (optional)");
});
