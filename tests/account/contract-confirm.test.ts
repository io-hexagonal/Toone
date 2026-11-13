import "./css-modules";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { afterEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ContractConfirmPage from "../../components/account/ContractConfirmPage";
import {
  CONTRACT_TOKEN_GLOBAL,
  STRIP_CONTRACT_TOKEN_SCRIPT,
  confirmFailure,
  outcomeCopy,
  takeContractToken,
  tokenFromFragment,
} from "../../components/account/contract-confirm";
import { ApiError } from "../../lib/api";
import { confirmContractRequest } from "../../lib/billing/api";
import en from "../../messages/en.json";

/* /cancel-contract/confirm#token=…: the emailed link. Opening it changes nothing; Confirm does. */

const TOKEN = "A".repeat(20) + "b_c-d".repeat(5);

function fakeWindow(href: string, extra: Record<string, unknown> = {}) {
  const url = new URL(href);
  const win = {
    location: { hash: url.hash, pathname: url.pathname, search: url.search },
    replaced: [] as string[],
    history: {
      state: { keep: true } as unknown,
      replaceState(_data: unknown, _unused: string, next?: string | URL | null) {
        win.replaced.push(String(next));
        win.location.hash = "";
      },
    },
    ...extra,
  };
  return win;
}

test("the token comes from the fragment only and must look like the server's", () => {
  assert.equal(tokenFromFragment(`#token=${TOKEN}`), TOKEN);
  assert.equal(tokenFromFragment(`#x=1&token=${TOKEN}`), TOKEN);
  for (const bad of ["", "#", "#token=", "#token=short", `#token=${TOKEN}<script>`, `#token=${"a".repeat(129)}`, `#${"x".repeat(600)}`]) {
    assert.equal(tokenFromFragment(bad), null, bad);
  }
  const component = fs.readFileSync("components/account/ContractConfirmPage.tsx", "utf8");
  assert.doesNotMatch(component, /searchParams|useSearchParams|location\.search/);
  assert.doesNotMatch(fs.readFileSync("app/[locale]/cancel-contract/confirm/page.tsx", "utf8"), /searchParams/);
});

test("the inline script removes the fragment before anything else runs and parks the token in memory", () => {
  const win = fakeWindow(`https://trytoone.com/de/cancel-contract/confirm#token=${TOKEN}`);
  vm.runInNewContext(STRIP_CONTRACT_TOKEN_SCRIPT, { window: win, URLSearchParams });
  assert.deepEqual(win.replaced, ["/de/cancel-contract/confirm"]);
  assert.equal((win as Record<string, unknown>)[CONTRACT_TOKEN_GLOBAL], TOKEN);

  const clean = fakeWindow("https://trytoone.com/de/cancel-contract/confirm");
  vm.runInNewContext(STRIP_CONTRACT_TOKEN_SCRIPT, { window: clean, URLSearchParams });
  assert.deepEqual(clean.replaced, []);
  assert.equal(CONTRACT_TOKEN_GLOBAL in clean, false);

  const page = fs.readFileSync("app/[locale]/cancel-contract/confirm/page.tsx", "utf8");
  const script = page.indexOf("STRIP_CONTRACT_TOKEN_SCRIPT }}");
  const client = page.indexOf("<ContractConfirmPage");
  assert.ok(script > 0 && client > script, "script first");
});

test("the page takes the parked token once; without the script it strips the fragment itself", () => {
  const parked = fakeWindow("https://trytoone.com/en/cancel-contract/confirm", { [CONTRACT_TOKEN_GLOBAL]: TOKEN });
  assert.equal(takeContractToken(parked), TOKEN);
  assert.equal(CONTRACT_TOKEN_GLOBAL in parked, false);
  assert.equal(takeContractToken(parked), null, "a reload needs the emailed link again");

  const direct = fakeWindow(`https://trytoone.com/en/cancel-contract/confirm?x=1#token=${TOKEN}`);
  assert.equal(takeContractToken(direct), TOKEN);
  assert.deepEqual(direct.replaced, ["/en/cancel-contract/confirm?x=1"]);

  const forged = fakeWindow("https://trytoone.com/en/cancel-contract/confirm#token=../../x");
  assert.equal(takeContractToken(forged), null);
  assert.deepEqual(forged.replaced, ["/en/cancel-contract/confirm"], "a malformed token is still removed");
  assert.equal(takeContractToken(undefined), null);
});

test("the server HTML never confirms: no token, a neutral reading state, and Confirm only after a click", () => {
  const html = renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale: "en", messages: en, timeZone: "UTC", children: createElement(ContractConfirmPage),
  }));
  assert.match(html, /Reading the link…/);
  assert.doesNotMatch(html, /cancelled|withdrawn|token=/i);
  const component = fs.readFileSync("components/account/ContractConfirmPage.tsx", "utf8");
  // The only call site is the button's click handler.
  assert.equal(component.match(/confirmContractRequest\(/g)?.length, 1);
  assert.match(component, /onClick=\{\(\) => void confirm\(step\.token\)\}/);
  // Taking the token consumes it: a second effect run (development) must not turn the page into "missing".
  assert.match(component, /if \(taken\.current === undefined\) taken\.current = takeContractToken\(window\);/);
  assert.doesNotMatch(component.slice(component.indexOf("useEffect"), component.indexOf("async function confirm")), /confirm\(/);
});

test("outcomes: cancelled, withdrawn and nothing_to_cancel each have their copy", () => {
  assert.deepEqual(outcomeCopy({ kind: "cancel", outcome: "cancelled" }), { title: "cancelledTitle", body: "cancelledBody", offerWithdraw: false });
  assert.deepEqual(outcomeCopy({ kind: "withdraw", outcome: "withdrawn" }), { title: "withdrawnTitle", body: "withdrawnBody", offerWithdraw: false });
  assert.deepEqual(outcomeCopy({ kind: "cancel", outcome: "nothing_to_cancel" }), { title: "nothingTitle", body: "nothingBody", offerWithdraw: true });
  assert.deepEqual(outcomeCopy({ kind: "withdraw", outcome: "nothing_to_cancel" }), { title: "nothingTitle", body: "nothingBody", offerWithdraw: false });
  assert.deepEqual(outcomeCopy({ kind: "unknown", outcome: "unknown" }), { title: "doneTitle", body: "doneBody", offerWithdraw: false });
  const copy = en.account.contractConfirm;
  assert.equal(copy.cancelledTitle, "Your subscription is cancelled");
  assert.equal(copy.withdrawnTitle, "You've withdrawn from the contract");
  assert.equal(copy.nothingTitle, "There was nothing to cancel");
});

test("404 (expired or unknown) and 400 offer to start again; other failures keep the link usable", () => {
  assert.equal(confirmFailure(new ApiError("not_found", "resource not found", 404)), "expired");
  assert.equal(confirmFailure(new ApiError("invalid_input", "invalid request", 400)), "expired");
  assert.equal(confirmFailure(new ApiError("rate_limit_exceeded", "slow", 429)), "errRate");
  assert.equal(confirmFailure(new ApiError("provider_error", "stripe down", 503)), "errUnavailable");
  assert.equal(confirmFailure(new TypeError("Failed to fetch")), "errGeneric");
  assert.match(en.account.contractConfirm.expiredBody, /new request/);
  assert.equal(en.account.contractConfirm.startAgain, "Start a new request");
});

const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; delete env.NEXT_PUBLIC_API_BASE_URL; });

test("confirming is a POST with the token in the body, never in a URL", async () => {
  env.NEXT_PUBLIC_API_BASE_URL = "https://api.test/v1";
  const seen: { url: string; method?: string; auth: string | null; body: unknown }[] = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    seen.push({ url: String(url), method: init?.method, auth: new Headers(init?.headers).get("Authorization"), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify({ data: { kind: "cancel", outcome: "cancelled" } }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  assert.deepEqual(await confirmContractRequest(TOKEN), { kind: "cancel", outcome: "cancelled" });
  assert.deepEqual(seen, [{ url: "https://api.test/v1/billing/contract-requests/confirm", method: "POST", auth: null, body: { token: TOKEN } }]);
});

test("the confirm page is noindex, sends no referrer and loads the account messages", () => {
  const page = fs.readFileSync("app/[locale]/cancel-contract/confirm/page.tsx", "utf8");
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /referrer: "no-referrer"/);
  assert.match(page, /canonical: `https:\/\/trytoone\.com\/\$\{locale\}\/cancel-contract\/confirm`/);
  assert.match(page, /<AccountMessages>/);
  assert.ok(!fs.readFileSync("app/sitemap.xml/route.ts", "utf8").includes("/cancel-contract/confirm"));
});
