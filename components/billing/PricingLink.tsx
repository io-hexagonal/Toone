"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { Link } from "@/lib/navigation";
import { getBillingFeaturesOrOff } from "@/lib/billing/api";

let checkoutAvailable: Promise<boolean> | null = null;

function loadCheckoutAvailable(): Promise<boolean> {
  checkoutAvailable ??= getBillingFeaturesOrOff().then(
    (flags) => flags.stripe_pro_checkout,
    () => false,
  );
  return checkoutAvailable;
}

/**
 * The Pricing entry in the header and footer, shown only once web checkout is
 * available. The server HTML never contains it, so the link appears with the
 * launch without a redeploy; the page itself stays reachable either way.
 */
export default function PricingLink(props: ComponentProps<typeof Link>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let active = true;
    void loadCheckoutAvailable().then((on) => {
      if (active) setVisible(on);
    });
    return () => {
      active = false;
    };
  }, []);
  if (!visible) return null;
  return <Link {...props} />;
}
