"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  billingFailure,
  planParam,
  startCheckout,
  type BillingFailure,
  type BillingReturn,
  type ProPlanId,
} from "@/lib/billing/api";

/**
 * Starts a Stripe Checkout for one plan and leaves for the URL the API
 * returned (the client only follows allow-listed Stripe hosts). One request
 * at a time: a double click or a second button never opens two sessions.
 */
export default function CheckoutButton({
  plan,
  token,
  returnTo,
  label,
  busyLabel,
  className,
  onStart,
  onFailure,
  disabled = false,
}: {
  plan: ProPlanId;
  token: string;
  returnTo: BillingReturn;
  label: string;
  busyLabel: string;
  className?: string;
  /** Called when a checkout request goes out (clear old errors). */
  onStart?: () => void;
  onFailure: (failure: BillingFailure) => void;
  disabled?: boolean;
}) {
  const locale = useLocale();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  // Coming back from Stripe with the Back button restores this page from the
  // back-forward cache with the button still busy: release it.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      busyRef.current = false;
      setBusy(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function start() {
    if (busyRef.current || disabled) return;
    busyRef.current = true;
    setBusy(true);
    onStart?.();
    try {
      const session = await startCheckout(token, { plan, locale, return: returnTo });
      // Stay busy while the browser leaves for Stripe.
      window.location.assign(session.checkout_url);
    } catch (error) {
      busyRef.current = false;
      setBusy(false);
      onFailure(billingFailure(error));
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={() => void start()}
      data-umami-event="pro-checkout-start"
      data-umami-event-plan={planParam(plan)}
    >
      {busy ? busyLabel : label}
    </button>
  );
}
