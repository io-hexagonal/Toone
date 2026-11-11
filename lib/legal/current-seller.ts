import "server-only";
import { getBillingFeaturesOrOff } from "@/lib/billing/api";
import { currentSeller, type TooneProSeller } from "./seller";

/** How long the legal pages keep the API's seller answer, in seconds (the pricing page uses the same). */
export const SELLER_REVALIDATE_SECONDS = 300;

/**
 * Who sells new Toone Pro purchases right now, as the API says, with the
 * `TOONE_PRO_SELLER` fallback when it says nothing usable. A purchase keeps
 * the seller it was made under: the Terms say so.
 */
export async function loadSeller(): Promise<TooneProSeller> {
  const features = await getBillingFeaturesOrOff({ next: { revalidate: SELLER_REVALIDATE_SECONDS } });
  return currentSeller(features.billing_seller);
}
