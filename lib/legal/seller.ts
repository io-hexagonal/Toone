/**
 * Who sells Toone Pro on trytoone.com. The Terms, the Privacy Policy and the
 * Legal notice render the matching text from this one constant.
 *
 * - `"managed_payments"`: Stripe Managed Payments. Sold through Link, LLC (a
 *   Stripe company) is the seller and merchant of record. It collects VAT or
 *   sales tax and sends the receipts and invoices.
 * - `"direct"`: the trader in `lib/legal/trader.ts` is the seller. Stripe
 *   Payments Europe processes the payments, Stripe Tax calculates VAT, and the
 *   trader issues a Portuguese legal invoice for every payment.
 *
 * Whichever model is ready first goes live. The API says which one sells new
 * purchases (`features.billing_seller` on `GET /capabilities`), and the legal
 * pages render from that answer. `TOONE_PRO_SELLER` is only the fallback for
 * when the API does not say (unreachable, or a version without the field):
 * keep it equal to the live setting.
 */
export const TOONE_PRO_SELLERS = ["managed_payments", "direct"] as const;
export type TooneProSeller = (typeof TOONE_PRO_SELLERS)[number];

export const TOONE_PRO_SELLER: TooneProSeller = "managed_payments";

/** The seller model the API advertises, or null when the value is missing or unknown. */
export function sellerFromServer(value: unknown): TooneProSeller | null {
  if (value === "managed_payments" || value === "managed") return "managed_payments";
  if (value === "direct") return "direct";
  return null;
}

/** The seller model the legal pages render: the API's answer, else the fallback constant. */
export function currentSeller(fromServer: TooneProSeller | null | undefined, fallback: TooneProSeller = TOONE_PRO_SELLER): TooneProSeller {
  return fromServer ?? fallback;
}

export function isManagedPayments(seller: TooneProSeller): boolean {
  return seller === "managed_payments";
}

/** The Stripe entity that processes payments for an EEA Stripe account. */
export const STRIPE_EU_ENTITY = "Stripe Payments Europe, Limited";
/** The merchant of record under Stripe Managed Payments. */
export const LINK_SELLER_ENTITY = "Sold through Link, LLC";

/** Direct model only: the legal invoice is issued within this many working days of a payment. */
export const DIRECT_INVOICE_WORKING_DAYS = 5;
