import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { NextRequest } from "next/server";
import proxy from "../../proxy";
import { locales } from "../../i18n/routing";
import { checkoutReturnMetadata } from "../../app/[locale]/success/return-metadata";
import CheckoutReturn from "../../components/billing/CheckoutReturn";
import {
  CHECKOUT_SESSION_GLOBAL,
  CHECKOUT_SESSION_STORAGE_KEY,
  STRIP_SESSION_ID_SCRIPT,
  TOONE_PRO_SUCCESS_URL,
  cameFromApp,
  forgetCheckoutSession,
  offersAppReturn,
  returnPollConfig,
  returnReceipt,
  returnView,
  takeCheckoutSessionId,
} from "../../components/billing/CheckoutReturn.helpers";
import { FROM_APP_STORAGE_KEY } from "../../components/billing/PricingPlans.helpers";
import { legalInvoiceCopy } from "../../components/billing/legal-invoice";
import { pollCheckoutReturn } from "../../lib/billing/checkout-return";
import { recallCheckoutSession, recallOrderRef, rememberCheckoutSession, rememberOrderRef } from "../../lib/billing/order-ref";
import { createTranslator } from "next-intl";
import { normalizeEntitlement } from "../../lib/billing/api";
import messages from "../../messages/en.json" with { type: "json" };

const read = (path: string) => fs.readFileSync(path, "utf8");

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
}

function fakeWindow(href: string, extra: Record<string, unknown> = {}) {
  const win = {
    location: { href },
    replaced: [] as string[],
    history: {
      state: null as unknown,
      replaceState(_data: unknown, _unused: string, url?: string | URL | null) {
        win.replaced.push(String(url));
        win.location.href = new URL(String(url), href).href;
      },
    },
    sessionStorage: memoryStorage(),
    ...extra,
  };
  return win;
}

/* ---- metadata */

test("success and cancel are noindex, nofollow, no-referrer, self-canonical", () => {
  for (const locale of locales) {
    for (const path of ["/success", "/cancel"] as const) {
      const meta = checkoutReturnMetadata(locale, path, "Title");
      assert.deepEqual(meta.robots, { index: false, follow: false }, `${locale}${path}`);
      assert.equal(meta.referrer, "no-referrer");
      assert.equal(meta.alternates?.canonical, `https://trytoone.com/${locale}${path}`);
    }
  }
  assert.match(read("app/[locale]/success/page.tsx"), /checkoutReturnMetadata\(locale, "\/success"/);
  assert.match(read("app/[locale]/cancel/page.tsx"), /checkoutReturnMetadata\(locale, "\/cancel"/);
});

/* ---- the locale redirect keeps the checkout id */

test("an unprefixed /success keeps ?session_id= through the locale redirect", () => {
  const run = (path: string, headers: Record<string, string>) =>
    proxy(new NextRequest(new URL(path, "https://trytoone.com"), { headers }));
  const cases: Array<[Record<string, string>, string]> = [
    [{ cookie: "toone_locale=de", "accept-language": "pt-BR" }, "de"],
    [{ "accept-language": "pt-BR" }, "pt"],
    [{}, "en"],
  ];
  for (const [headers, locale] of cases) {
    const success = run("/success?session_id=cs_test_a1B2", headers);
    assert.equal(success.status, 307, JSON.stringify(headers));
    assert.equal(success.headers.get("location"), `https://trytoone.com/${locale}/success?session_id=cs_test_a1B2`);
    const cancel = run("/cancel", headers);
    assert.equal(cancel.headers.get("location"), `https://trytoone.com/${locale}/cancel`);
  }
  for (const locale of locales) {
    const prefixed = run(`/${locale}/success?session_id=cs_test_a1B2`, {});
    assert.equal(prefixed.headers.get("location"), null, locale);
  }
});

/* ---- session_id is removed before anything else runs */

test("the inline script removes session_id from the address and keeps it in memory", () => {
  const win = fakeWindow("https://trytoone.com/en/success?session_id=cs_test_a1B2&return=app#top");
  vm.runInNewContext(STRIP_SESSION_ID_SCRIPT, { window: win, URL });
  assert.deepEqual(win.replaced, ["/en/success?return=app#top"]);
  assert.equal((win as Record<string, unknown>)[CHECKOUT_SESSION_GLOBAL], "cs_test_a1B2");

  const clean = fakeWindow("https://trytoone.com/en/success");
  vm.runInNewContext(STRIP_SESSION_ID_SCRIPT, { window: clean, URL });
  assert.deepEqual(clean.replaced, []);
  assert.equal(CHECKOUT_SESSION_GLOBAL in clean, false);
});

test("the success page renders the strip script before the client component and never reads the query on the server", () => {
  const page = read("app/[locale]/success/page.tsx");
  const script = page.indexOf("STRIP_SESSION_ID_SCRIPT }}");
  const client = page.indexOf("<CheckoutReturn");
  assert.ok(script > 0 && client > script, "script first");
  assert.doesNotMatch(page, /searchParams/);
  const component = read("components/billing/CheckoutReturn.tsx");
  assert.match(component, /takeCheckoutSessionId\(window\)/);
});

test("the page takes the id from the script, validates it and remembers it for a reload", () => {
  const win = fakeWindow("https://trytoone.com/en/success", { [CHECKOUT_SESSION_GLOBAL]: "cs_test_a1B2" });
  assert.equal(takeCheckoutSessionId(win), "cs_test_a1B2");
  assert.equal(CHECKOUT_SESSION_GLOBAL in win, false, "the in-memory copy is consumed");
  assert.equal(win.sessionStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY), "cs_test_a1B2");

  const reload = fakeWindow("https://trytoone.com/en/success", { sessionStorage: win.sessionStorage });
  assert.equal(takeCheckoutSessionId(reload), "cs_test_a1B2");
  forgetCheckoutSession(reload);
  assert.equal(takeCheckoutSessionId(fakeWindow("https://trytoone.com/en/success", { sessionStorage: reload.sessionStorage })), null);

  const forged = fakeWindow("https://trytoone.com/en/success", { [CHECKOUT_SESSION_GLOBAL]: "../../admin" });
  assert.equal(takeCheckoutSessionId(forged), null);
  assert.equal(forged.sessionStorage.items.size, 0);
});

test("without the script (client navigation) the id is still stripped from the address", () => {
  const win = fakeWindow("https://trytoone.com/en/success?session_id=cs_test_a1B2");
  assert.equal(takeCheckoutSessionId(win), "cs_test_a1B2");
  assert.deepEqual(win.replaced, ["/en/success"]);
  assert.equal(takeCheckoutSessionId(undefined), null);
});

test("'Return to Toone' is offered only when the app started the purchase", () => {
  const win = fakeWindow("https://trytoone.com/en/success");
  assert.equal(cameFromApp("", win), false);
  assert.equal(cameFromApp("?return=app", win), true);
  assert.equal(cameFromApp("?return=web", win), false);
  win.sessionStorage.setItem(FROM_APP_STORAGE_KEY, "app");
  assert.equal(cameFromApp("", win), true);
  assert.equal(TOONE_PRO_SUCCESS_URL, "toone://pro/success");
});

test("an app purchase offers 'Return to Toone' without a web session, in every view after payment", async () => {
  for (const view of ["active", "processing", "timeout", "unreachable", "signed_out", "wrong_account"] as const) {
    assert.equal(offersAppReturn(view, true), true, view);
    assert.equal(offersAppReturn(view, false), false, `${view}: web purchases never get the deep link`);
  }
  for (const view of ["pending", "expired", "none", "already_pro"] as const) {
    assert.equal(offersAppReturn(view, true), false, view);
  }
  const page = read("components/billing/CheckoutReturn.tsx");
  // Signed out after an app purchase: the neutral return view; sign-in only on request.
  assert.match(page, /if \(view === "signed_out" && \(!fromApp \|\| signInRequested\)\)/);
  const signedOut = page.slice(page.indexOf('{view === "signed_out" && ('), page.indexOf('{view === "none" && ('));
  assert.match(signedOut, /t\("appReturnTitle"\)[\s\S]*\{appReturn\}[\s\S]*setSignInRequested\(true\)[\s\S]*t\("appSignIn"\)/);
  for (const view of ["processing", "timeout", "unreachable", "wrong_account"]) {
    const start = page.indexOf(`{view === "${view}" && (`);
    const block = page.slice(start, page.indexOf("</>", start));
    assert.match(block, /\{appReturn\}/, view);
  }
  const t = createTranslator({ locale: "en", messages, namespace: "billing.success" });
  assert.equal(t("appReturnTitle"), "Return to Toone");
  assert.doesNotMatch(t("appReturnSub"), /payment (went through|received)/, "never claims a payment it has not seen");
  for (const locale of locales) {
    const local = (await import(`../../messages/${locale}.json`, { with: { type: "json" } })).default.billing.success;
    for (const key of ["appReturnTitle", "appReturnSub", "appSignIn"]) assert.ok(local[key]?.trim(), `${locale}.${key}`);
  }
});

/* ---- the URL is never proof */

const FREE = normalizeEntitlement({ plan: "free", free_routine_creations: { used: 2, limit: 2 } });
const PRO = normalizeEntitlement({ plan: "pro", source: "subscription", status: "active", billing_provider: "stripe" });

function clock() {
  let now = 0;
  return { now: () => now, sleep: async (ms: number) => { now += ms; } };
}

test("a session the server calls complete and entitled is not Pro while the entitlement says free", async () => {
  const time = clock();
  const state = await pollCheckoutReturn({
    token: "tok",
    sessionId: "cs_test_a1B2",
    fetchEntitlement: async () => FREE,
    fetchCheckoutStatus: async () => ({ status: "complete", entitled: true, order_ref: "TOONE-ABCDEFGH12", legal_invoice: null }),
    now: time.now,
    sleep: time.sleep,
  });
  assert.equal(returnView(state, true), "timeout");
});

test("views: no checkout and Pro reads 'you have Pro'; no checkout and free reads 'nothing to confirm'", async () => {
  const time = clock();
  const pro = await pollCheckoutReturn({ token: "tok", sessionId: null, fetchEntitlement: async () => PRO, now: time.now, sleep: time.sleep, config: returnPollConfig(false) });
  assert.equal(pro.kind, "active");
  assert.equal(returnView(pro, false), "already_pro", "a direct visit never shows the purchase message");
  assert.equal(returnView(pro, true), "active");
  let calls = 0;
  const free = await pollCheckoutReturn({
    token: "tok", sessionId: null, fetchEntitlement: async () => { calls += 1; return FREE; },
    now: time.now, sleep: time.sleep, config: returnPollConfig(false),
  });
  assert.equal(returnView(free, false), "none");
  assert.equal(calls, 1, "one answer is enough without a checkout");
  assert.equal(returnView({ kind: "signed_out" }, true), "signed_out");
  assert.equal(returnView({ kind: "wrong_account" }, true), "wrong_account");
  assert.equal(returnView({ kind: "error", reason: "expired", failure: null }, true), "expired");
  assert.equal(returnView({ kind: "error", reason: "unreachable", failure: null }, true), "unreachable");
});

test("the already-Pro view is neutral and links to the account page", () => {
  const success = messages.billing.success;
  assert.equal(success.alreadyProTitle, "You have Toone Pro");
  assert.doesNotMatch(`${success.alreadyProTitle} ${success.alreadyProSub}`, /receipt|payment|is on/i);
  const page = read("components/billing/CheckoutReturn.tsx");
  assert.match(page, /view === "already_pro" && \(\s*<>\s*<h1>\{t\("alreadyProTitle"\)\}<\/h1>/);
  assert.match(page, /<Link className="pro-return-button" href="\/account">\{t\("seeAccount"\)\}<\/Link>/);
});

test("wrong account: names only the signed-in account, never the payer, and offers a switch", async () => {
  const t = createTranslator({ locale: "en", messages, namespace: "billing.success" });
  assert.equal(t("wrongAccountTitle"), "This purchase belongs to a different Toone account");
  assert.equal(t("wrongAccountSub"), "Sign in with the account you paid with to see it.");
  assert.equal(t("wrongAccountCurrent", { email: "me@example.com" }), "You're signed in as me@example.com.");
  const page = read("components/billing/CheckoutReturn.tsx");
  const block = page.slice(page.indexOf('view === "wrong_account"'), page.indexOf('view === "none"'));
  assert.ok(block.length > 0, "the view exists");
  // No receipt, order or invoice: the server returns nothing about another account's checkout.
  assert.doesNotMatch(block, /receiptBlock|orderRef|invoice/);
  // The only email shown is the signed-in session's.
  assert.deepEqual([...block.matchAll(/email: ([\w.?]+)/g)].map(match => match[1]), ["session.user.email"]);
  // Switching signs out (the sign-in form follows); the checkout id stays for the right account.
  assert.match(block, /onClick=\{\(\) => \{ setSignInRequested\(true\); endSession\(\); \}\}>\s*\{t\("switchAccount"\)\}/);
  assert.match(page, /next\.kind === "active" \|\| \(next\.kind === "error" && next\.reason === "expired"\)/, "wrong_account keeps the checkout remembered");
  // Every locale has the copy (ru shows the English billing strings by design).
  for (const locale of locales) {
    const local = (await import(`../../messages/${locale}.json`, { with: { type: "json" } })).default.billing.success;
    for (const key of ["wrongAccountTitle", "wrongAccountSub", "wrongAccountCurrent", "switchAccount"]) {
      assert.ok(local[key]?.trim(), `${locale}.${key}`);
    }
    if (locale !== "en" && locale !== "ru") assert.notEqual(local.wrongAccountTitle, t("wrongAccountTitle"), `${locale} translated`);
  }
});

test("the server HTML of the success page only says 'confirming'", () => {
  const html = renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale: "en", messages, timeZone: "UTC", children: createElement(CheckoutReturn),
  }));
  assert.match(html, /Confirming your payment/);
  assert.doesNotMatch(html, /Toone Pro is on/);
  assert.doesNotMatch(html, /session_id|cs_test/);
});

test("the cancel page says no charge was made and links back to pricing", () => {
  assert.match(messages.billing.cancel.sub, /No charge was made/);
  assert.match(read("app/[locale]/cancel/page.tsx"), /<Link className="pro-return-button" href="\/pricing">/);
});

/* ---- slow payments, order reference, legal invoice */

test("processing: a delayed payment shows its own view with the order reference", () => {
  const state = { kind: "processing", orderRef: "TOONE-SLOWPAY0001", legalInvoice: null } as const;
  assert.equal(returnView(state, true), "processing");
  assert.deepEqual(returnReceipt(state), { orderRef: "TOONE-SLOWPAY0001", legalInvoice: null });
  assert.equal(returnReceipt({ kind: "timeout" }), null);
  assert.equal(
    messages.billing.success.processingSub,
    "Your payment is processing; Pro turns on when it clears, and we email you the purchase confirmation then. If the payment doesn't go through, you aren't charged.",
  );
  // A processing checkout is not forgotten, so a reload checks it again.
  assert.match(read("components/billing/CheckoutReturn.tsx"), /if \(next\.kind === "active" \|\| \(next\.kind === "error" && next\.reason === "expired"\)\)/);
});

test("the success page names the order reference and the contract form", () => {
  const t = createTranslator({ locale: "en", messages, namespace: "billing.success" });
  const html = renderToStaticMarkup(createElement("p", null,
    t.rich("orderRef", { ref: "TOONE-ABCDEFGH12", code: (chunks) => createElement("code", null, chunks) })));
  assert.equal(html, "<p>Order reference: <code>TOONE-ABCDEFGH12</code></p>");
  assert.match(t("orderRefNote", { link: (c: string) => c } as never), /contract form/);
});

test("legal invoice copy: pending, issued with number and ATCUD, tolerated when absent", () => {
  const t = createTranslator({ locale: "en", messages, namespace: "billing.success" });
  const say = (invoice: Parameters<typeof legalInvoiceCopy>[0]) => {
    const copy = legalInvoiceCopy(invoice);
    return copy && ("values" in copy ? t(copy.key, copy.values) : t(copy.key));
  };
  assert.equal(say(null), null);
  assert.equal(say(undefined), null);
  assert.equal(say({ status: "pending", number: null, atcud: null }), "Legal invoice: being issued (emailed to you).");
  assert.equal(say({ status: "issued", number: "FR 2026/7", atcud: "JJ7K2M4P-7" }), "Legal invoice: FR 2026/7 · ATCUD JJ7K2M4P-7");
  assert.equal(say({ status: "issued", number: "FR 2026/7", atcud: null }), "Legal invoice: FR 2026/7");
  assert.equal(say({ status: "issued", number: null, atcud: null }), "Legal invoice: issued (emailed to you).");
});

test("the order reference is remembered per account for the account page, canonical and validated", () => {
  const storage = memoryStorage();
  rememberOrderRef("usr_1", "toone-abcdefgh12", storage);
  assert.equal(recallOrderRef("usr_1", storage), "TOONE-ABCDEFGH12");
  assert.equal(recallOrderRef("usr_2", storage), null);
  rememberOrderRef("usr_2", "not-a-ref", storage);
  rememberOrderRef("", "TOONE-ABCDEFGH12", storage);
  assert.equal(recallOrderRef("usr_2", storage), null);
  assert.equal(storage.items.size, 1);
  storage.setItem("toone.pro.order:usr_3", "<script>");
  assert.equal(recallOrderRef("usr_3", storage), null);
  assert.equal(recallOrderRef("usr_1", null), null);
});

test("the last checkout session is remembered per account for the account page's legal invoice", () => {
  const storage = memoryStorage();
  rememberCheckoutSession("usr_1", "cs_test_a1B2c3", storage);
  assert.equal(recallCheckoutSession("usr_1", storage), "cs_test_a1B2c3");
  assert.equal(recallCheckoutSession("usr_2", storage), null);
  rememberCheckoutSession("usr_2", "cs_test_<script>", storage);
  rememberCheckoutSession("usr_2", null, storage);
  rememberCheckoutSession("", "cs_test_a1B2c3", storage);
  assert.equal(recallCheckoutSession("usr_2", storage), null);
  storage.setItem("toone.pro.checkout:usr_3", "javascript:alert(1)");
  assert.equal(recallCheckoutSession("usr_3", storage), null);
  assert.equal(recallCheckoutSession("usr_1", null), null);
  const page = read("components/billing/CheckoutReturn.tsx");
  assert.match(page, /rememberCheckoutSession\(userId, checkout\.id\)/);
});
