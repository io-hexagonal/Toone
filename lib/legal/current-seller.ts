import "server-only";
import { getBillingFeaturesOrOff } from "@/lib/billing/api";
import type { TooneProSeller } from "./seller";

/** How long the legal pages keep the API's seller answer, in seconds (the pricing page uses the same). */
export const SELLER_REVALIDATE_SECONDS = 300;

/**
 * Who sells NEW Toone Pro purchases right now, as the API says; null when it
 * says nothing usable (unreachable, or an older version). The legal pages
 * describe both sellers whatever the answer, so null only drops the
 * "currently sold" sentence: there is no fallback that could name the wrong
 * seller.
 */
export async function loadSeller(): Promise<TooneProSeller | null> {
  const features = await getBillingFeaturesOrOff({ next: { revalidate: SELLER_REVALIDATE_SECONDS } });
  return features.billing_seller;
}
