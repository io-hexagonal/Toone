import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import EmailVerification from "../../components/account/EmailVerification";
import { normalizeEmailCode, verifyFailure } from "../../components/account/email-verification";
import type { BillingFailure } from "../../lib/billing/api";
import en from "../../messages/en.json" with { type: "json" };

/* The website can confirm the account's email address itself: codes and a shared code's signup benefit wait for it. */

const read = (path: string) => fs.readFileSync(path, "utf8");

test("the emailed code is six digits; spaces and hyphens are ignored", () => {
  assert.equal(normalizeEmailCode("123456"), "123456");
  assert.equal(normalizeEmailCode(" 123 456 "), "123456");
  assert.equal(normalizeEmailCode("123-456"), "123456");
  for (const bad of ["", "12345", "1234567", "12a456", "１２３４５６"]) assert.equal(normalizeEmailCode(bad), null, bad);
});

test("each failure reads as its own outcome; an address already confirmed counts as done", () => {
  const cases: Array<[BillingFailure, string]> = [
    [{ kind: "unauthenticated" }, "session"],
    [{ kind: "unknown", status: 409, code: "already_verified", message: "" }, "verified"],
    [{ kind: "invalid_code" }, "errCode"],
    [{ kind: "rate_limited" }, "errRate"],
    [{ kind: "payments_unavailable" }, "errUnavailable"],
    [{ kind: "unknown", status: 500, code: "internal", message: "" }, "errGeneric"],
  ];
  for (const [failure, expected] of cases) assert.equal(verifyFailure(failure), expected, JSON.stringify(failure));
});

test("the confirmation step offers to email a code to the account's address", () => {
  const html = renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale: "en",
    messages: { account: en.account },
    children: createElement(EmailVerification, { token: "tok", email: "ana@example.com", onVerified: () => {}, onSessionEnded: () => {} }),
  }));
  assert.match(html, /To confirm ana@example\.com, we&#x27;ll email you a code\./);
  assert.match(html, /<button[^>]*type="button"[^>]*>Email me a code<\/button>/);
});

test("redeem and the account page show the confirmation step instead of a dead end", () => {
  const form = read("components/account/RedeemForm.tsx");
  assert.match(form, /setNeedsVerify\(key === "errVerify"\)/);
  assert.match(form, /<EmailVerification token=\{token\} email=\{email\} onVerified=\{verified\}/);
  // Confirmed: the step that was refused runs again.
  assert.match(form, /if \(step\.name === "preview"\) void redeem\(step\.code\);\s*else if \(code\.trim\(\)\) void check\(code\);/);
  const account = read("components/account/AccountPage.tsx");
  assert.match(account, /\{entitlement\?\.email_verification_required && \(/);
  assert.match(account, /<EmailVerification token=\{session\.token\} email=\{session\.user\.email\}/);
  assert.doesNotMatch(en.account.redeem.errVerify, /Look for our email in your inbox/, "no email was sent yet");
  assert.match(en.account.redeem.errVerify, /We'll email you a code to confirm it\./);
});

test("a shared code's benefit line says it waits for a confirmed address after a password signup", () => {
  assert.match(read("components/AuthPage.tsx"), /const key = preview\?\.shared \? "invite\.benefitShared" : "invite\.benefit";/);
  assert.match(en.account.invite.benefitShared, /it applies once you confirm that address; with Google or Apple, straight away/);
});
