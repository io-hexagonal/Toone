import assert from "node:assert/strict";
import test from "node:test";
import {
  benefitCopy,
  codeFromFragment,
  locationWithoutCode,
  normalizeCode,
  redeemDoneCopy,
  redeemErrorKey,
} from "../../components/account/redeem-code";
import { normalizeEntitlement, type BillingFailure } from "../../lib/billing/api";

/* /redeem reads the code from the fragment only, normalizes it like the server, and picks one copy per outcome. */

test("the code is read from the #code= fragment, never from the query", () => {
  assert.equal(codeFromFragment("#code=LAUNCH-2026-PRO"), "LAUNCH-2026-PRO");
  assert.equal(codeFromFragment("#code=launch-2026-pro"), "LAUNCH-2026-PRO");
  assert.equal(codeFromFragment("#email=a%40b.c&code=PRO30%20ABCD"), "PRO30 ABCD");
  assert.equal(codeFromFragment("code=PLUS3XYZ"), "PLUS3XYZ", "a hash without the leading # still parses");
  for (const hash of ["", "#", "#codes=PRO30ABC", "#code=", "#code=--", "#code=%3Cscript%3E", "#code=" + "A".repeat(65),
    "#code=PRO30%2F..%2Fadmin", "#code=" + "A".repeat(600)]) {
    assert.equal(codeFromFragment(hash), null, hash);
  }
});

test("after reading, the address keeps the path and other query parameters but no code", () => {
  assert.equal(locationWithoutCode("/en/redeem", ""), "/en/redeem");
  assert.equal(locationWithoutCode("/en/redeem", "?code=LEAKED123"), "/en/redeem");
  assert.equal(locationWithoutCode("/de/redeem", "?utm_source=mail&code=X"), "/de/redeem?utm_source=mail");
});

test("normalization matches the server: case, spaces and hyphens do not matter; at most 64 letters or digits", () => {
  assert.equal(normalizeCode(" launch-2026 pro "), "LAUNCH2026PRO");
  assert.equal(normalizeCode("pro30"), "PRO30");
  assert.equal(normalizeCode(" - "), null);
  assert.equal(normalizeCode("A".repeat(64)), "A".repeat(64));
  assert.equal(normalizeCode("A".repeat(65)), null);
  for (const bad of ["PRO_30_DAYS", "PRÖ30DAYS", "PRO30;DROP", "", "   ", null, 42]) {
    assert.equal(normalizeCode(bad), null, String(bad));
  }
});

const failure = (f: BillingFailure) => redeemErrorKey(f);

test("each redeem failure has its own copy; every invalid case reads the same", () => {
  assert.equal(failure({ kind: "invalid_code" }), "errInvalid");
  assert.equal(failure({ kind: "code_already_redeemed" }), "errUsed");
  assert.equal(failure({ kind: "email_verification_required" }), "errVerify");
  assert.equal(failure({ kind: "already_pro", source: "subscription", provider: "app_store" }), "errAlreadyProAppStore");
  assert.equal(failure({ kind: "already_pro", source: "subscription", provider: "stripe" }), "errAlreadyProPaid");
  assert.equal(failure({ kind: "already_pro", source: "lifetime", provider: null }), "errAlreadyProPaid");
  assert.equal(failure({ kind: "already_pro", source: null, provider: null }), "errAlreadyPro");
  assert.equal(failure({ kind: "payments_unavailable" }), "errUnavailable");
  assert.equal(failure({ kind: "rate_limited" }), "errRate");
  assert.equal(failure({ kind: "unknown", status: 500, code: "internal", message: "x" }), "errGeneric");
  assert.equal(failure({ kind: "forbidden" }), "errGeneric");
});

test("benefit and success copy follow the benefit and the returned entitlement", () => {
  assert.deepEqual(benefitCopy({ kind: "pro_days", value: 30 }), { key: "benefitProDays", values: { days: 30 } });
  assert.deepEqual(benefitCopy({ kind: "pro_lifetime", value: null }), { key: "benefitProLifetime" });
  assert.deepEqual(benefitCopy({ kind: "free_creations", value: 3 }), { key: "benefitFreeCreations", values: { count: 3 } });
  assert.deepEqual(benefitCopy({ kind: "unknown", value: 2 }), { key: "benefitUnknown" });
  assert.deepEqual(benefitCopy({ kind: "pro_days", value: null }), { key: "benefitUnknown" });

  const pro = normalizeEntitlement({ plan: "pro", source: "grant", expires_at: "2026-12-10T00:00:00Z", free_routine_creations: { used: 0, limit: 2 } });
  assert.deepEqual(redeemDoneCopy({ kind: "pro_days", value: 30 }, pro), { key: "doneProUntil", date: "2026-12-10T00:00:00Z" });
  const forever = normalizeEntitlement({ plan: "pro", source: "grant", expires_at: null });
  assert.deepEqual(redeemDoneCopy({ kind: "pro_lifetime", value: null }, forever), { key: "doneProForGood" });
  const free = normalizeEntitlement({ plan: "free", free_routine_creations: { used: 1, limit: 5 } });
  assert.deepEqual(redeemDoneCopy({ kind: "free_creations", value: 3 }, free), { key: "doneCreations", values: { limit: 5 } });
  assert.deepEqual(redeemDoneCopy({ kind: "unknown", value: null }, free), { key: "doneGeneric" });
});
