import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  PENDING_CODE_STORAGE_KEY,
  forgetPendingCode,
  pendingCode,
  rememberPendingCode,
} from "../../lib/billing/pending-code";

/* A /redeem#code= link keeps its code across a redirect sign-in, in this tab's sessionStorage only. */

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
}

test("a code read from the link survives a reload of the tab until it is redeemed", () => {
  const store = memoryStorage();
  rememberPendingCode("LAUNCH-2026 PRO", store);
  assert.deepEqual([...store.map], [[PENDING_CODE_STORAGE_KEY, "LAUNCH-2026 PRO"]]);
  // A second page load (the redirect back from sign-in) finds it again, and again.
  assert.equal(pendingCode(store), "LAUNCH-2026 PRO");
  assert.equal(pendingCode(store), "LAUNCH-2026 PRO");
  forgetPendingCode(store);
  assert.equal(pendingCode(store), null);
});

test("only something that can be a code is stored or returned", () => {
  const store = memoryStorage();
  for (const bad of ["", "<script>", "PRO30/../admin", "pro30", "A".repeat(81)]) rememberPendingCode(bad, store);
  assert.equal(store.map.size, 0);
  store.map.set(PENDING_CODE_STORAGE_KEY, "javascript:alert(1)");
  assert.equal(pendingCode(store), null);
});

test("blocked or missing storage never throws", () => {
  const blocked = {
    getItem: () => { throw new Error("SecurityError"); },
    setItem: () => { throw new Error("QuotaExceededError"); },
    removeItem: () => { throw new Error("SecurityError"); },
  };
  rememberPendingCode("PRO30", blocked);
  assert.equal(pendingCode(blocked), null);
  forgetPendingCode(blocked);
  assert.equal(pendingCode(null), null);
  assert.equal(pendingCode(), null, "outside a browser");
});

test("signing out clears the pending code", async () => {
  const session = memoryStorage();
  const local = memoryStorage();
  const globals = globalThis as unknown as Record<string, unknown>;
  const saved = { window: globals.window, localStorage: globals.localStorage };
  globals.window = { sessionStorage: session, localStorage: local };
  globals.localStorage = local;
  try {
    const { clearSession } = await import("../../lib/api");
    rememberPendingCode("PRO30ABCD");
    assert.equal(session.map.get(PENDING_CODE_STORAGE_KEY), "PRO30ABCD");
    local.setItem("toone.session", "{}");
    clearSession();
    assert.equal(session.map.has(PENDING_CODE_STORAGE_KEY), false);
    assert.equal(local.map.has("toone.session"), false);
  } finally {
    globals.window = saved.window;
    globals.localStorage = saved.localStorage;
  }
});

test("/redeem stores the linked code (never in the address) and the form forgets it once redeemed", () => {
  const page = fs.readFileSync("components/account/RedeemPage.tsx", "utf8");
  assert.match(page, /let code = codeFromFragment\(window\.location\.hash\);\s*if \(code\) rememberPendingCode\(code\);\s*else code = pendingCode\(\);/);
  // The address is cleaned before anything else, and nothing writes the code back into it.
  assert.match(page, /replaceState\(null, "", locationWithoutCode\(/);
  assert.doesNotMatch(page, /[?&#]code=\$\{|searchParams\.set\("code"/);
  const form = fs.readFileSync("components/account/RedeemForm.tsx", "utf8");
  assert.match(form, /const result = await redeemCode\(token, canonical\);\s*forgetPendingCode\(\);/);
  assert.match(fs.readFileSync("lib/api.ts", "utf8"), /export function clearSession\(\): void \{[\s\S]*?forgetPendingCode\(\);[\s\S]*?\n\}/);
});
