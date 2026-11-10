import "./css-modules";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ContractRequestPage from "../../components/account/ContractRequestPage";
import { contractOutcome, contractRequestFrom } from "../../components/account/contract-request";
import { ApiError } from "../../lib/api";
import { submitContractRequest } from "../../lib/billing/api";
import en from "../../messages/en.json";

/* /cancel-contract: login-free withdraw and cancel, two steps, one answer for every accepted request. */

test("step 1 needs the purchase email and the order reference; both are trimmed", () => {
  assert.deepEqual(contractRequestFrom("withdraw", " buyer@example.com ", " TOONE-1234 "), {
    ok: true, request: { kind: "withdraw", email: "buyer@example.com", order_ref: "TOONE-1234" },
  });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example", "TOONE-1"), { ok: false, error: "errEmail" });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "   "), { ok: false, error: "errOrderRef" });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "x".repeat(121)), { ok: false, error: "errOrderRef" });
  assert.deepEqual(contractRequestFrom("cancel", "buyer@example.com", "TOONE\u0000-1"), { ok: false, error: "errOrderRef" });
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
    try { await submitContractRequest({ kind: "withdraw", email, order_ref: "TOONE-1" }); } catch (error) { caught = error; }
    outcomes.push(contractOutcome(caught));
  }
  assert.deepEqual(outcomes, [{ state: "sent" }, { state: "sent" }]);
  assert.deepEqual(seen.map((call) => call.auth), [null, null]);
  assert.deepEqual(seen[1].body, { kind: "withdraw", email: "nobody@example.com", order_ref: "TOONE-1" });
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
