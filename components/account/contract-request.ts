/**
 * The login-free withdrawal and cancellation form: input checks and the
 * outcome of a submission. Pressing the final button is the declaration
 * itself; the answer is the same whether or not a matching purchase exists,
 * so the page never tells anyone whether an account exists.
 */

import {
  CONTRACT_NOT_RECEIVED,
  CONTRACT_NAME_MAX,
  CONTRACT_REASON_MAX,
  billingFailure,
  normalizeOrderRef,
  type ContractKind,
  type ContractRequest,
  type ContractTermination,
} from "@/lib/billing/api";

export type { ContractKind, ContractTermination };

/** Longest order reference the field accepts (`TOONE-` + 64). */
export const ORDER_REF_MAX = 70;
export { CONTRACT_NAME_MAX, CONTRACT_REASON_MAX };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type ContractInputError = "errEmail" | "errOrderRef" | "errName" | "errReason" | "errEndDate";

/** The input each validation error is about (its element id). */
export const CONTRACT_ERROR_FIELD: Readonly<Record<ContractInputError, string>> = Object.freeze({
  errEmail: "contract-email",
  errOrderRef: "contract-order",
  errName: "contract-name",
  errReason: "contract-reason",
  errEndDate: "contract-end-date",
});

/** What a cancellation asks for besides the purchase (§ 312k BGB): the type of termination and when it should take effect. */
export type CancelTerms = {
  termination: ContractTermination;
  /** Required for an extraordinary termination. */
  reason: string;
  /** `YYYY-MM-DD`, or "" for the next possible date. */
  endDate: string;
};

export const DEFAULT_CANCEL_TERMS: Readonly<CancelTerms> = Object.freeze({ termination: "ordinary", reason: "", endDate: "" });

/** Today's date in the visitor's time zone, as `YYYY-MM-DD`. */
export function localToday(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function validDate(value: string): boolean {
  const match = DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * The request to send, or which field to fix. The order reference must look
 * like `TOONE-…` (the server refuses anything else with a 400); the name is
 * optional. A cancellation also carries its type (an extraordinary one needs
 * a reason) and an end date after `today`, or none for the next possible date.
 */
export function contractRequestFrom(
  kind: ContractKind,
  email: string,
  orderRef: string,
  name = "",
  cancel: CancelTerms = DEFAULT_CANCEL_TERMS,
  today: string = localToday(),
): { ok: true; request: ContractRequest } | { ok: false; error: ContractInputError } {
  const cleanEmail = email.trim();
  const cleanRef = normalizeOrderRef(orderRef);
  const cleanName = name.trim();
  if (!EMAIL.test(cleanEmail) || cleanEmail.length > 254) return { ok: false, error: "errEmail" };
  if (!cleanRef) return { ok: false, error: "errOrderRef" };
  if ([...cleanName].length > CONTRACT_NAME_MAX || /[\u0000-\u001f\u007f]/.test(cleanName)) return { ok: false, error: "errName" };
  const request: ContractRequest = { kind, email: cleanEmail, order_ref: cleanRef };
  if (cleanName) request.name = cleanName;
  if (kind === "cancel") {
    request.termination = cancel.termination;
    if (cancel.termination === "extraordinary") {
      const reason = cancel.reason.trim();
      if (!reason || [...reason].length > CONTRACT_REASON_MAX || /[\u0000-\u0009\u000b-\u001f\u007f]/.test(reason)) {
        return { ok: false, error: "errReason" };
      }
      request.termination_reason = reason;
    }
    const endDate = cancel.endDate.trim();
    if (endDate) {
      if (!validDate(endDate) || endDate <= today) return { ok: false, error: "errEndDate" };
      request.end_date = endDate;
    }
  }
  return { ok: true, request };
}

export type ContractOutcome =
  /** Received (202): show the one acknowledgement (it took effect if the details matched a purchase). */
  | { state: "sent" }
  | { state: "error"; key: "errInput" | "errRate" | "errNotReceived" | "errGeneric" };

/**
 * What to show after `submitContractRequest` resolved (`error` undefined) or
 * threw. Only a resolved call (the server's 202) shows the sent step. A 503
 * means nothing was received: the page says so and the buyer sends it again.
 */
export function contractOutcome(error?: unknown): ContractOutcome {
  if (error === undefined) return { state: "sent" };
  const failure = billingFailure(error);
  if (failure.kind === "rate_limited") return { state: "error", key: "errRate" };
  if (failure.kind === "payments_unavailable") return { state: "error", key: "errNotReceived" };
  if (failure.kind === "unknown" && failure.code === CONTRACT_NOT_RECEIVED) return { state: "error", key: "errNotReceived" };
  if (failure.kind === "unknown" && failure.status === 400) return { state: "error", key: "errInput" };
  return { state: "error", key: "errGeneric" };
}

/** When the declaration was received: the server's time when it sent one, else the moment the answer came. */
export function receivedAt(serverTime: string | null, now: Date = new Date()): Date {
  const parsed = serverTime ? new Date(serverTime) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : now;
}
