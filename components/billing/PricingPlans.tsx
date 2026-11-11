"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { logout } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import {
  billingFailure,
  getEntitlement,
  planParam,
  type BillingFailure,
  type Entitlement,
  type Price,
  type ProPlanId,
} from "@/lib/billing/api";
import CheckoutButton from "./CheckoutButton";
import {
  FROM_APP_STORAGE_KEY,
  checkoutErrorKey,
  hasTemporaryPro,
  orderedPrices,
  ownedMessageKey,
  planAvailability,
  readPricingParams,
  signInHref,
  taxNoteKey,
  tidyPricingSearch,
  type PricingParams,
} from "./PricingPlans.helpers";

type EntitlementState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; entitlement: Entitlement }
  /** Could not read it: offer every plan and let the server decide. */
  | { kind: "failed" };

const PER_KEY = { pro_monthly: "perMonth", pro_yearly: "perYear", pro_lifetime: "once" } as const;
const DESC_KEY = { pro_monthly: "descMonthly", pro_yearly: "descYearly", pro_lifetime: "descLifetime" } as const;
const NAME_KEY = { pro_monthly: "planMonthly", pro_yearly: "planYearly", pro_lifetime: "planLifetime" } as const;

/**
 * The plan cards and the purchase controls. Prices come from the server
 * (rendered by the page); the session, the account's current plan and the
 * one-shot query parameters are read here, in the browser.
 */
export default function PricingPlans({
  prices,
  checkoutEnabled,
  freeCreations,
  refundDays,
}: {
  prices: Price[];
  checkoutEnabled: boolean;
  freeCreations: number;
  refundDays: number;
}) {
  const t = useTranslations("billing.pricing");
  const { session, ready, endSession } = useStoredSession();
  const [selected, setSelected] = useState<ProPlanId | null>(null);
  const [fromApp, setFromApp] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementState>({ kind: "idle" });
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // One-shot parameters: `plan` preselects a card, `from=app` is kept for the
  // success page in this tab, `checkout=cancelled` shows a notice once.
  // Read once per mount: the address is tidied below, so a second run of this
  // effect (React's development double-invoke) must not read it again.
  const initialParams = useRef<PricingParams | null>(null);
  useEffect(() => {
    const params = (initialParams.current ??= readPricingParams(window.location.search));
    setSelected(params.plan);
    setCancelled(params.cancelled);
    let stored = false;
    try {
      if (params.fromApp) window.sessionStorage.setItem(FROM_APP_STORAGE_KEY, "app");
      stored = window.sessionStorage.getItem(FROM_APP_STORAGE_KEY) === "app";
    } catch {
      stored = params.fromApp;
    }
    setFromApp(stored);
    const tidy = tidyPricingSearch(window.location.search);
    if (tidy !== null) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${tidy}${window.location.hash}`);
    }
  }, []);

  const token = session?.token ?? null;
  useEffect(() => {
    if (!token || !checkoutEnabled) {
      setEntitlement({ kind: "idle" });
      return;
    }
    const controller = new AbortController();
    setEntitlement({ kind: "loading" });
    getEntitlement(token, controller.signal)
      .then(value => setEntitlement({ kind: "ready", entitlement: value }))
      .catch(error => {
        if (controller.signal.aborted) return;
        if (billingFailure(error).kind === "unauthenticated") endSession();
        else setEntitlement({ kind: "failed" });
      });
    return () => controller.abort();
  }, [token, checkoutEnabled, endSession]);

  function onFailure(failure: BillingFailure) {
    if (failure.kind === "unauthenticated") endSession();
    setErrorKey(checkoutErrorKey(failure));
  }

  function signOut() {
    const current = session?.token;
    endSession();
    setErrorKey(null);
    if (current) void logout(current);
  }

  const plans = orderedPrices(prices);
  const current = entitlement.kind === "ready" ? entitlement.entitlement : null;
  const owned = plans.map(price => planAvailability(price.plan, current)).find(state => state !== "open");

  function action(plan: ProPlanId) {
    if (!checkoutEnabled) return null;
    if (!ready || (session && entitlement.kind === "loading")) {
      return <button type="button" className="pricing-button" disabled>{t("checking")}</button>;
    }
    if (!session) {
      return (
        <Link className="pricing-button" href={signInHref(plan)} data-umami-event="pro-sign-in-to-buy">
          {t("signInToBuy")}
        </Link>
      );
    }
    const availability = planAvailability(plan, current);
    if (availability !== "open") {
      return <p className="pricing-owned">{t("ownedShort")}</p>;
    }
    return (
      <CheckoutButton
        className="pricing-button"
        plan={plan}
        token={session.token}
        returnTo={fromApp ? "app" : "web"}
        label={t("buy", { plan: t(NAME_KEY[plan]) })}
        busyLabel={t("buyBusy")}
        onStart={() => setErrorKey(null)}
        onFailure={onFailure}
      />
    );
  }

  return (
    <section className="pricing-plans" aria-label={t("plansLabel")}>
      {cancelled && <p className="pricing-notice" role="status">{t("cancelled")}</p>}

      {!checkoutEnabled && (
        <div className="pricing-soon" role="status">
          <h2>{t("soonTitle")}</h2>
          <p>{t("soonSub", { free: freeCreations })}</p>
        </div>
      )}

      {plans.length > 0 && (
        <div className="pricing-grid">
          {plans.map(price => (
            <article
              key={price.plan}
              id={`plan-${planParam(price.plan)}`}
              className={`pricing-card${selected === price.plan ? " selected" : ""}`}
            >
              {selected === price.plan && <span className="pricing-badge">{t("selected")}</span>}
              <h2>{t(NAME_KEY[price.plan])}</h2>
              <p className="pricing-price">
                <span className="pricing-amount">{price.display_price}</span>{" "}
                <span className="pricing-per">{t(PER_KEY[price.plan])}</span>
              </p>
              <p className="pricing-desc">{t(DESC_KEY[price.plan])}</p>
              {action(price.plan)}
            </article>
          ))}
        </div>
      )}

      {checkoutEnabled && ready && (
        <div className="pricing-account">
          {session ? (
            <>
              <p>
                {t("accountLine", { email: session.user.email })}{" "}
                <span className="pricing-muted">{t("notYou")}</span>{" "}
                <button type="button" className="pricing-link" onClick={signOut}>{t("signOut")}</button>
              </p>
              {owned && <p className="pricing-muted">{t(ownedMessageKey(owned))}</p>}
              {owned === "web_subscription" && <p className="pricing-muted">{t("upgradeLifetime")}</p>}
              {!owned && hasTemporaryPro(current) && <p className="pricing-muted">{t("temporaryPro")}</p>}
            </>
          ) : (
            <p>
              {t("inviteOnly")}{" "}
              <Link className="pricing-link" href="/request-access" data-umami-event="request-early-access" data-umami-event-placement="pricing">
                {t("requestAccess")}
              </Link>
            </p>
          )}
        </div>
      )}

      {errorKey && <p className="pricing-error" role="alert">{t(errorKey)}</p>}

      {plans.length > 0 && (
        <ul className="pricing-terms">
          <li>{t(taxNoteKey(plans))} {t("currencyNote")}</li>
          <li>{t("renewal")}</li>
          <li>{t("refund", { days: refundDays })}</li>
          <li>{t("edition")}</li>
          <li>
            {t.rich("termsLine", {
              terms: chunks => <Link href="/terms#toone-pro">{chunks}</Link>,
            })}{" "}
            {t("stripeLine")}
          </li>
        </ul>
      )}
    </section>
  );
}
