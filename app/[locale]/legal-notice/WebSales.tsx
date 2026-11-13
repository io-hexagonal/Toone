import { LINK_SUPPORT_URL, LINK_TERMS_URL } from "@/lib/legal/terms";
import {
  LINK_SELLER_ENTITY,
  STRIPE_EU_ENTITY,
  newPurchasesSentence,
  type TooneProSeller,
} from "@/lib/legal/seller";

/**
 * Who sells Toone Pro on trytoone.com. Both ways are always named: a purchase
 * keeps the seller it was made under. `seller` (who sells NEW purchases, from
 * the API; null when unknown) only adds the "currently sold" sentence.
 */
export default function WebSales({ seller = null }: { seller?: TooneProSeller | null }) {
  const current = newPurchasesSentence(seller);
  return (
    <>
      <p>
        Web purchases of Toone Pro are sold in one of two ways. Checkout shows which one applies
        before you pay, the purchase confirmation email names it, and a purchase keeps it for its
        renewals and refunds.{current ? <> {current}</> : null}
      </p>
      <p id="sold-through-link">
        <strong>Sold through Link:</strong> sold through Stripe&apos;s Managed Payments service. The
        seller of the transaction and merchant of record is {LINK_SELLER_ENTITY}, a Stripe company,
        under its <a href={LINK_TERMS_URL}>Sold through Link terms</a>. It collects VAT and issues
        receipts and invoices. Payment support is at <a href={LINK_SUPPORT_URL}>Link support</a>.
        The trader above provides Toone Pro and its product support.
      </p>
      <p id="sold-by-toone">
        <strong>Sold by Toone:</strong> sold by the trader above, who issues a Portuguese legal
        invoice for every payment. Payments are processed by {STRIPE_EU_ENTITY}, in Ireland.
      </p>
      <p>
        The purchase terms, including invoices and VAT, are in the{" "}
        <a href="/en/terms#toone-pro">Terms</a>.
      </p>
    </>
  );
}
