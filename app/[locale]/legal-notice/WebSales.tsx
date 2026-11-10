import { LINK_SUPPORT_URL, LINK_TERMS_URL } from "@/lib/legal/terms";
import {
  LINK_SELLER_ENTITY,
  STRIPE_EU_ENTITY,
  isManagedPayments,
  type TooneProSeller,
} from "@/lib/legal/seller";

/** Who sells Toone Pro on trytoone.com, following the seller model in lib/legal/seller.ts. */
export default function WebSales({ seller }: { seller: TooneProSeller }) {
  if (isManagedPayments(seller)) {
    return (
      <p>
        Web purchases of Toone Pro are sold through Stripe&apos;s Managed Payments service. The
        seller of the transaction and merchant of record is {LINK_SELLER_ENTITY}, a Stripe company,
        under its <a href={LINK_TERMS_URL}>Sold through Link terms</a>. It collects VAT and issues
        receipts and invoices. Payment support is at <a href={LINK_SUPPORT_URL}>Link support</a>.
        The trader above provides Toone Pro and its product support. The purchase terms are in the{" "}
        <a href="/en/terms#toone-pro">Terms</a>.
      </p>
    );
  }
  return (
    <p>
      Web purchases of Toone Pro are sold by the trader above, who issues a Portuguese legal invoice
      for every payment. Payments are processed by {STRIPE_EU_ENTITY}, in Ireland. The purchase
      terms, including invoices and VAT, are in the <a href="/en/terms#toone-pro">Terms</a>.
    </p>
  );
}
