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
