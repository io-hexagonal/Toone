/** The small set of billing outcomes pages branch on, mapped from API errors. */

import { ApiError } from "../api";

/** Where an account's Pro comes from (`GET /me/entitlement` `source`). */
export type ProSource = "lifetime" | "subscription" | "grant" | "guest" | "unknown";
/** Who bills the account's Pro, when it is paid. */
export type BillingProvider = "app_store" | "stripe" | "toone" | "unknown";

export type BillingFailure =
  /** The session ended (expired or revoked): sign in again. */
  | { kind: "unauthenticated" }
  /** The account already has Pro; `source`/`provider` say how, when known. */
  | { kind: "already_pro"; source: ProSource | null; provider: BillingProvider | null }
  /** Payments (or this billing feature) are switched off right now. */
  | { kind: "payments_unavailable" }
  /** The code does not exist, expired, is used up or is not for this account. One case on purpose. */
  | { kind: "invalid_code" }
  | { kind: "code_already_redeemed" }
  /** The account must confirm its email address before this works. */
  | { kind: "email_verification_required" }
  | { kind: "rate_limited" }
  /** The signed-in account may not do this (admin routes). */
  | { kind: "forbidden" }
  /** Anything else, including network failures (`status` 0) and refused redirect URLs. */
  | { kind: "unknown"; status: number; code: string; message: string };

export type BillingFailureKind = BillingFailure["kind"];

/** Thrown by every call in `lib/billing/api.ts`. */
export class BillingError extends Error {
  readonly failure: BillingFailure;

  constructor(failure: BillingFailure, message?: string) {
    super(message ?? (failure.kind === "unknown" ? failure.message : failure.kind));
    this.name = "BillingError";
    this.failure = failure;
  }
}

const SESSION_CODES = new Set(["unauthorized", "invalid_token", "token_expired"]);
const INVALID_CODE_CODES = new Set(["invalid_invitation", "invalid_code"]);
const UNAVAILABLE_CODES = new Set(["payments_unavailable", "payments_disabled", "service_unavailable", "provider_error"]);
const RATE_CODES = new Set(["rate_limit_exceeded", "rate_limited", "quota_exceeded"]);

const PRO_SOURCES: readonly ProSource[] = ["lifetime", "subscription", "grant", "guest"];
const PROVIDERS: readonly BillingProvider[] = ["app_store", "stripe", "toone"];

/** A known value, "unknown" for any other string, null when absent. */
export function enumValue<T extends string>(value: unknown, known: readonly T[]): T | "unknown" | null {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" && (known as readonly string[]).includes(value) ? (value as T) : "unknown";
}

export function proSource(value: unknown): ProSource | null {
  return enumValue(value, PRO_SOURCES);
}

export function billingProvider(value: unknown): BillingProvider | null {
  return enumValue(value, PROVIDERS);
}

/**
 * Maps an API error to a billing outcome. `extra` carries fields some
 * errors add next to `code` (the `already_pro` source).
 */
export function mapApiError(error: ApiError, extra: { source?: unknown; provider?: unknown } = {}): BillingFailure {
  const { code, status } = error;
  if (status === 401 || SESSION_CODES.has(code)) return { kind: "unauthenticated" };
  if (code === "already_pro") {
    return { kind: "already_pro", source: proSource(extra.source), provider: billingProvider(extra.provider) };
  }
  if (code === "code_already_redeemed") return { kind: "code_already_redeemed" };
  if (code === "email_verification_required") return { kind: "email_verification_required" };
  if (INVALID_CODE_CODES.has(code)) return { kind: "invalid_code" };
  if (status === 429 || RATE_CODES.has(code)) return { kind: "rate_limited" };
  if (status === 503 || UNAVAILABLE_CODES.has(code)) return { kind: "payments_unavailable" };
  if (status === 403 && code === "forbidden") return { kind: "forbidden" };
  return { kind: "unknown", status, code, message: error.message };
}

/** The billing outcome for anything a billing call (or `fetch`) threw. */
export function billingFailure(error: unknown): BillingFailure {
  if (error instanceof BillingError) return error.failure;
  if (error instanceof ApiError) return mapApiError(error);
  if (error instanceof Error && error.name === "AbortError") {
    return { kind: "unknown", status: 0, code: "aborted", message: "Request cancelled" };
  }
  const message = error instanceof Error && error.message ? error.message : "Network request failed";
  return { kind: "unknown", status: 0, code: "network_error", message };
}

/** Rethrows anything as a BillingError. */
export function asBillingError(error: unknown): BillingError {
  return error instanceof BillingError ? error : new BillingError(billingFailure(error));
}
