import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import NotificationsPanel from "../../components/account/NotificationsPanel";
import UnsubscribePage from "../../components/account/UnsubscribePage";
import { ApiError } from "../../lib/api";
import {
  getEmailPreferences,
  setProductUpdates,
  takeUnsubscribeToken,
  unsubscribeProductEmails,
} from "../../lib/email-preferences";
import en from "../../messages/en.json" with { type: "json" };

/* Product emails: the account page's Notifications switch and the login-free unsubscribe link. */

const read = (path: string) => fs.readFileSync(path, "utf8");
const API = "https://api.trytoone.com/v1";

type Call = { url: string; init: RequestInit };

function mockFetch(status: number, body: unknown): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

function render(node: ReturnType<typeof createElement>) {
  return renderToStaticMarkup(createElement(NextIntlClientProvider, { locale: "en", messages: { account: en.account }, children: node }));
}

test("the account switch reads and writes product_updates with the session token", async () => {
  let calls = mockFetch(200, { data: { product_updates: true } });
  assert.deepEqual(await getEmailPreferences("tok"), { productUpdates: true });
  assert.equal(calls[0].url, `${API}/account/email-preferences`);
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), "Bearer tok");
  assert.equal(calls[0].init.cache, "no-store");

  calls = mockFetch(200, { data: { product_updates: false } });
  assert.deepEqual(await setProductUpdates("tok", false), { productUpdates: false });
  assert.equal(calls[0].init.method, "PUT");
  assert.equal(calls[0].init.body, JSON.stringify({ product_updates: false }));

  mockFetch(401, { code: "unauthorized", message: "authentication required" });
  await assert.rejects(getEmailPreferences("tok"), (error: unknown) => error instanceof ApiError && error.status === 401);
  mockFetch(200, { data: {} });
  await assert.rejects(getEmailPreferences("tok"), ApiError, "a reply without product_updates is not read as off");
});

test("unsubscribe posts the token as JSON without signing in; only {unsubscribed: true} counts", async () => {
  let calls = mockFetch(200, { data: { unsubscribed: true } });
  await unsubscribeProductEmails("usr_abc.sig");
  assert.equal(calls[0].url, `${API}/email/unsubscribe`);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.body, JSON.stringify({ token: "usr_abc.sig" }));
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), null);

  calls = mockFetch(400, { code: "invalid_input", message: "invalid request" });
  await assert.rejects(unsubscribeProductEmails("bad"), (error: unknown) => error instanceof ApiError && error.code === "invalid_input");
  mockFetch(200, { data: {} });
  await assert.rejects(unsubscribeProductEmails("usr_abc.sig"), ApiError);
});

test("the unsubscribe token is taken from ?t= once and removed from the address", () => {
  const replaced: string[] = [];
  const win = (search: string) => ({
    location: { pathname: "/en/unsubscribe", search, hash: "" },
    history: { state: null, replaceState: (_data: unknown, _unused: string, url?: string | URL | null) => { replaced.push(String(url)); } },
  });
  assert.equal(takeUnsubscribeToken(win("?t=usr_abc.sig")), "usr_abc.sig");
  assert.deepEqual(replaced, ["/en/unsubscribe"]);
  assert.equal(takeUnsubscribeToken(win("?utm_source=email&t=usr_abc.sig")), "usr_abc.sig");
  assert.equal(replaced[1], "/en/unsubscribe?utm_source=email");
  assert.equal(takeUnsubscribeToken(win("")), null);
  assert.equal(takeUnsubscribeToken(win("?t=")), null);
  assert.equal(replaced.length, 3, "an empty t is removed too; no t leaves the address alone");
});

test("opening the unsubscribe page changes nothing: the server HTML only reads the link", () => {
  const html = render(createElement(UnsubscribePage));
  assert.match(html, /role="status">Reading the link…</);
  assert.doesNotMatch(html, /You&#x27;re unsubscribed/);
  const source = read("components/account/UnsubscribePage.tsx");
  // The API call happens only in the button's handler, never in an effect.
  assert.match(source, /onClick=\{\(\) => void unsubscribe\(step\.token\)\}/);
  const effects = source.split("useEffect(").slice(1).map((chunk) => chunk.split("}, [")[0]);
  for (const effect of effects) assert.doesNotMatch(effect, /unsubscribeProductEmails|unsubscribe\(/);
});

test("the Notifications panel has one switch, described by its sub-line, disabled until loaded", () => {
  const html = render(createElement(NotificationsPanel, { token: "tok", onSessionEnded: () => {} }));
  assert.match(html, /<h2 id="account-notifications">Notifications<\/h2>/);
  assert.match(html, /type="checkbox" role="switch"[^>]*disabled=""[^>]*aria-describedby="account-product-updates-sub"/);
  assert.match(html, /Product news and updates/);
  assert.match(html, /A few emails a year about new features and launches\. Receipts and account emails always arrive\./);
  assert.match(read("components/account/AccountPage.tsx"), /<NotificationsPanel token=\{session\.token\} onSessionEnded=\{onSessionEnded\} \/>/);
});

test("unsubscribe copy says what stops and what still arrives", () => {
  const copy = en.account.unsubscribe;
  assert.equal(copy.body, "Stop Toone product emails (news and updates)? Account emails like receipts and security messages still arrive.");
  assert.equal(copy.done, "You're unsubscribed from product emails.");
  assert.match(copy.error, /\{email\}/);
  assert.match(copy.turnBackOn, /<link>your account<\/link>/);
});
