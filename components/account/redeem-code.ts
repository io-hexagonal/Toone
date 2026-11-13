/**
 * Redeemable code helpers for /redeem and the account page: reading a code
 * from a link, normalizing it, and choosing the copy for each outcome.
 */

import type { BillingFailure, CodeBenefit, Entitlement } from "@/lib/billing/api";

/**
 * At most 64 letters or digits once spaces and hyphens are removed. The
 * server decides everything else (minimum length, whether it exists).
 */
const CANONICAL_CODE = /^[A-Z0-9]{1,64}$/;
/** What a person may type or paste: letters, digits, spaces and hyphens. */
const TYPED_CODE = /^[A-Za-z0-9\s-]{1,80}$/;

/**
 * The canonical form of a code (upper case, no spaces or hyphens), or null
 * when it cannot be a code. Codes match case- and hyphen-insensitively.
 */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!TYPED_CODE.test(trimmed)) return null;
  const canonical = trimmed.toUpperCase().replace(/[\s-]/g, "");
  return CANONICAL_CODE.test(canonical) ? canonical : null;
}

/**
 * The code a link carries in its fragment (`/redeem#code=…`), as typed, or
 * null. The fragment never reaches a server or an analytics request; a
 * `?code=` query is ignored on purpose.
 */
export function codeFromFragment(hash: string): string | null {
  if (!hash || hash.length > 512) return null;
  let value: string | null;
  try {
    value = new URLSearchParams(hash.replace(/^#/, "")).get("code");
  } catch {
    return null;
  }
  if (value === null) return null;
  return normalizeCode(value) ? value.trim().toUpperCase() : null;
}

/**
 * The address to show once the code has been read: the same path, no query
 * code, no fragment. Other query parameters are kept.
 */
export function locationWithoutCode(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  params.delete("code");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export type BenefitCopy =
  | { key: "benefitProDays"; values: { days: number } }
  | { key: "benefitProLifetime" }
  | { key: "benefitFreeCreations"; values: { count: number } }
  | { key: "benefitUnknown" };

/** The `account.redeem.*` key (and values) naming what a code gives. */
export function benefitCopy(benefit: CodeBenefit): BenefitCopy {
  if (benefit.kind === "pro_days" && benefit.value) return { key: "benefitProDays", values: { days: benefit.value } };
  if (benefit.kind === "pro_lifetime") return { key: "benefitProLifetime" };
  if (benefit.kind === "free_creations" && benefit.value) return { key: "benefitFreeCreations", values: { count: benefit.value } };
  return { key: "benefitUnknown" };
}

export type RedeemDoneCopy =
  | { key: "doneProUntil"; date: string }
  | { key: "doneProForGood" }
  | { key: "doneCreations"; values: { limit: number } }
  | { key: "doneGeneric" };

/** The success line after redeeming, from the benefit and the updated entitlement. */
export function redeemDoneCopy(benefit: CodeBenefit, entitlement: Entitlement): RedeemDoneCopy {
  if (benefit.kind === "free_creations" && entitlement.free_routine_creations) {
    return { key: "doneCreations", values: { limit: entitlement.free_routine_creations.limit } };
  }
  if (benefit.kind === "pro_days" || benefit.kind === "pro_lifetime") {
    if (entitlement.plan === "pro" && entitlement.expires_at) return { key: "doneProUntil", date: entitlement.expires_at };
    if (entitlement.plan === "pro") return { key: "doneProForGood" };
  }
  return { key: "doneGeneric" };
}

export type RedeemErrorKey =
  | "errInvalid"
  | "errUsed"
  | "errVerify"
  | "errAlreadyProAppStore"
  | "errAlreadyProPaid"
  | "errAlreadyPro"
  | "errUnavailable"
  | "errRate"
  | "errGeneric";

/**
 * The `account.redeem.*` key for a failed check or redeem. Every invalid case
 * (unknown, expired, revoked, used up, signup-only) reads the same on purpose.
 * `unauthenticated` is handled by the caller (the session ends).
 */
export function redeemErrorKey(failure: BillingFailure): RedeemErrorKey {
  switch (failure.kind) {
    case "invalid_code":
      return "errInvalid";
    case "code_already_redeemed":
      return "errUsed";
    case "email_verification_required":
      return "errVerify";
    case "already_pro":
      if (failure.provider === "app_store") return "errAlreadyProAppStore";
      if (failure.provider === "stripe" || failure.source === "lifetime" || failure.source === "subscription") return "errAlreadyProPaid";
      return "errAlreadyPro";
    case "payments_unavailable":
      return "errUnavailable";
    case "rate_limited":
      return "errRate";
    default:
      return "errGeneric";
  }
}

/** A date as the redeem page writes it ("December 1, 2026"); the raw value when it is not a date. */
export function formatRedeemDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

/* ---- creating an account with a code on /redeem */

/**
 * What a sign-up with a code did with it:
 * - `applied`: the new account got what the code gives; show it.
 * - `waits_for_email`: a shared code's benefit waits until the address is confirmed.
 * - `ask_server`: a Google or Apple sign-in may have been an existing account,
 *   which ignores the code; `providerSignupState` decides from a code check.
 */
export type SignupCodeState = "applied" | "waits_for_email" | "ask_server";

export function signupCodeState(via: "email" | "google" | "apple", benefit: CodeBenefit | null, shared: boolean): SignupCodeState {
  if (via !== "email") return "ask_server";
  // An email sign-up always creates the account: an existing address is refused.
  return benefit && shared ? "waits_for_email" : "applied";
}

/**
 * After a Google or Apple sign-in with a code: if the code can still be
 * redeemed on this account, the sign-in was an existing account and the code
 * is unused (`redeem`: run the usual redeem flow). If it is used up or this
 * account already used it, the sign-up used it (`applied`). Any other refusal
 * is the redeem flow's to explain (already Pro, email to confirm, ...).
 */
export function providerSignupState(check: { ok: true } | { ok: false; failure: BillingFailure }): "applied" | "redeem" {
  if (check.ok) return "redeem";
  return check.failure.kind === "invalid_code" || check.failure.kind === "code_already_redeemed" ? "applied" : "redeem";
}

/** The redeem errors that mean "this account already has Toone Pro" (409): the code is not used up. */
export function isAlreadyProError(key: RedeemErrorKey | null): boolean {
  return key === "errAlreadyProAppStore" || key === "errAlreadyProPaid" || key === "errAlreadyPro";
}
