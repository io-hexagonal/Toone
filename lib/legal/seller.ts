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
 * Whichever model is ready first goes live. The value must match how checkout
 * is actually configured on the day the site is deployed: change it in the same
 * release that switches checkout, never ahead of it.
 */
export const TOONE_PRO_SELLERS = ["managed_payments", "direct"] as const;
export type TooneProSeller = (typeof TOONE_PRO_SELLERS)[number];

export const TOONE_PRO_SELLER: TooneProSeller = "managed_payments";

export function isManagedPayments(seller: TooneProSeller): boolean {
  return seller === "managed_payments";
}

/** The Stripe entity that processes payments for an EEA Stripe account. */
export const STRIPE_EU_ENTITY = "Stripe Payments Europe, Limited";
/** The merchant of record under Stripe Managed Payments. */
export const LINK_SELLER_ENTITY = "Sold through Link, LLC";

/**
 * Direct model only: countries Toone Pro is not sold to until the trader is
 * registered for their consumption tax (the UK charges VAT from the first sale
 * to a consumer). A purchase from one of them is refunded in full and Pro is
 * not activated. Empty the list, in the same release, once registered.
 */
export const DIRECT_BLOCKED_COUNTRIES: readonly string[] = ["the United Kingdom"];

/** Direct model only: the legal invoice is issued within this many working days of a payment. */
export const DIRECT_INVOICE_WORKING_DAYS = 5;

/** "a, b and c" */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
