import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import AuthPage from "../../components/AuthPage";
import AppleSignInButton from "../../components/AppleSignInButton";
import { ApiError, loginApple } from "../../lib/api";
import {
  AppleSignInError,
  appleButtonURL,
  appleDisplayName,
  appleOriginMatches,
  appleScriptURL,
  isAppleCancellation,
  readAppleResponse,
  resolveAppleSignInConfig,
} from "../../lib/appleSignIn";
import en from "../../messages/en.json";
import { NextRequest } from "next/server";
import * as appleCallback from "../../app/api/auth/apple/callback/route";

const SERVICES_ID = "com.trytoone.web";
const REDIRECT = "https://trytoone.com/api/auth/apple/callback";
const realFetch = globalThis.fetch;
const env = process.env as Record<string, string | undefined>;

afterEach(() => {
  globalThis.fetch = realFetch;
  delete env.NEXT_PUBLIC_APPLE_SERVICES_ID;
  delete env.NEXT_PUBLIC_APPLE_REDIRECT_URI;
});

/* ---- configuration gate */

test("Apple sign-in stays hidden until a Services ID and https return URL are configured", () => {
  assert.equal(resolveAppleSignInConfig(undefined, undefined), null);
  assert.equal(resolveAppleSignInConfig(SERVICES_ID, undefined), null);
  assert.equal(resolveAppleSignInConfig("", REDIRECT), null);
  assert.equal(resolveAppleSignInConfig(SERVICES_ID, "http://trytoone.com/cb"), null);
  assert.equal(resolveAppleSignInConfig(SERVICES_ID, "/relative"), null);
  assert.equal(resolveAppleSignInConfig(SERVICES_ID, `${REDIRECT}#frag`), null);
  assert.deepEqual(resolveAppleSignInConfig(` ${SERVICES_ID} `, ` ${REDIRECT} `), {
    clientId: SERVICES_ID,
    redirectURI: REDIRECT,
  });
});

test("Apple JS is loaded from Apple's CDN in the page locale, English otherwise", () => {
  assert.equal(
    appleScriptURL("pt"),
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/pt_BR/appleid.auth.js",
  );
  assert.match(appleScriptURL("xx"), /\/en_US\/appleid\.auth\.js$/);
});

test("Apple button artwork comes from Apple's CDN with an approved localized title", () => {
  const signIn = new URL(appleButtonURL("pt", "sign-in"));
  assert.equal(signIn.origin, "https://appleid.cdn-apple.com");
  assert.equal(signIn.pathname, "/appleid/button");
  assert.equal(signIn.searchParams.get("locale"), "pt_BR");
  assert.equal(signIn.searchParams.get("type"), "sign-in");
  assert.equal(signIn.searchParams.get("color"), "white");
  assert.equal(new URL(appleButtonURL("en", "continue")).searchParams.get("type"), "continue");
});

/* ---- Apple response handling */

test("first-authorization name is joined, trimmed and bounded; later responses have none", () => {
  assert.equal(appleDisplayName({ name: { firstName: " Ada ", lastName: "Lovelace" } }), "Ada Lovelace");
  assert.equal(appleDisplayName({ name: { firstName: "Ada" } }), "Ada");
  assert.equal(appleDisplayName(undefined), "");
  assert.equal(appleDisplayName({ name: { firstName: "x".repeat(150) } }).length, 100);
});

test("closing the popup or declining is a cancellation, other failures are not", () => {
  assert.ok(isAppleCancellation({ error: "popup_closed_by_user" }));
  assert.ok(isAppleCancellation({ error: "user_cancelled_authorize" }));
  assert.ok(!isAppleCancellation({ error: "popup_blocked_by_browser" }));
  assert.ok(!isAppleCancellation(new Error("network")));
  assert.ok(!isAppleCancellation(undefined));
});

test("only the identity token and name are taken from Apple's response, after the state matches", () => {
  const response = {
    authorization: { id_token: "header.payload.sig", code: "single-use-code", state: "s1" },
    user: { name: { firstName: "Ada" }, email: "ada@example.com" },
  };
  const result = readAppleResponse(response, "s1");
  assert.deepEqual(result, { idToken: "header.payload.sig", name: "Ada" });
  assert.ok(!JSON.stringify(result).includes("single-use-code"));

  assert.throws(() => readAppleResponse(response, "other"), (e: unknown) =>
    e instanceof AppleSignInError && e.reason === "state_mismatch");
  assert.throws(() => readAppleResponse({ authorization: { state: "s1" } }, "s1"), (e: unknown) =>
    e instanceof AppleSignInError && e.reason === "missing_token");
});

/* ---- Toone API request */

type Captured = { url: string; init: RequestInit };

function stubFetch(status: number, body: unknown): Captured[] {
  const calls: Captured[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

const loginPayload = {
  data: {
    User: { ID: "usr_1", Email: "k7x2@privaterelay.appleid.com", Name: "Ada", Provider: "apple", ProviderID: "001.abc" },
    Session: { UserID: "usr_1", Token: "session-jwt", ExpiresAt: "2099-01-01T00:00:00Z", IssuedAt: "2026-09-28T00:00:00Z" },
    IsNewUser: true,
  },
};

test("loginApple posts only the identity token (plus name and invitation code) to /auth/apple", async () => {
  const calls = stubFetch(200, loginPayload);
  const session = await loginApple("header.payload.sig", "Ada", "INVITE-CODE-1234");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/auth\/apple$/);
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    id_token: "header.payload.sig",
    name: "Ada",
    code: "INVITE-CODE-1234",
  });
  assert.equal(session.token, "session-jwt");
  assert.equal(session.user.email, "k7x2@privaterelay.appleid.com");
});

test("loginApple omits an empty name and absent invitation code", async () => {
  const calls = stubFetch(200, loginPayload);
  await loginApple("header.payload.sig", "", undefined);
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { id_token: "header.payload.sig" });
});

test("server refusals surface as typed API errors for the page's copy", async () => {
  for (const code of ["already_exists", "registration_closed", "invalid_invitation", "invalid_token"]) {
    stubFetch(code === "already_exists" ? 409 : code === "invalid_token" ? 401 : 403, { code, message: "x" });
    await assert.rejects(loginApple("t"), (e: unknown) => e instanceof ApiError && e.code === code);
  }
});

/* ---- rendering */

const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };

function renderAuthPage(mode: "signin" | "invite"): string {
  return renderToStaticMarkup(
    createElement(
      AppRouterContext.Provider,
      { value: router as never },
      createElement(NextIntlClientProvider, {
        locale: "en", messages: en, timeZone: "UTC", children: createElement(AuthPage, { mode }),
      }),
    ),
  );
}

test("the sign-in page shows Sign in with Apple beside Google and email when configured", () => {
  env.NEXT_PUBLIC_APPLE_SERVICES_ID = SERVICES_ID;
  env.NEXT_PUBLIC_APPLE_REDIRECT_URI = REDIRECT;
  const html = renderAuthPage("signin");
  assert.match(html, /class="auth-apple"[^>]*aria-label="Sign in with Apple"[^>]*>.*?<img[^>]*appleid\.cdn-apple\.com\/appleid\/button/);
  assert.ok(!html.includes('viewBox="0 0 814 1000"'));
  // Disabled until Apple JS has loaded in the browser.
  assert.match(html, /class="auth-apple" disabled="" aria-busy="true"/);
  assert.ok(html.includes("Continue with Google"));
  assert.ok(html.includes('type="password"'));
});

test("the sign-in page renders no Apple button when unconfigured, leaving Google and email intact", () => {
  const html = renderAuthPage("signin");
  assert.ok(!html.includes('class="auth-apple"'));
  assert.ok(html.includes("Continue with Google"));
  assert.ok(html.includes('type="password"'));
});

test("the invitation page asks for the code before offering Apple", () => {
  env.NEXT_PUBLIC_APPLE_SERVICES_ID = SERVICES_ID;
  env.NEXT_PUBLIC_APPLE_REDIRECT_URI = REDIRECT;
  const html = renderAuthPage("invite");
  assert.ok(!html.includes('class="auth-apple"'));
  assert.ok(html.includes(en.auth.inviteCode));
});

test("the button component renders nothing without configuration", () => {
  const html = renderToStaticMarkup(createElement(AppleSignInButton, {
    config: null, locale: "en", label: "Sign in with Apple", buttonType: "sign-in", unavailableLabel: "n/a",
    onCredential: () => {}, onFailure: () => {},
  }));
  assert.equal(html, "");
});

/* ---- copy */

test("every locale carries the Apple sign-in copy", async () => {
  const keys = ["appleSignIn", "appleContinue", "appleUnavailable", "appleFailed", "errExistsApple", "errInvitationApple"];
  for (const locale of ["en", "de", "es", "fr", "it", "nl", "pt", "ru"]) {
    const messages = (await import(`../../messages/${locale}.json`, { with: { type: "json" } })).default as {
      auth: Record<string, string>;
    };
    for (const key of keys) {
      assert.ok(messages.auth[key]?.trim(), `${locale}.auth.${key}`);
    }
  }
});

/* ---- origin gate and return URL */

test("the button only runs on the return URL's origin (not previews or www)", () => {
  const config = { clientId: SERVICES_ID, redirectURI: REDIRECT };
  assert.ok(appleOriginMatches(config, "https://trytoone.com"));
  assert.ok(!appleOriginMatches(config, "https://www.trytoone.com"));
  assert.ok(!appleOriginMatches(config, "https://toone-oss-git-branch.vercel.app"));
  assert.ok(!appleOriginMatches(config, "http://localhost:3000"));
});

test("the Apple return URL never reads the posted body and sends the visitor to sign-in", async () => {
  let bodyRead = false;
  const body = new ReadableStream({
    pull() { bodyRead = true; },
  });
  const posted = new Request(REDIRECT, {
    method: "POST", body, duplex: "half",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  } as RequestInit);
  const post = appleCallback.POST(new NextRequest(posted));
  assert.equal(post.status, 303);
  assert.equal(post.headers.get("Location"), "https://trytoone.com/signin");
  assert.equal(post.headers.get("Cache-Control"), "no-store");
  assert.equal(post.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(bodyRead, false);

  const get = appleCallback.GET(new NextRequest(REDIRECT));
  assert.equal(get.status, 303);
  assert.equal(get.headers.get("Location"), "https://trytoone.com/signin");
});
