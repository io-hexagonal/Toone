/**
 * The two ways Toone Pro is sold on trytoone.com. The Terms, the Privacy
 * Policy and the Legal notice describe both, and say which applies to a
 * purchase: the one checkout showed and the purchase confirmation email names.
 * A purchase keeps the seller it was made under, so after a switch the
 * purchases of both models keep their own text.
 *
 * - `"managed_payments"`: Stripe Managed Payments. Sold through Link, LLC (a
 *   Stripe company) is the seller and merchant of record. It collects VAT or
 *   sales tax and sends the receipts and invoices.
 * - `"direct"`: the trader in `lib/legal/trader.ts` is the seller. Stripe
 *   Payments Europe processes the payments, Stripe Tax calculates VAT, and the
 *   trader issues a Portuguese legal invoice for every payment.
 *
 * Which one sells NEW purchases comes from the API (top-level `billing_seller`
 * on `GET /capabilities`). The legal pages only use it for one sentence
 * ("new purchases are currently sold …") and leave that sentence out when the
 * API does not say; nothing else on them depends on it.
 */
export const TOONE_PRO_SELLERS = ["managed_payments", "direct"] as const;
export type TooneProSeller = (typeof TOONE_PRO_SELLERS)[number];

/** The seller model the API advertises, or null when the value is missing or unknown. */
export function sellerFromServer(value: unknown): TooneProSeller | null {
  if (value === "managed_payments" || value === "managed") return "managed_payments";
  if (value === "direct") return "direct";
  return null;
}

export function isManagedPayments(seller: TooneProSeller): boolean {
  return seller === "managed_payments";
}

/** How the legal pages name each way of selling, as in "a purchase sold through Link". */
export const SOLD_BY: Record<TooneProSeller, string> = {
  managed_payments: "sold through Link",
  direct: "sold by Toone",
};

/**
 * The one sentence that depends on the live setting: who sells new purchases.
 * Null when the API did not say, so the pages never guess.
 */
export function newPurchasesSentence(seller: TooneProSeller | null | undefined): string | null {
  return seller ? `New purchases are currently ${SOLD_BY[seller]}.` : null;
}

/** The Stripe entity that processes payments for an EEA Stripe account. */
export const STRIPE_EU_ENTITY = "Stripe Payments Europe, Limited";
/** The merchant of record under Stripe Managed Payments. */
export const LINK_SELLER_ENTITY = "Sold through Link, LLC";

/** Direct model only: the legal invoice is issued within this many working days of a payment. */
export const DIRECT_INVOICE_WORKING_DAYS = 5;
