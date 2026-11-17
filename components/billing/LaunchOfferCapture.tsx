"use client";

import { useEffect } from "react";
import { campaignFromRef } from "@/components/account/redeem-code";
import { rememberCheckoutPromotion } from "@/lib/billing/checkout-promo";

/**
 * Product Hunt adds `?ref=producthunt` to every link it sends visitors
 * through, whichever page they land on. Any page so reached keeps the launch
 * discount for the checkout, not only /redeem.
 */
export default function LaunchOfferCapture() {
  useEffect(() => {
    if (campaignFromRef(window.location.search) === "producthunt") rememberCheckoutPromotion("PRODUCTHUNT");
  }, []);
  return null;
}
