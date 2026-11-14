import "../account/css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mock, test } from "node:test";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AuthPage, { signInReturnPath } from "../../components/AuthPage";
import SiteHeader from "../../components/SiteHeader";
import HeroAuth from "../../components/HeroAuth";
import { LaunchProvider, LaunchSwitch } from "../../components/launch/LaunchState";
import { LAUNCH_AT_MS } from "../../lib/launch";
import { locales } from "../../i18n/routing";
import en from "../../messages/en.json";

/*
 * The launch gate in rendered HTML. Server render and hydration use the
 * launch state the page was rendered with (LaunchProvider, set by the root
 * layout), so the tests inject that state; they never edit LAUNCH_AT.
 */

function render(node: ReactNode, launched?: boolean) {
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
  const content = launched === undefined ? node : createElement(LaunchProvider, { launched, children: node });
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router as never },
    createElement(NextIntlClientProvider, { locale: "en", messages: en, timeZone: "UTC", children: content })));
}

/** The attributes of the first <a> whose text is `text` (attribute order is the renderer's). */
function anchor(html: string, text: string): Record<string, string> | null {
  for (const match of html.matchAll(/<a ([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (match[2].replace(/<[^>]+>/g, "") !== text) continue;
    return Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
  }
  return null;
}

test("LaunchSwitch: pre-launch HTML carries both variants, the launched one hidden; launched HTML only the new one", () => {
  const node = createElement(LaunchSwitch, { before: createElement("a", { href: "/old" }, "old"), after: createElement("a", { href: "/new" }, "new") });
  assert.equal(render(node, false), '<span data-launch="before"><a href="/old">old</a></span><span data-launch="after"><a href="/new">new</a></span>');
  assert.equal(render(node, true), '<a href="/new">new</a>');
  const css = fs.readFileSync("app/globals.css", "utf8");
  assert.match(css, /html:not\(\[data-launched\]\) \[data-launch="after"\],\nhtml\[data-launched\] \[data-launch="before"\] \{ display: none; \}/);
});

test("LaunchSwitch without a provider (tests, isolated renders) reads the clock", () => {
  const node = createElement(LaunchSwitch, { before: "old", after: "new" });
  mock.timers.enable({ apis: ["Date"], now: LAUNCH_AT_MS - 1 });
  try {
    assert.match(render(node), /data-launch="before"/);
    mock.timers.tick(1);
    assert.equal(render(node), "new");
  } finally {
    mock.timers.reset();
  }
});

test("header: Request Early Access before the launch, Download for Mac (download-cta) after it", () => {
  const before = render(createElement(SiteHeader, { landingPath: "/" }), false);
  assert.equal(anchor(before, "Request Early Access")?.href, "/en/request-access");
  assert.match(before, /<span data-launch="before"><a [^>]*>Request Early Access<\/a><\/span><span data-launch="after"><a [^>]*>Download for Mac<\/a><\/span>/);
  const after = render(createElement(SiteHeader, { landingPath: "/" }), true);
  assert.deepEqual(anchor(after, "Download for Mac"), {
    "data-umami-event": "download-cta", "data-umami-event-placement": "header", class: "dl", href: "/en/download",
  });
  assert.doesNotMatch(after, /request-access|Request Early Access|request-early-access/);
});

test("hero: the waitlist email form before the launch, the download call to action after it", () => {
  const before = render(createElement(HeroAuth, { audience: "personal" }), false);
  assert.match(before, /data-early-access-input/);
  const after = render(createElement(HeroAuth, { audience: "personal" }), true);
  assert.doesNotMatch(after, /data-early-access-input|\/api\/waitlist|request-access/);
  const cta = anchor(after, "Download for Mac");
  assert.equal(cta?.href, "/en/download");
  assert.equal(cta?.class, "ha-continue");
  assert.equal(cta?.["data-umami-event"], "download-cta");
  assert.match(after, /Needs macOS 14 or later and your own Claude Code or Codex\./);
});

test("open sign-up page: no code step, Google/Apple/email, sign-in and code links, nothing about requesting access", () => {
  const html = render(createElement(AuthPage, { mode: "signup" }), true);
  assert.match(html, /<h1 class="auth-title">Create your Toone account<\/h1>/);
  assert.match(html, /type="email"/);
  assert.match(html, /autoComplete="new-password"|autocomplete="new-password"/);
  assert.match(html, /minLength="8"|minlength="8"/);
  assert.doesNotMatch(html, /Access code|request-access|Request Early Access/);
  assert.match(html, /Already have an account\? <a href="\/en\/signin">Sign in<\/a>/);
  assert.match(html, /Have a code\? <a href="\/en\/early-access">Sign up with your code<\/a>/);
});

test("sign-in and code pages offer open sign-up from the launch, the access request before it", () => {
  const signinBefore = render(createElement(AuthPage, { mode: "signin" }), false);
  assert.match(signinBefore, /<span data-launch="before"><a href="\/en\/request-access">Request Early Access<\/a><\/span>/);
  const signinAfter = render(createElement(AuthPage, { mode: "signin" }), true);
  assert.match(signinAfter, /New to Toone\? <a [^>]*>Create a free account<\/a>/);
  assert.equal(anchor(signinAfter, "Create a free account")?.href, "/en/signup");
  assert.doesNotMatch(signinAfter, /request-access/);
  const inviteAfter = render(createElement(AuthPage, { mode: "invite" }), true);
  assert.match(inviteAfter, /Access code/, "code holders still sign up through /early-access");
  assert.equal(anchor(inviteAfter, "Create a free account")?.href, "/en/signup");
  assert.equal(anchor(inviteAfter, "Create a free account")?.["data-umami-event-placement"], "invite");
  assert.doesNotMatch(inviteAfter, /request-access/);
});

test("sign-up returns to the downloads grid: /downloads is a listed return path, open sign-up defaults to it", () => {
  assert.equal(signInReturnPath("?next=/downloads"), "/downloads");
  assert.equal(signInReturnPath("?next=%2Fdownloads"), "/downloads");
  assert.equal(signInReturnPath("?next=/pricing"), "/pricing");
  assert.equal(signInReturnPath("?next=https://evil.example/downloads"), null);
  assert.equal(signInReturnPath("?next=/downloads?x=1"), null);
  const source = fs.readFileSync("components/AuthPage.tsx", "utf8");
  assert.match(source, /const SIGNUP_DEFAULT_RETURN = "\/downloads";/);
});

test("the registration-closed explanation stays as a fallback", () => {
  const source = fs.readFileSync("components/AuthPage.tsx", "utf8");
  assert.match(source, /case "registration_closed":\n\s*\/\/[^\n]*\n\s*return t\("errRegistrationClosed"\);/);
});

test("every launched string exists, filled, in all 8 locales, with the English placeholders and no em dash", () => {
  type Tree = { [key: string]: string | Tree };
  const pick = (tree: Tree, path: string) => path.split(".").reduce<string | Tree | undefined>((node, key) => (node as Tree | undefined)?.[key], tree) as string | undefined;
  const keys = [
    "nav.downloadLaunched", "landing.heroDownload", "landing.heroLaunchedNote",
    "faq.q6Launched", "faq.a6Launched", "faq.q8Launched", "faq.a8Launched",
    "auth.signupTitle", "auth.signupSub", "auth.createAccount", "auth.signupHaveCode", "auth.signupUseCode",
    "auth.signupCodePh", "auth.signupCodeSent", "auth.signupCodeBtn", "auth.signupChangeEmail", "auth.signupCodeWrong",
    "auth.errEmailSignupUnavailable", "auth.downloadAccessTitle", "auth.downloadAccessSub",
    "billing.pricing.signupLine", "billing.pricing.signupLink", "explore.getTooneLaunched", "article.continueActionLaunched",
  ];
  const tokens = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const locale of locales) {
    const messages = JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8")) as Tree;
    for (const key of keys) {
      const text = pick(messages, key);
      assert.ok(typeof text === "string" && text.trim(), `${locale}.${key}`);
      assert.deepEqual(tokens(text), tokens(pick(en as unknown as Tree, key) as string), `${locale}.${key} placeholders`);
      assert.doesNotMatch(text, /—/, `${locale}.${key} has an em dash`);
      assert.doesNotMatch(text, /reliable|secure|deterministic/i, `${locale}.${key}`);
    }
    // The pre-launch strings are kept, so a pre-launch build stays truthful until the launch.
    assert.ok(pick(messages, "nav.download") && pick(messages, "billing.pricing.inviteOnly") && pick(messages, "faq.a6"), locale);
  }
});
