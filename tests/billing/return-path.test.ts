import assert from "node:assert/strict";
import { test } from "node:test";
import { signInReturnPath } from "../../components/AuthPage";
import { pricingReturnPath, signInHref } from "../../components/billing/PricingPlans.helpers";
import { PRO_PLANS } from "../../lib/billing/api";

/* Sign-in comes back only to listed pages of this site: the open-redirect guard. */

const next = (value: string) => `?next=${encodeURIComponent(value)}`;

test("pricing is an allowed return path, alone or with a known plan", () => {
  assert.equal(signInReturnPath(next("/pricing")), "/pricing");
  for (const plan of ["monthly", "yearly", "lifetime"]) {
    assert.equal(signInReturnPath(next(`/pricing?plan=${plan}`)), `/pricing?plan=${plan}`);
  }
});

test("the how-to return paths still work", () => {
  assert.equal(signInReturnPath(next("/how-to")), "/how-to");
  assert.equal(signInReturnPath(next("/how-to/features/explore")), "/how-to/features/explore");
});

test("anything else is refused (open-redirect cases)", () => {
  for (const value of [
    "",
    "https://evil.example",
    "https://evil.example/pricing",
    "//evil.example/pricing",
    "/\\evil.example",
    "\\\\evil.example",
    "/pricing/",
    "/pricingx",
    "/pricing/../admin",
    "/pricing?plan=",
    "/pricing?plan=pro_yearly",
    "/pricing?plan=enterprise",
    "/pricing?plan=YEARLY",
    "/pricing?plan=yearly&next=https://evil.example",
    "/pricing?plan=yearly&from=app",
    "/pricing?from=app",
    "/pricing?plan=yearly#https://evil.example",
    "/pricing#x",
    "/pricing?plan=yearly\n",
    " /pricing",
    "/en/pricing",
    "/success",
    "/cancel",
    "/downloads",
    "javascript:alert(1)//pricing",
  ]) {
    assert.equal(signInReturnPath(next(value)), null, JSON.stringify(value));
  }
  assert.equal(signInReturnPath(""), null);
  assert.equal(signInReturnPath("?next="), null);
});

test("the pricing page's sign-in link comes back to the chosen plan", () => {
  for (const plan of [...PRO_PLANS, null]) {
    const href = signInHref(plan);
    assert.match(href, /^\/signin\?next=/);
    const search = new URL(href, "https://trytoone.com").search;
    assert.equal(signInReturnPath(search), pricingReturnPath(plan), String(plan));
  }
});
