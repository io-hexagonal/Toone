import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { accessOutcome, adminTitle } from "../../components/admin/access";
import {
  EMPTY_CODE_FORM,
  benefitLabel,
  codeRequestFrom,
  minimumCodeLength,
  shareLink,
  unlimitedProWarning,
  validityOptions,
  type CodeFormState,
} from "../../components/admin/code-form";
import { ApiError } from "../../lib/api";
import { BillingError, createCodeInvitation } from "../../lib/billing/api";
import { listCodeLedger, normalizeCodeLedgerPage } from "../../lib/billing/redemptions";

const NOW = Date.parse("2026-11-10T12:00:00Z");
const form = (patch: Partial<CodeFormState>): CodeFormState => ({ ...EMPTY_CODE_FORM, name: "Launch", ...patch });
const body = (patch: Partial<CodeFormState>) => {
  const result = codeRequestFrom(form(patch), NOW);
  assert.ok(result.ok, result.ok ? "" : result.error);
  return result.input;
};
const refusal = (patch: Partial<CodeFormState>) => {
  const result = codeRequestFrom(form(patch), NOW);
  assert.ok(!result.ok, "expected a refusal");
  return result.error;
};

test("signup-only codes keep the old request body: no benefit, no admits_signup", () => {
  assert.deepEqual(body({}), { recipient_name: "Launch", code: "", days: 7 });
  assert.deepEqual(body({ audience: "shared", maxUses: 0, campaign: " ph " }), {
    recipient_name: "Launch", code: "", days: 7, max_uses: 0, campaign: "ph",
  });
});

test("each benefit kind serializes as {kind, value} with an explicit admits_signup", () => {
  assert.deepEqual(body({ benefit: "pro_days", benefitValue: 30, audience: "shared", maxUses: 100, days: 90 }), {
    recipient_name: "Launch", code: "", days: 90, max_uses: 100,
    benefit: { kind: "pro_days", value: 30 }, admits_signup: false,
  });
  assert.deepEqual(body({ benefit: "pro_lifetime", benefitValue: 30, admitsSignup: true }).benefit, { kind: "pro_lifetime" });
  assert.equal(body({ benefit: "pro_lifetime", admitsSignup: true }).admits_signup, true);
  assert.deepEqual(body({ benefit: "free_creations", benefitValue: 3 }).benefit, { kind: "free_creations", value: 3 });
});

test("benefit values, uses and validity are bounded (decision 9)", () => {
  assert.match(refusal({ benefit: "pro_days", benefitValue: 0 }), /1 to 365/);
  assert.match(refusal({ benefit: "pro_days", benefitValue: 366 }), /1 to 365/);
  assert.match(refusal({ benefit: "free_creations", benefitValue: 51 }), /1 to 50/);
  assert.match(refusal({ benefit: "free_creations", benefitValue: Number.NaN }), /1 to 50/);
  assert.match(refusal({ audience: "shared", maxUses: -1 }), /0 \(unlimited\)/);
  assert.match(refusal({ audience: "shared", maxUses: 1 }), /One person/);
  // Signup-only codes keep the 30-day limit; benefit codes may last a year.
  assert.match(refusal({ days: 90 }), /at most 30 days/);
  assert.equal(body({ benefit: "pro_days", benefitValue: 7, days: 365 }).days, 365);
  assert.deepEqual(validityOptions("signup"), [1, 7, 14, 30]);
  assert.deepEqual(validityOptions("pro_days"), [1, 7, 14, 30, 90, 180, 365]);
  assert.match(refusal({ benefit: "pro_days", expiresAt: "2028-01-01T00:00" }), /within 365 days/);
  assert.match(refusal({ expiresAt: "2026-11-01T00:00" }), /future/);
  assert.ok(body({ benefit: "pro_days", expiresAt: "2027-06-01T00:00" }).expires_at);
});

test("custom codes: 12 characters for one person, 8 for shared benefit codes, 6 for shared signup codes", () => {
  assert.equal(minimumCodeLength({ audience: "personal", benefit: "pro_days" }), 12);
  assert.equal(minimumCodeLength({ audience: "shared", benefit: "pro_days" }), 8);
  assert.equal(minimumCodeLength({ audience: "shared", benefit: "free_creations" }), 8);
  assert.equal(minimumCodeLength({ audience: "shared", benefit: "signup" }), 6);
  assert.match(refusal({ audience: "shared", benefit: "pro_days", customCode: "PRO-777" }), /8–64/);
  assert.equal(body({ audience: "shared", benefit: "pro_days", customCode: "LAUNCH-26" }).code, "LAUNCH-26");
  assert.equal(body({ audience: "shared", customCode: "PH-2026" }).code, "PH-2026");
  assert.match(refusal({ customCode: "SHORTCODE1" }), /12–64/);
  assert.match(refusal({ audience: "shared", benefit: "pro_days", customCode: "LAUNCH_2026" }), /letters or digits/);
});

test("unlimited + Pro shows the warning; caps or non-Pro benefits do not", () => {
  assert.equal(unlimitedProWarning({ benefit: "pro_days", audience: "shared", maxUses: 0 }), true);
  assert.equal(unlimitedProWarning({ benefit: "pro_lifetime", audience: "shared", maxUses: 0 }), true);
  assert.equal(unlimitedProWarning({ benefit: "pro_days", audience: "shared", maxUses: 50 }), false);
  assert.equal(unlimitedProWarning({ benefit: "free_creations", audience: "shared", maxUses: 0 }), false);
  assert.equal(unlimitedProWarning({ benefit: "signup", audience: "shared", maxUses: 0 }), false);
  assert.equal(unlimitedProWarning({ benefit: "pro_days", audience: "personal", maxUses: 0 }), false);
});

test("share links carry the code in the fragment: signup page when it admits accounts, /redeem otherwise", () => {
  assert.equal(shareLink({ signupUrl: "https://trytoone.com/invite", siteOrigin: "https://trytoone.com", code: "PRO 30", admitsSignup: true }),
    "https://trytoone.com/invite#code=PRO%2030");
  // A server URL that already carries a fragment is not doubled.
  assert.equal(shareLink({ signupUrl: "https://trytoone.com/invite#code=OLD", siteOrigin: "https://trytoone.com", code: "NEW", admitsSignup: true }),
    "https://trytoone.com/invite#code=NEW");
  assert.equal(shareLink({ signupUrl: "https://trytoone.com/invite", siteOrigin: "https://trytoone.com/", code: "LAUNCH26", admitsSignup: false }),
    "https://trytoone.com/redeem#code=LAUNCH26");
});

test("list labels name each benefit", () => {
  assert.equal(benefitLabel({ kind: "none", value: null }), "Signup only");
  assert.equal(benefitLabel({ kind: "pro_days", value: 30 }), "Pro · 30 days");
  assert.equal(benefitLabel({ kind: "pro_days", value: 1 }), "Pro · 1 day");
  assert.equal(benefitLabel({ kind: "pro_lifetime", value: null }), "Pro forever");
  assert.equal(benefitLabel({ kind: "free_creations", value: 3 }), "+3 creations");
  assert.equal(benefitLabel({ kind: "unknown", value: null }), "Other benefit");
});

test("401 ends the session; 403 is shown as Page not found", () => {
  assert.equal(accessOutcome(new ApiError("unauthorized", "x", 401)), "session");
  assert.equal(accessOutcome(new ApiError("forbidden", "x", 403)), "denied");
  assert.equal(accessOutcome(new BillingError({ kind: "unauthenticated" })), "session");
  assert.equal(accessOutcome(new BillingError({ kind: "forbidden" })), "denied");
  assert.equal(accessOutcome(new BillingError({ kind: "unknown", status: 403, code: "insufficient_capability", message: "" })), "denied");
  assert.equal(accessOutcome(new BillingError({ kind: "unknown", status: 500, code: "internal", message: "" })), null);
  assert.equal(accessOutcome(new Error("offline")), null);
  assert.equal(adminTitle("denied"), "Page not found | Toone");
  assert.equal(adminTitle("authorized"), "Codes | Toone");
  assert.equal(adminTitle("checking"), "Account | Toone");
});

/* ---- wire: create body and the cursor-paged redemption ledger */

const env = process.env as Record<string, string | undefined>;
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; delete env.NEXT_PUBLIC_API_BASE_URL; });

function stub(replies: unknown[]) {
  const calls: { url: string; body: unknown }[] = [];
  env.NEXT_PUBLIC_API_BASE_URL = "https://api.test/v1";
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ data: replies.shift() }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return calls;
}

test("the form's body reaches POST /admin/invitations unchanged", async () => {
  const calls = stub([{ id: "inv_1", code: "LAUNCH26", benefit: { kind: "pro_days", value: 30 }, admits_signup: false, campaign: "launch" }]);
  await createCodeInvitation("tok", body({ benefit: "pro_days", benefitValue: 30, audience: "shared", maxUses: 100, campaign: "launch" }));
  assert.equal(calls[0].url, "https://api.test/v1/admin/invitations");
  assert.deepEqual(calls[0].body, {
    recipient_name: "Launch", code: "", days: 7, max_uses: 100, campaign: "launch",
    benefit: { kind: "pro_days", value: 30 }, admits_signup: false,
  });
});

test("redemptions page by cursor and read the contract's entry shape", async () => {
  const calls = stub([
    { entries: [{ redeemed_at: "2026-11-12T09:00:00Z", account_id: "usr_1", channel: "account", benefit_kind: "pro_days", benefit_value: 30 }],
      has_more: true, next_cursor: "c2" },
    { entries: [{ redeemed_at: "2026-11-11T09:00:00Z", account_id: null, channel: "signup", benefit_kind: "free_creations", benefit_value: 3 }],
      has_more: false, next_cursor: null },
  ]);
  const first = await listCodeLedger("tok", "inv/1");
  assert.equal(calls[0].url, "https://api.test/v1/admin/invitations/inv%2F1/redemptions?limit=50");
  assert.deepEqual(first, {
    entries: [{ redeemed_at: "2026-11-12T09:00:00Z", account_id: "usr_1", channel: "account", benefit: { kind: "pro_days", value: 30 } }],
    has_more: true, next_cursor: "c2",
  });
  const second = await listCodeLedger("tok", "inv/1", { cursor: first.next_cursor, loaded: 1 });
  assert.equal(calls[1].url, "https://api.test/v1/admin/invitations/inv%2F1/redemptions?limit=50&cursor=c2");
  assert.equal(second.entries[0].account_id, null, "an erased account reads as null");
  assert.deepEqual(second.entries[0].benefit, { kind: "free_creations", value: 3 });
});

test("a server that pages by offset still advances (no cursor sent)", async () => {
  const calls = stub([{ entries: [], has_more: false }]);
  await listCodeLedger("tok", "inv_1", { loaded: 50 });
  assert.equal(calls[0].url, "https://api.test/v1/admin/invitations/inv_1/redemptions?limit=50&offset=50");
  assert.deepEqual(normalizeCodeLedgerPage([{ user_id: "usr_a", created_at: "2026-11-01T00:00:00Z", benefit: { kind: "pro_lifetime" } }]), {
    entries: [{ redeemed_at: "2026-11-01T00:00:00Z", account_id: "usr_a", channel: "", benefit: { kind: "pro_lifetime", value: null } }],
    has_more: false, next_cursor: null,
  });
});
