import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import RedeemCodeGate, { CampaignWelcome, ValidCode, type CheckedCode } from "../../components/account/RedeemCodeGate";
import RedeemDone from "../../components/account/RedeemDone";
import { campaignFromRef, codeCampaign, isLifetimeActive } from "../../components/account/redeem-code";
import type { Entitlement } from "../../lib/billing/api";
import { locales } from "../../i18n/routing";
import en from "../../messages/en.json";

/* /redeem, signed out: the code comes first, then "Create your account" or "I already have an account — sign in". */

const read = (path: string) => fs.readFileSync(path, "utf8");
const messages = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(read(`messages/${locale}.json`))]));

function render(node: ReturnType<typeof createElement>, locale = "en") {
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router as never },
    createElement(NextIntlClientProvider, { locale, messages: messages[locale] ?? en, timeZone: "UTC", children: node })));
}

const noop = () => {};
const lifetime = { kind: "pro_lifetime" as const, value: null };
const entitlement = (patch: Partial<Entitlement>): Entitlement => ({
  plan: "pro", status: "active", source: "code", expires_at: null, will_renew: false, manage: "unknown",
  free_routine_creations: null, ...patch,
} as Entitlement);
const checked = (patch: Partial<CheckedCode> = {}): CheckedCode => ({
  code: "APPSUMO-ABCD-EFGH-JKLM-NPQR", benefit: lifetime, admitsSignup: true, campaign: "appsumo", ...patch,
});

test("an APPSUMO- code is AppSumo's (case, spaces and hyphens don't matter); a Product Hunt label or ?ref=producthunt is the launch", () => {
  assert.equal(codeCampaign("APPSUMO-ABCD-EFGH-JKLM-NPQR"), "appsumo");
  assert.equal(codeCampaign("  appsumo abcd efgh  "), "appsumo");
  assert.equal(codeCampaign("LAUNCH-2026-PRO"), null);
  assert.equal(codeCampaign("LAUNCH-2026-PRO", "Product Hunt launch"), "producthunt");
  assert.equal(codeCampaign("PH2026", "producthunt"), "producthunt");
  assert.equal(codeCampaign("APPSUMO-1", "Product Hunt"), "appsumo", "the code's own prefix wins");
  assert.equal(codeCampaign(null, null), null);
  assert.equal(codeCampaign("not a code!", null), null);
  for (const search of ["?ref=producthunt", "?ref=ProductHunt", "?utm_source=x&ref=product-hunt", "?ref=product_hunt"]) {
    assert.equal(campaignFromRef(search), "producthunt", search);
  }
  for (const search of ["", "?ref=appsumo", "?ref=producthuntx", "?code=producthunt"]) assert.equal(campaignFromRef(search), null, search);
});

test("only Toone Pro for the life of the product reads 'Lifetime is active'", () => {
  assert.equal(isLifetimeActive(lifetime, entitlement({})), true);
  assert.equal(isLifetimeActive(lifetime, entitlement({ expires_at: "2027-01-01T00:00:00Z" })), false, "the account had dated Pro from elsewhere");
  assert.equal(isLifetimeActive({ kind: "pro_days", value: 30 }, entitlement({})), false);
  assert.equal(isLifetimeActive(lifetime, entitlement({ plan: "free" })), false);
  assert.equal(isLifetimeActive(lifetime, null), false);
  assert.equal(isLifetimeActive(null, entitlement({})), false);
});

test("signed out, /redeem opens on 'Redeem your code' with the code field, not a bare sign-in form", () => {
  const html = render(createElement(RedeemCodeGate, { initialCode: null, refCampaign: null, onCreateAccount: noop, onSignIn: noop }));
  assert.match(html, /<h1>Redeem your code<\/h1>/);
  assert.match(html, /<label for="redeem-gate-code">Code<\/label>/);
  assert.match(html, /<input id="redeem-gate-code"/);
  assert.match(html, />Continue<\/button>/);
  assert.match(html, /Looking for your account\? <button type="button" class="linkButton">Sign in<\/button>/);
  assert.doesNotMatch(html, /type="password"|type="email"|ph-kitty|AppSumo/);
});

test("?ref=producthunt greets the launch with the Product Hunt kitty before any code is checked", () => {
  const html = render(createElement(RedeemCodeGate, { initialCode: null, refCampaign: "producthunt", onCreateAccount: noop, onSignIn: noop }));
  assert.match(html, /data-campaign="producthunt"/);
  assert.match(html, /<img class="kitty" src="\/assets\/launch\/ph-kitty\.png" alt=""/);
  assert.match(html, /Welcome from Product Hunt/);
  assert.match(html, /Thanks for joining Toone on launch day\./);
  assert.doesNotMatch(html, /%|199\.99|<s>|<del>/, "no percentage off or struck-through price");
});

test("an AppSumo code gets a text badge and the Sumo-ling welcome, never AppSumo's logo", () => {
  const html = render(createElement(CampaignWelcome, { campaign: "appsumo", benefit: lifetime }));
  assert.match(html, /<p class="badge">AppSumo<\/p>/);
  assert.match(html, /<h2>Welcome, Sumo-ling\.<\/h2>/);
  assert.match(html, /<p>Your lifetime Toone Pro is one step away\.<\/p>/);
  assert.doesNotMatch(html, /<img|appsumo\.com|\.svg|\.png/i);
  const other = render(createElement(CampaignWelcome, { campaign: "appsumo", benefit: { kind: "pro_days", value: 30 } }));
  assert.doesNotMatch(other, /lifetime/i, "no lifetime promise for a code that does not give it");
  // No AppSumo logo file was added to the site.
  assert.deepEqual(fs.readdirSync("public/assets/launch").filter((name) => /sumo/i.test(name)), []);
});

test("a valid code offers 'Create your account' and 'I already have an account — sign in'", () => {
  const html = render(createElement(ValidCode, { checked: checked(), onCreateAccount: noop, onSignIn: noop, onChange: noop }));
  assert.match(html, /<button class="primary" type="button">Create your account<\/button><button type="button">I already have an account — sign in<\/button>/);
  assert.doesNotMatch(html, /This code gives you/, "the AppSumo welcome already names lifetime Pro");
  assert.match(html, /Use a different code/);

  const plain = render(createElement(ValidCode, {
    checked: checked({ code: "PRO30", benefit: { kind: "pro_days", value: 30 }, campaign: null }), onCreateAccount: noop, onSignIn: noop, onChange: noop,
  }));
  assert.match(plain, /<h2>Your code is valid<\/h2>/);
  assert.match(plain, /This code gives you 30 days of Toone Pro\./);

  // A code that only works on an existing account: sign in only.
  const existing = render(createElement(ValidCode, {
    checked: checked({ code: "PRO30", benefit: { kind: "pro_days", value: 30 }, campaign: null, admitsSignup: false }), onCreateAccount: noop, onSignIn: noop, onChange: noop,
  }));
  assert.doesNotMatch(existing, /Create your account/);
  assert.match(existing, /This code works with an existing Toone account\. Sign in to redeem it\./);
  assert.match(existing, /<button class="primary" type="button">I already have an account — sign in<\/button>/);
});

test("success: 'Toone Pro Lifetime is active', a download button for the Mac app, and sign in with the same account", () => {
  const html = render(createElement(RedeemDone, { benefit: lifetime, entitlement: entitlement({}), email: "ana@example.com", title: "Code redeemed" }));
  assert.match(html, /<h2>Toone Pro Lifetime is active<\/h2>/);
  assert.match(html, /<a class="button primary" href="\/en\/downloads">Download Toone for Mac<\/a>/);
  assert.match(html, /Download Toone for Mac and sign in with the same account \(ana@example\.com\)\./);
  assert.doesNotMatch(html, /Code redeemed|Toone Pro is on for good/);

  const days = render(createElement(RedeemDone, {
    benefit: { kind: "pro_days", value: 30 }, entitlement: entitlement({ expires_at: "2026-12-10T00:00:00Z" }), email: "ana@example.com", title: "Code redeemed",
  }));
  assert.match(days, /<h2>Code redeemed<\/h2>/);
  assert.match(days, /role="status">Toone Pro is on until December 10, 2026\.</);
  assert.match(days, /sign in with the same account/);
});

test("both success paths share the same panel: redeeming signed in and creating an account with the code", () => {
  assert.match(read("components/account/RedeemForm.tsx"), /<RedeemDone benefit=\{step\.benefit\} entitlement=\{step\.entitlement\} email=\{email\}/);
  assert.match(read("components/account/RedeemSignupResult.tsx"), /<RedeemDone benefit=\{benefit\} entitlement=\{view\.entitlement\} email=\{session\.user\.email\}/);
});

test("the gate checks the code with the public check, remembers it for this tab only, and keeps it out of URLs, logs and analytics", () => {
  const gate = read("components/account/RedeemCodeGate.tsx");
  assert.match(gate, /await checkInvitationBenefit\(typed\)/);
  assert.match(gate, /rememberPendingCode\(typed\);/);
  assert.doesNotMatch(gate, /[?&#]code=|searchParams|history\.|location\.|console\.|umami|track\(|data-umami/);
  const page = read("components/account/RedeemPage.tsx");
  assert.match(page, /authMode === "code"[\s\S]*<RedeemCodeGate/);
  assert.match(page, /setRefCampaign\(campaignFromRef\(window\.location\.search\)\)/);
  // The AuthPage invite step: AppSumo badge and title, the launch kitty for a Product Hunt code.
  const auth = read("components/AuthPage.tsx");
  assert.match(auth, /codeCampaign\(code\) === "appsumo"/);
  assert.match(auth, /isLaunchCode \? \(\s*\/\/ eslint-disable-next-line @next\/next\/no-img-element\s*<img className="auth-kitty" src="\/assets\/launch\/ph-kitty\.png"/);
});

test("every locale carries the gate, welcome and success copy", () => {
  const keys = [
    "gateTitle", "gateSub", "gateContinue", "gateValidTitle", "gateExistingOnly", "gateCreateAccount", "gateSignInRedeem",
    "gateHaveAccount", "gateSignIn", "appsumoBadge", "appsumoTitle", "appsumoSub", "appsumoSubOther", "launchTitle", "launchSub",
    "doneLifetimeTitle", "doneSameAccount", "download",
  ];
  for (const locale of locales) {
    const t = createTranslator({ locale, messages: messages[locale], namespace: "account.redeem" });
    for (const key of keys) assert.ok(t(key as never, { email: "ana@example.com" } as never).length > 0, `${locale} ${key}`);
    assert.match(t("doneSameAccount", { email: "ana@example.com" }), /ana@example\.com/, locale);
    assert.match(t("appsumoTitle"), /Sumo-ling/, locale);
    assert.equal(t("appsumoBadge"), "AppSumo", locale);
    assert.match(t("doneLifetimeTitle"), /Toone Pro Lifetime/, locale);
    const auth = messages[locale].auth;
    assert.match(auth.appsumoAccountTitle, /Sumo-ling/, locale);
    assert.ok(auth.appsumoAccountSub && auth.appsumoBadge === "AppSumo", locale);
    if (locale !== "en") assert.notEqual(t("gateTitle"), en.account.redeem.gateTitle, `${locale} is translated`);
  }
});

test("German gate renders translated", () => {
  const html = render(createElement(RedeemCodeGate, { initialCode: null, refCampaign: null, onCreateAccount: noop, onSignIn: noop }), "de");
  assert.match(html, /<h1>Löse deinen Code ein<\/h1>/);
  assert.match(html, />Weiter<\/button>/);
});
