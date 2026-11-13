import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AuthPage from "../../components/AuthPage";
import RedeemSignupResult from "../../components/account/RedeemSignupResult";
import { isAlreadyProError, providerSignupState, redeemErrorKey, signupCodeState } from "../../components/account/redeem-code";
import { locales } from "../../i18n/routing";
import en from "../../messages/en.json";

/* /redeem for a buyer without an account (an AppSumo code): sign up with the code, then see what it gave. */

const read = (path: string) => fs.readFileSync(path, "utf8");
const messages = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(read(`messages/${locale}.json`))]));

function render(node: ReturnType<typeof createElement>) {
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router as never },
    createElement(NextIntlClientProvider, { locale: "en", messages: en, timeZone: "UTC", children: node })));
}

test("an email sign-up used the code; a shared code's benefit waits for the confirmed address; Google and Apple ask the server", () => {
  const lifetime = { kind: "pro_lifetime" as const, value: null };
  assert.equal(signupCodeState("email", lifetime, false), "applied", "a single-use AppSumo code applies at once");
  assert.equal(signupCodeState("email", lifetime, true), "waits_for_email");
  assert.equal(signupCodeState("email", null, true), "applied", "an access code without a benefit");
  assert.equal(signupCodeState("google", lifetime, false), "ask_server");
  assert.equal(signupCodeState("apple", lifetime, true), "ask_server");
});

test("after Google or Apple: a code still redeemable means an existing account that ignored it", () => {
  assert.equal(providerSignupState({ ok: true }), "redeem");
  assert.equal(providerSignupState({ ok: false, failure: { kind: "invalid_code" } }), "applied", "a single-use code used up by the sign-up");
  assert.equal(providerSignupState({ ok: false, failure: { kind: "code_already_redeemed" } }), "applied");
  for (const failure of [
    { kind: "already_pro", source: "lifetime", provider: "stripe" },
    { kind: "email_verification_required" },
    { kind: "rate_limited" },
  ] as const) {
    assert.equal(providerSignupState({ ok: false, failure }), "redeem", failure.kind);
  }
});

test("signed out, /redeem offers sign-in and 'Create one with this code' on the same page", () => {
  const html = render(createElement(AuthPage, { mode: "signin", onSwitchMode: () => {} }));
  assert.match(html, /No account yet\? <button type="button">Create one with this code<\/button>/);
  assert.doesNotMatch(html, /href="\/en\/request-access"|Request Early Access/, "no detour to early access");
  const invite = render(createElement(AuthPage, { mode: "invite", initialCode: "APPSUMO-1234", onSwitchMode: () => {} }));
  assert.match(invite, /Already have an account\? <button type="button">Sign in<\/button>/);
  assert.doesNotMatch(invite, /APPSUMO-1234/, "the code is checked on the client, never rendered into the server HTML");
  // Without a host, the pages keep their links.
  assert.match(render(createElement(AuthPage, { mode: "signin" })), /New to Toone\?/);
});

test("the redeem page carries its code into the invite sign-up in memory, never in the address", () => {
  const page = read("components/account/RedeemPage.tsx");
  assert.match(page, /mode="invite"\s+initialCode=\{linkedCode \?\? undefined\}\s+onInvitationAccepted=\{setSignup\}/);
  assert.match(page, /onSwitchMode=\{\(\) => setAuthMode\("invite"\)\}/);
  assert.match(page, /justSignedUp \? \(\s*<RedeemSignupResult/);
  for (const file of ["components/account/RedeemPage.tsx", "components/account/RedeemSignupResult.tsx", "components/AuthPage.tsx"]) {
    assert.doesNotMatch(read(file), /[?&#]code=\$\{|searchParams\.set\("code"|console\.(log|info|warn)\([^)]*code/, file);
  }
  const auth = read("components/AuthPage.tsx");
  assert.match(auth, /const linkedCode = initialCode\?\.trim\(\) \|\| invitation\.get\("code"\) \|\| "";/);
  assert.match(auth, /onInvitationAccepted\?\.\(\{\s*session: s,\s*code: codeRef\.current\.trim\(\),/);
  // The sign-up result forgets the pending code once the account has what it gives.
  assert.match(read("components/account/RedeemSignupResult.tsx"), /async function showApplied\([^)]*\) \{\s*forgetPendingCode\(\);/);
});

test("the sign-up result starts with a neutral checking state", () => {
  const html = render(createElement(RedeemSignupResult, {
    outcome: {
      session: { token: "tok", expiresAt: "2099-01-01T00:00:00Z", user: { id: "usr_1", email: "ana@example.com", name: "Ana" } },
      code: "APPSUMO1234", benefit: { kind: "pro_lifetime", value: null }, shared: false, via: "email",
    },
    onSessionEnded: () => {},
  }));
  assert.match(html, /role="status">Checking your account…</);
  assert.doesNotMatch(html, /APPSUMO1234/);
});

test("already Pro (409): the code is not used up, and the buyer is told to write for an AppSumo refund", () => {
  for (const failure of [
    { kind: "already_pro", source: "subscription", provider: "app_store" },
    { kind: "already_pro", source: "lifetime", provider: "stripe" },
    { kind: "already_pro", source: null, provider: null },
  ] as const) {
    assert.ok(isAlreadyProError(redeemErrorKey(failure)), JSON.stringify(failure));
  }
  for (const key of ["errInvalid", "errUsed", "errVerify", "errRate", null] as const) assert.equal(isAlreadyProError(key), false, String(key));
  const form = read("components/account/RedeemForm.tsx");
  assert.match(form, /const refundHelp = error && isAlreadyProError\(errorKey\) && \(/);
  assert.equal((form.match(/\{refundHelp\}/g) ?? []).length, 2, "under the error on both the code and the preview step");
  for (const locale of locales) {
    const t = createTranslator({ locale, messages: messages[locale], namespace: "account.redeem" });
    const html = renderToStaticMarkup(createElement("p", null,
      t.rich("errAlreadyProRefund", { link: (chunks) => createElement("a", { href: "mailto:hello@trytoone.com" }, chunks) })));
    assert.match(html, /AppSumo/, locale);
    assert.match(html, /<a href="mailto:hello@trytoone\.com">hello@trytoone\.com<\/a>/, locale);
    assert.ok(messages[locale].auth.redeemNoAccount && messages[locale].auth.redeemCreateAccount, locale);
  }
});
