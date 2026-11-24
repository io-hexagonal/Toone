import "../account/css-modules";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import ConsentScreen, { MAC_GONE_NOTICE, type ConsentState, type MacsView } from "../../components/connect/ConsentScreen";
import ConnectPage, { ConnectSignIn } from "../../components/connect/ConnectPage";
import type { ConsentRequest } from "../../lib/connect/consent";
import en from "../../messages/en.json";

/* /connect, every state as the person sees it. */

function render(node: ReactElement) {
  const router = { push() {}, replace() {}, prefetch() {}, back() {}, forward() {}, refresh() {} };
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router as never },
    createElement(NextIntlClientProvider, { locale: "en", messages: en, timeZone: "UTC", children: node })));
}
/** Visible text, tags dropped and entities decoded, for wording checks. */
function text(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/[“”]/g, '"').replace(/\s+/g, " ").replace(/ ([.,])/g, "$1").trim();
}

const claude: ConsentRequest = {
  id: "car_abc234", clientName: "Claude", redirectHost: "claude.ai", clientKind: "claude",
  scopes: ["read", "act"], expiresAt: "2026-11-24T18:40:00Z", eligible: true, ineligibleReason: null, macChoice: false,
};
const studio = { id: "mac_1", name: "Ana's Mac Studio" };
const air = { id: "mac_2", name: "MacBook Air" };

function screen(patch: Partial<Extract<ConsentState, { kind: "request" }>> = {}, request: Partial<ConsentRequest> = {}, macs: MacsView = { status: "list", macs: [studio] }) {
  const state: ConsentState = {
    kind: "request", request: { ...claude, ...request }, email: "ana@example.com", macs,
    allowAct: true, macId: null, armed: true, busy: null, notice: null, ...patch,
  };
  return render(createElement(ConsentScreen, { state }));
}

/** Words a public page must not show (owner rule) or that only mean something to engineers. */
const INTERNALS = /ledger|prompt|engine setting|internal agent|\bagents?\b|\bMCP\b|OAuth|\bscopes?\b|\bgrant\b|\btoken\b|car_|redirect_to|tc_ac_/i;

test("signed out: the site's sign-in, titled for connecting, with the request kept in the page", () => {
  const html = render(createElement(ConnectSignIn, { sessionEnded: false, onAuthenticated() {} }));
  assert.match(html, /<h1 class="auth-title">Sign in to connect<\/h1>/);
  assert.doesNotMatch(html, /<a /, "no way off into the site: no logo link, Create account, Forgot password or account links");
  assert.doesNotMatch(html, /create-account|reset-password|pricing|\/account/);
  assert.doesNotMatch(html, /class="auth-google-soon"|>Soon</i, "no placeholder for a sign-in method that is not live");
  assert.doesNotMatch(html, /class="auth-or"/, "nothing to put 'or' between when no provider is configured");
  assert.match(text(html), /You'll see what is being connected before anything happens/);
  assert.match(html, /type="password"/, "email and password");
  assert.match(html, /auth-card/);
  const ended = render(createElement(ConnectSignIn, { sessionEnded: true, onAuthenticated() {} }));
  assert.match(text(ended), /Your session ended\. Sign in again to finish connecting\./);
});

test("the page itself renders only a neutral state on the server, and an incomplete link without any request", () => {
  const html = render(createElement(ConnectPage, { requestId: "car_abc234" }));
  assert.match(html, /role="status">Checking your account…</);
  assert.doesNotMatch(html, /Allow|type="password"/);
  const incomplete = text(render(createElement(ConnectPage, { requestId: null })));
  assert.match(incomplete, /This link is incomplete/);
  assert.match(incomplete, /Go back to the app you came from and connect again\./);
});

test("Claude, one Mac: who asks, the account, what it can do, which Mac, how it works, Allow and Don't allow", () => {
  const html = screen();
  const words = text(html);
  assert.match(html, /<h1>Connect Claude to your Toone<\/h1>/);
  assert.match(words, /Claude \(claude\.ai\) wants to use Toone on your Mac\./);
  assert.match(words, /Signed in as ana@example\.com\. Not you\? Switch account/);
  assert.match(words, /See your routines, runs, what is waiting for you, record books, and conversations in your Toone projects\./);
  assert.match(html, /<input type="checkbox" checked=""/);
  assert.match(words, /Start, pause, continue, cancel and answer routines, draft new routines and install shared ones from Explore\. Toone still asks you on your Mac before each of these\./);
  assert.match(words, /Claude will reach Ana's Mac Studio, where Toone is open now\./);
  assert.match(words, /go to Toone's servers and on to the Toone app on your Mac.*without storing their content/);
  assert.match(words, /You can disconnect at any time in the Toone app \(Settings › Connected Apps\)\./);
  assert.match(html, /href="\/en\/privacy#claude-connector"/);
  assert.match(html, /<button type="button" class="primary"[^>]*>Allow<\/button>/);
  assert.match(html, />Don't allow<\/button>|>Don&#x27;t allow<\/button>/);
  assert.doesNotMatch(html, /disabled=""/);
  assert.match(words, /Only allow this if you just clicked Connect in Claude in this browser\./);
  assert.doesNotMatch(html, /<a href="\/en"/, "the logo is not a link");
  assert.doesNotMatch(words, /This is not Claude/);
});

test("Allow stays disabled until the page has had the person's attention (Don't allow does not wait)", () => {
  const html = screen({ armed: false });
  assert.match(html, /<button type="button" class="primary" disabled=""[^>]*>Allow<\/button>/);
  assert.doesNotMatch(html, /<button type="button" disabled=""[^>]*>Don(&#x27;|')t allow/);
});

test("the act option appears only when it was asked for, unticked when the person unticked it", () => {
  assert.doesNotMatch(screen({}, { scopes: ["read"] }), /type="checkbox"/);
  assert.match(screen({ allowAct: false }), /<input type="checkbox"\/?>|<input type="checkbox" value/);
  assert.doesNotMatch(screen({ allowAct: false }), /checked=""/);
});

test("no Mac reachable: says to open Toone and sign in, and still lets the person allow", () => {
  const html = screen({}, {}, { status: "list", macs: [] });
  const words = text(html);
  assert.match(words, /Toone isn't open on any of your Macs right now\./);
  assert.match(words, /Open Toone on your Mac and sign in\./);
  assert.match(html, />Allow</);
});

test("several Macs: all listed, the most recent one marked as the one used by default", () => {
  const html = screen({}, {}, { status: "list", macs: [studio, air] });
  const words = text(html);
  assert.match(html, /<h2 id="connect-macs">Your Macs<\/h2>/);
  assert.match(words, /Toone is open on 2 of your Macs\. Claude uses the one you used most recently, unless you name another one when you ask\./);
  assert.match(words, /Ana's Mac Studio Most recent MacBook Air/);
  assert.equal(html.match(/Most recent/g)?.length, 1);
});

/** Whether the radio for `id` is the checked one. */
const checkedMac = (html: string, id: string) =>
  [...html.matchAll(/<input type="radio"[^>]*>/g)].some(([tag]) => tag.includes(`value="${id}"`) && tag.includes('checked=""'));

test("the API takes a choice and the account has several Macs: each by name, then the default 'The Mac I used last'", () => {
  const macs: MacsView = { status: "choice", macs: [studio, air], open: ["mac_1"] };
  const html = screen({}, { macChoice: true }, macs);
  const words = text(html);
  assert.match(words, /Your Macs Reach Toone on: Ana's Mac Studio Open now MacBook Air The Mac I used last/);
  assert.match(html, /role="radiogroup" aria-labelledby="connect-mac-choice"/);
  assert.equal(html.match(/type="radio"/g)?.length, 3);
  assert.equal(checkedMac(html, ""), true, "the default sends no Mac");
  assert.equal(checkedMac(html, "mac_1"), false);
  assert.doesNotMatch(html, /<legend/, "no legend: Safari on iPhone renders it badly");
  const picked = screen({ macId: "mac_2" }, { macChoice: true }, macs);
  assert.equal(checkedMac(picked, "mac_2"), true);
  assert.equal(checkedMac(picked, ""), false);
  assert.match(screen({ busy: "allow" }, { macChoice: true }, macs), /type="radio"[^>]*disabled=""/);
  assert.match(text(screen({}, { macChoice: true }, { ...macs, open: [] })), /Toone isn't open on any of your Macs right now\. Open Toone on your Mac and sign in\./);
});

test("a refused Mac asks to choose again", () => {
  const html = render(createElement(ConsentScreen, {
    state: { kind: "request", request: { ...claude, macChoice: true }, email: "ana@example.com",
      macs: { status: "choice", macs: [studio, air], open: [] }, allowAct: true, macId: null, armed: true, busy: null, notice: null },
    macNotice: MAC_GONE_NOTICE,
  }));
  assert.match(text(html), /That Mac is no longer available\. Choose again\./);
});

test("no picker without the API's say-so", () => {
  assert.doesNotMatch(screen({}, { macChoice: false }, { status: "list", macs: [studio, air] }), /type="radio"/);
  assert.doesNotMatch(screen({}, { macChoice: true }, { status: "list", macs: [studio] }), /type="radio"/);
});

test("ChatGPT, vouched for by its own callbacks: named like Claude, no warning", () => {
  const html = screen({}, { clientKind: "chatgpt", clientName: "ChatGPT", redirectHost: "chatgpt.com" });
  const words = text(html);
  assert.match(html, /<h1>Connect ChatGPT to your Toone<\/h1>/);
  assert.match(words, /ChatGPT \(chatgpt\.com\) wants to use Toone on your Mac\./);
  assert.match(words, /What ChatGPT will be able to do/);
  assert.match(words, /ChatGPT's requests go to Toone's servers/);
  assert.doesNotMatch(words, /This is not Claude/);
});

test("the Mac section waits quietly, and disappears when the list cannot be read", () => {
  assert.match(screen({}, {}, { status: "loading" }), /role="status">Looking for your Mac…/);
  assert.doesNotMatch(screen({}, {}, { status: "hidden" }), /connect-macs/);
});

test("no Toone Pro: one plain sentence and Don't allow; no link, upgrade, prices or checkout", () => {
  const html = screen({}, { eligible: false, ineligibleReason: "subscription_required" }, { status: "hidden" });
  const words = text(html);
  assert.match(words, /Connecting an assistant needs Toone Pro\. Your account doesn't have it\./);
  const links = [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(links, [], "no link at all: no plans or pricing inside an assistant's flow");
  assert.doesNotMatch(words, /upgrade|buy|checkout|subscribe|trial|€|\$|\/ ?month|per month|year/i);
  assert.doesNotMatch(html, />Allow</);
  assert.match(html, /Don(&#x27;|')t allow/);
  assert.doesNotMatch(words, /See your routines/, "no promise of what it would do");
});

test("outside the early access list: not available for this account yet, Don't allow only", () => {
  const html = screen({}, { eligible: false, ineligibleReason: "not_allowed" }, { status: "hidden" });
  assert.match(text(html), /Connecting Claude is not available for this account yet\./);
  assert.doesNotMatch(html, />Allow</);
  assert.match(html, /Don(&#x27;|')t allow/);
});

test("an app on this computer: never shown by its own name alone", () => {
  const html = screen({}, { clientKind: "local", clientName: "Claude Code", redirectHost: "localhost" });
  const words = text(html);
  assert.match(html, /<h1>Connect an app to your Toone<\/h1>/);
  assert.match(words, /An app on this computer \(calling itself "Claude Code"\) wants to use Toone on your Mac\./);
  assert.match(words, /This app will reach Ana's Mac Studio/);
  assert.match(words, /Its requests go to Toone's servers/);
  assert.doesNotMatch(words, /This is not Claude/);
});

test("anything else: named with its address and a warning that it is not Claude, even if it calls itself Claude", () => {
  const words = text(screen({}, { clientKind: "other", clientName: "Claude", redirectHost: "claude-helper.example" }));
  assert.match(words, /"Claude" at claude-helper\.example wants to use Toone on your Mac\./);
  assert.match(words, /This is not Claude\. Only allow it if you started this connection yourself and trust claude-helper\.example\./);
  assert.doesNotMatch(words, /^.*Connect Claude to your Toone/);
});

test("while a decision is on its way both buttons and the option are disabled", () => {
  const html = screen({ busy: "allow" });
  assert.match(html, /disabled="" aria-busy="true">Allowing…<\/button>/);
  assert.match(html, /disabled="" aria-busy="false">Don(&#x27;|')t allow<\/button>/);
  assert.match(html, /type="checkbox" disabled="" checked=""/);
});

test("a decision that can be tried again: one plain sentence, buttons back", () => {
  const cases = [
    ["rate-limited", /Too many attempts in a short time\. Wait a minute, then try again\./],
    ["page-error", /Something went wrong on this page\. Reload it and try again\./],
    ["unreachable", /Toone could not be reached\. Check your connection and try again\./],
  ] as const;
  for (const [notice, expected] of cases) {
    const html = screen({ notice });
    assert.match(html, /role="alert"/, notice);
    assert.match(text(html), expected, notice);
    assert.doesNotMatch(html, /disabled=""/, notice);
  }
});

test("server errors that end the page each say one plain thing", () => {
  const ended = (reason: Extract<ConsentState, { kind: "ended" }>["reason"], clientKind: "claude" | "local" | null = "claude") =>
    render(createElement(ConsentScreen, { state: { kind: "ended", reason, clientKind }, onRetry() {} }));
  assert.match(text(ended("expired")), /It expired or was already used\. Go back to Claude and connect again\./);
  assert.match(text(ended("expired", null)), /Go back to the app you came from and connect again\./);
  assert.match(text(ended("unavailable")), /Connecting Claude to Toone is not available right now\./);
  assert.match(text(ended("unavailable", null)), /Connecting an assistant to Toone is not available right now\./);
  assert.match(text(ended("bad-redirect")), /Toone couldn't send you back safely\. Go back to Claude and connect again\./);
  assert.match(text(ended("other-browser")), /Start again from Claude This page was opened in a different browser from the one that started connecting\. Go back to Claude in this browser and connect again\./);
  assert.match(text(ended("already-allowed", null)), /This connection is already set up You already allowed it\./);
  assert.match(text(ended("already-denied", null)), /You already answered You chose not to allow this connection\./);
  assert.match(text(ended("unreachable")), /Toone couldn't be reached Check your connection and try again\./);
  assert.match(text(ended("rate-limited")), /Too many attempts Wait a minute, then try again\./);
  for (const reason of ["unreachable", "rate-limited", "page-error"] as const) assert.match(ended(reason), />Try again</, reason);
  for (const reason of ["expired", "unavailable", "bad-redirect", "invalid-link", "other-browser", "already-allowed", "already-denied"] as const) {
    assert.doesNotMatch(ended(reason), />Try again<|>Allow</, reason);
  }
});

test("after a decision: going back, no buttons and never the address", () => {
  const html = render(createElement(ConsentScreen, { state: { kind: "leaving", approve: true, clientKind: "claude" } }));
  assert.match(text(html), /Allowed Taking you back to Claude…/);
  assert.doesNotMatch(html, /<button|claude\.ai|code=/);
  assert.match(text(render(createElement(ConsentScreen, { state: { kind: "leaving", approve: false, clientKind: "claude" } }))), /Not allowed/);
});

test("no internal names on any state of the page", () => {
  const pages = [
    screen(), screen({}, {}, { status: "list", macs: [] }), screen({}, {}, { status: "list", macs: [studio, air] }),
    screen({}, { eligible: false, ineligibleReason: "subscription_required" }), screen({}, { eligible: false, ineligibleReason: "not_allowed" }),
    screen({}, { clientKind: "local", clientName: "x" }), screen({}, { clientKind: "other", clientName: "x", redirectHost: "x.example" }),
    screen({ notice: "unreachable" }),
    render(createElement(ConnectSignIn, { sessionEnded: true, onAuthenticated() {} })),
  ];
  for (const html of pages) assert.doesNotMatch(text(html), INTERNALS);
});
