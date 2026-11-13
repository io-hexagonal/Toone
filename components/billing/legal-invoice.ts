/**
 * The line that describes a Direct-mode legal invoice, shared by the success
 * page (`billing.success.*`) and the account page (`account.page.*`), which
 * both carry the same `invoice*` keys.
 */

import type { LegalInvoice } from "@/lib/billing/api";

export type LegalInvoiceCopy =
  | { key: "invoicePending" | "invoiceIssued" }
  | { key: "invoiceNumber"; values: { number: string } }
  | { key: "invoiceNumberAtcud"; values: { number: string; atcud: string } };

/** Null when there is no legal invoice to mention (other modes, older servers). */
export function legalInvoiceCopy(invoice: LegalInvoice | null | undefined): LegalInvoiceCopy | null {
  if (!invoice) return null;
  if (invoice.status === "pending") return { key: "invoicePending" };
  if (!invoice.number) return { key: "invoiceIssued" };
  return invoice.atcud
    ? { key: "invoiceNumberAtcud", values: { number: invoice.number, atcud: invoice.atcud } }
    : { key: "invoiceNumber", values: { number: invoice.number } };
}
