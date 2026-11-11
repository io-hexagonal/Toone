/**
 * Confirming the account's email address on the website: the code the
 * verification email carries, and how each failure reads. Redeeming a code,
 * and a shared code's signup benefit, wait for a confirmed address.
 */

import { EMAIL_CODE_DIGITS, type BillingFailure } from "@/lib/billing/api";

/** The code as typed (spaces and hyphens allowed), as its digits; null unless exactly six. */
export function normalizeEmailCode(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "");
  return new RegExp(`^\\d{${EMAIL_CODE_DIGITS}}$`).test(digits) ? digits : null;
}

export type VerifyErrorKey = "errCode" | "errRate" | "errUnavailable" | "errGeneric";

/**
 * What a failed send or confirm means: `verified` when the address turns out
 * to be confirmed already (nothing left to do), `session` when the sign-in
 * ended, otherwise the `account.verify.*` error key.
 */
export function verifyFailure(failure: BillingFailure): "verified" | "session" | VerifyErrorKey {
  if (failure.kind === "unauthenticated") return "session";
  if (failure.kind === "unknown" && failure.status === 409 && failure.code === "already_verified") return "verified";
  if (failure.kind === "invalid_code") return "errCode";
  if (failure.kind === "rate_limited") return "errRate";
  if (failure.kind === "payments_unavailable") return "errUnavailable";
  return "errGeneric";
}
