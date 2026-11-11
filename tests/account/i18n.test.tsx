import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AccountPage from "../../components/account/AccountPage";
import RedeemPage from "../../components/account/RedeemPage";
import CodesAdminPage from "../../components/admin/CodesAdminPage";
import { accountShellMessages } from "../../components/account/AccountMessages";
import AuthPage from "../../components/AuthPage";
import { locales } from "../../i18n/routing";
import en from "../../messages/en.json";

type Tree = { [key: string]: string | Tree };
const messages = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8"))]));

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.fromEntries(Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[prefix + key, value]] : Object.entries(flatten(value, `${prefix}${key}.`))));
}
const placeholders = (message: string) => [...message.matchAll(/\{(\w+)\s*[,}]/g)].map((match) => match[1]).sort();
const tags = (message: string) => [...message.matchAll(/<(\w+)>/g)].map((match) => match[1]).sort();

const english = flatten(en.account as Tree);

test("account.* has the same keys, placeholders and tags in all 8 locales", () => {
  assert.equal(locales.length, 8);
  for (const locale of locales) {
    const local = flatten(messages[locale].account as Tree);
    assert.deepEqual(Object.keys(local).sort(), Object.keys(english).sort(), locale);
    for (const [key, message] of Object.entries(english)) {
      assert.deepEqual(placeholders(local[key]), placeholders(message), `${locale} ${key} placeholders`);
      assert.deepEqual(tags(local[key]), tags(message), `${locale} ${key} tags`);
      assert.ok(local[key].trim(), `${locale} ${key} is empty`);
    }
  }
});

const SAMPLE = { email: "you@example.com", date: "1 December 2026", at: "10 November 2026, 12:00", benefit: "30 days of Toone Pro",
  name: "Ana", used: 1, limit: 2, days: 30, count: 3 };

test("every account message formats in every locale (ICU syntax, plurals, rich links)", () => {
  for (const locale of locales) {
    const t = createTranslator({ locale, messages: messages[locale], namespace: "account" });
    for (const key of Object.keys(english)) {
      const message = english[key];
      if (tags(message).length) {
        const out = t.rich(key as never, { ...SAMPLE, link: (chunks: ReactNode) => createElement("a", null, chunks) } as never);
        assert.ok(renderToStaticMarkup(createElement("p", null, out)).includes("<a>"), `${locale} ${key}`);
      } else {
        assert.doesNotThrow(() => t(key as never, SAMPLE as never), `${locale} ${key}`);
      }
    }
  }
});

test("the invite page's benefit line reads naturally", () => {
  const t = createTranslator({ locale: "en", messages: en, namespace: "account" });
  assert.equal(t("invite.benefit", { benefit: t("redeem.benefitProDays", { days: 30 }) }), "This code also gives you 30 days of Toone Pro.");
  assert.equal(t("invite.benefit", { benefit: t("redeem.benefitFreeCreations", { count: 1 }) }), "This code also gives you 1 more free routine creation.");
  const ru = createTranslator({ locale: "ru", messages: messages.ru, namespace: "account" });
  assert.equal(ru("redeem.benefitProDays", { days: 5 }), "Toone Pro на 5 дней");
  assert.equal(ru("redeem.benefitProDays", { days: 21 }), "Toone Pro на 21 день");
});

function render(node: ReturnType<typeof createElement>) {
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router as never },
    createElement(NextIntlClientProvider, { locale: "en", messages: en, timeZone: "UTC", children: node })));
}

test("gated pages render only a neutral checking state on the server", () => {
  for (const page of [AccountPage, RedeemPage, CodesAdminPage]) {
    const html = render(createElement(page));
    assert.match(html, /role="status">Checking your account…</, page.name);
    assert.doesNotMatch(html, /Manage subscription|Redeem|New code|Page not found|type="password"/, page.name);
  }
});

test("the invite page still renders (the benefit line appears once a code is verified)", () => {
  const html = render(createElement(AuthPage, { mode: "invite" }));
  assert.match(html, /auth-card/);
  assert.doesNotMatch(html, /class="auth-benefit"/);
});

test("the root layout ships only the account keys used outside the account pages", () => {
  const shell = flatten(accountShellMessages(en.account) as Tree);
  assert.deepEqual(Object.keys(shell).sort(), [
    "invite.benefit", "invite.benefitShared", "links.account", "links.codesAdmin",
    "redeem.benefitFreeCreations", "redeem.benefitProDays", "redeem.benefitProLifetime", "redeem.benefitUnknown",
  ]);
  assert.match(fs.readFileSync("app/[locale]/layout.tsx", "utf8"), /account: accountShellMessages\(messages\.account\)/);
  for (const route of ["account", "redeem", "cancel-contract"]) {
    assert.match(fs.readFileSync(`app/[locale]/${route}/page.tsx`, "utf8"), /<AccountMessages>/, route);
  }
});
