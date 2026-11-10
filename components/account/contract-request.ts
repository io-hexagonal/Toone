/**
 * The login-free withdrawal and cancellation form: input checks and the
 * outcome of a submission. The answer is the same whether or not a matching
 * purchase exists, so the page never tells anyone whether an account exists.
 */

import {
  CONTRACT_NAME_MAX,
  billingFailure,
  normalizeOrderRef,
  type ContractKind,
  type ContractRequest,
} from "@/lib/billing/api";

export type { ContractKind };

/** Longest order reference the field accepts (`TOONE-` + 64). */
export const ORDER_REF_MAX = 70;
export { CONTRACT_NAME_MAX };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContractInputError = "errEmail" | "errOrderRef" | "errName";

/**
 * The request to send, or which field to fix. The order reference must look
 * like `TOONE-…` (the server refuses anything else with a 400); the name is
 * optional.
 */
export function contractRequestFrom(
  kind: ContractKind,
  email: string,
  orderRef: string,
  name = "",
): { ok: true; request: ContractRequest } | { ok: false; error: ContractInputError } {
  const cleanEmail = email.trim();
  const cleanRef = normalizeOrderRef(orderRef);
  const cleanName = name.trim();
  if (!EMAIL.test(cleanEmail) || cleanEmail.length > 254) return { ok: false, error: "errEmail" };
  if (!cleanRef) return { ok: false, error: "errOrderRef" };
  if ([...cleanName].length > CONTRACT_NAME_MAX || /[\u0000-\u001f\u007f]/.test(cleanName)) return { ok: false, error: "errName" };
  const request: ContractRequest = { kind, email: cleanEmail, order_ref: cleanRef };
  if (cleanName) request.name = cleanName;
  return { ok: true, request };
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
