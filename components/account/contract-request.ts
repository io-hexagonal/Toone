/**
 * The login-free withdrawal and cancellation form: input checks and the
 * outcome of a submission. The answer is the same whether or not a matching
 * purchase exists, so the page never tells anyone whether an account exists.
 */

import { billingFailure, type ContractRequest } from "@/lib/billing/api";

export type ContractKind = ContractRequest["kind"];

export const ORDER_REF_MAX = 120;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContractInputError = "errEmail" | "errOrderRef";

/** The request to send, or which field to fix. */
export function contractRequestFrom(
  kind: ContractKind,
  email: string,
  orderRef: string,
): { ok: true; request: ContractRequest } | { ok: false; error: ContractInputError } {
  const cleanEmail = email.trim();
  const cleanRef = orderRef.trim();
  if (!EMAIL.test(cleanEmail) || cleanEmail.length > 254) return { ok: false, error: "errEmail" };
  if (!cleanRef || cleanRef.length > ORDER_REF_MAX || /[\u0000-\u001f]/.test(cleanRef)) return { ok: false, error: "errOrderRef" };
  return { ok: true, request: { kind, email: cleanEmail, order_ref: cleanRef } };
}

export type ContractOutcome =
  /** Accepted: show the one success message (an email may or may not follow). */
  | { state: "sent" }
  | { state: "error"; key: "errInput" | "errRate" | "errUnavailable" | "errGeneric" };

/** What to show after `submitContractRequest` resolved (`error` undefined) or threw. */
export function contractOutcome(error?: unknown): ContractOutcome {
  if (error === undefined) return { state: "sent" };
  const failure = billingFailure(error);
  if (failure.kind === "rate_limited") return { state: "error", key: "errRate" };
  if (failure.kind === "payments_unavailable") return { state: "error", key: "errUnavailable" };
  if (failure.kind === "unknown" && failure.status === 400) return { state: "error", key: "errInput" };
  return { state: "error", key: "errGeneric" };
}
