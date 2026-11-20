/**
 * Goodwill refund requests for Toone Pro Lifetime (Terms § Withdrawal,
 * refunds and goodwill refunds, from 2026-11-20). A Lifetime purchase is
 * digital content whose withdrawal right ends once access starts, so it is
 * never refunded automatically; within 14 days of paying the buyer may ask
 * for a voluntary refund, with a reason, and the owner decides and refunds by
 * hand in the Stripe Dashboard (a full refund revokes lifetime Pro through
 * the charge.refunded webhook).
 *
 * This is NOT the statutory withdrawal: "Withdraw from contract here" keeps
 * needing no reason. The request goes through the website's contact route
 * (`/api/contact`, `kind: "goodwill_refund"`) to the team's Discord channel.
 * The checks here run in the form and again in the route.
 */

import { normalizeOrderRef } from "./api";
import { GOODWILL_REASON_MAX_LENGTH, GOODWILL_REASON_MIN_LENGTH } from "../legal/terms";

export { GOODWILL_REASON_MAX_LENGTH, GOODWILL_REASON_MIN_LENGTH };

/** The `kind` that marks a goodwill refund request on `/api/contact`. */
export const GOODWILL_REFUND_KIND = "goodwill_refund";
/** Longest optional name (characters), as on the withdraw/cancel form. */
export const GOODWILL_NAME_MAX = 200;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Control characters other than line breaks and tabs. */
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const LOCALE = /^[a-z]{2}$/;

/** What `/api/contact` receives for a goodwill refund request. */
export type GoodwillRefundRequest = {
  kind: typeof GOODWILL_REFUND_KIND;
  email: string;
  orderRef: string;
  reason: string;
  name?: string;
  locale: string;
};

export type GoodwillInputError = "goodwillErrEmail" | "goodwillErrOrderRef" | "goodwillErrReason" | "goodwillErrName";

/** The input each validation error is about (its element id on the contract page). */
export const GOODWILL_ERROR_FIELD: Readonly<Record<GoodwillInputError, string>> = Object.freeze({
  goodwillErrEmail: "goodwill-email",
  goodwillErrOrderRef: "goodwill-order",
  goodwillErrReason: "goodwill-reason",
  goodwillErrName: "goodwill-name",
});

/** Characters (not UTF-16 units) of a trimmed reason. */
export function reasonLength(reason: string): number {
  return [...reason.trim()].length;
}

/**
 * The request to send, or which field to fix: the purchase email, a TOONE-
 * order reference, a reason of 20 to 2000 characters and an optional name.
 * Unknown or malformed input (the route passes the parsed JSON body) is
 * refused, never coerced.
 */
export function goodwillRefundFrom(input: {
  email?: unknown;
  orderRef?: unknown;
  reason?: unknown;
  name?: unknown;
  locale?: unknown;
}): { ok: true; request: GoodwillRefundRequest } | { ok: false; error: GoodwillInputError } {
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const orderRef = normalizeOrderRef(input.orderRef);
  const locale = typeof input.locale === "string" && LOCALE.test(input.locale) ? input.locale : "en";
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "goodwillErrEmail" };
  if (!orderRef) return { ok: false, error: "goodwillErrOrderRef" };
  const length = reasonLength(reason);
  if (length < GOODWILL_REASON_MIN_LENGTH || length > GOODWILL_REASON_MAX_LENGTH || CONTROL.test(reason)) {
    return { ok: false, error: "goodwillErrReason" };
  }
  if ([...name].length > GOODWILL_NAME_MAX || /[\u0000-\u001f\u007f]/.test(name)) return { ok: false, error: "goodwillErrName" };
  const request: GoodwillRefundRequest = { kind: GOODWILL_REFUND_KIND, email, orderRef, reason, locale };
  if (name) request.name = name;
  return { ok: true, request };
}

/** Discord caps an embed field's value at 1024 characters. */
const FIELD_MAX = 1024;

function clip(value: string, max = FIELD_MAX): string {
  const chars = [...value];
  return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : value;
}

/** The reason, split over as many embed fields as it needs (a reason can be 2000 characters). */
function reasonFields(reason: string): { name: string; value: string; inline: boolean }[] {
  const chars = [...reason];
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += FIELD_MAX) parts.push(chars.slice(i, i + FIELD_MAX).join(""));
  return parts.map((value, index) => ({ name: index === 0 ? "Reason" : "Reason (continued)", value, inline: false }));
}

/** The Discord webhook body the team receives for a goodwill refund request. */
export function goodwillDiscordMessage(request: GoodwillRefundRequest, submittedAt: Date) {
  const fields = [
    { name: "Order", value: clip(request.orderRef), inline: true },
    { name: "Purchase email", value: clip(request.email), inline: true },
  ];
  if (request.name) fields.push({ name: "Name", value: clip(request.name), inline: true });
  fields.push(...reasonFields(request.reason));
  fields.push({ name: "Locale", value: request.locale, inline: true });
  fields.push({ name: "Submitted at", value: submittedAt.toISOString(), inline: true });
  return {
    embeds: [
      {
        title: "Goodwill refund request (Lifetime)",
        description:
          "Voluntary refund request for a Toone Pro Lifetime purchase. Check in Stripe that the order is Lifetime, " +
          "paid less than 14 days before this request, and that the purchase email matches. Review in Stripe; " +
          "refund by hand in the Dashboard (refund revokes lifetime Pro). Answer the buyer by email either way.",
        color: 0xf0ede6,
        fields,
      },
    ],
    // User text (reason, name) can never ping @everyone, @here, a role or a user.
    allowed_mentions: { parse: [] as string[] },
  };
}
