"use client";

import { activeCheckoutPromotion, checkoutPromotionEnds, discountedLifetimePrice, rememberCheckoutPromotion } from "@/lib/billing/checkout-promo";
import { affiliateAppliesTo, percentOffPrice, rememberedAffiliate, type RememberedAffiliate } from "@/lib/affiliates";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { logout } from "@/lib/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import {
  billingFailure,
  getEntitlement,
  planParam,
  startPortal,
  type BillingFailure,
  type Entitlement,
  type Price,
  type ProPlanId,
} from "@/lib/billing/api";
import CheckoutButton from "./CheckoutButton";
import {
  FROM_APP_STORAGE_KEY,
  PAYMENT_PENDING_RECHECKS,
  PAYMENT_PENDING_RECHECK_MS,
  checkoutErrorKey,
  hasTemporaryPro,
  isPaymentPending,
  isUnpaidWebSubscription,
  orderedPrices,
  ownedMessageKey,
  planAvailability,
  readPricingParams,
  signInHref,
  taxNoteKey,
  tidyPricingSearch,
  type PricingParams,
  roundedPrice,
  withoutEmptyCents,
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
  paidEntry = false,
}: {
  prices: Price[];
  checkoutEnabled: boolean;
  freeCreations: number;
  refundDays: number;
  /** Downloads need Pro for now: show the Free plan, closed, beside the paid ones. */
  paidEntry?: boolean;
}) {
  const entry = useTranslations("billing.paidEntry");
  const t = useTranslations("billing.pricing");
  const locale = useLocale();
  const { session, ready, endSession } = useStoredSession();
  const [selected, setSelected] = useState<ProPlanId | null>(null);
  const [fromApp, setFromApp] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementState>({ kind: "idle" });
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // A refused checkout whose way out is the billing page (an unpaid web subscription).
  const [fixPayment, setFixPayment] = useState(false);
  const [portalState, setPortalState] = useState<"idle" | "opening" | "failed">("idle");
  // A checkout that is already paid and being confirmed: read the plan again shortly.
  const [paymentPending, setPaymentPending] = useState(false);

  // One-shot parameters: `plan` preselects a card, `from=app` is kept for the
  // success page in this tab, `checkout=cancelled` shows a notice once.
  // Read once per mount: the address is tidied below, so a second run of this
  // effect (React's development double-invoke) must not read it again.
  /** The checkout discount code in effect: the running site-wide offer, a Product Hunt link, or one typed into the code box. */
  const [promo, setPromo] = useState<string | null>(null);
  /** The creator link this browser came through (/r/{slug}); its discount wins over the launch code. */
  const [affiliate, setAffiliate] = useState<RememberedAffiliate | null>(null);
  /** Whether a plan's shown discount is the creator's. */
  const affiliateOffer = (plan: string) => Boolean(affiliate?.discount) && affiliateAppliesTo(affiliate, plan);
  /** The price with the creator's or the launch code applied; null without a discount for this plan. */
  const offerPrice = (price: { plan: string; amount: number; display_price: string }) =>
    affiliate?.discount && affiliateOffer(price.plan)
      ? percentOffPrice(affiliate.discount.percent, price.amount, price.display_price)
      : !affiliate && promo && price.plan === "pro_lifetime"
        ? discountedLifetimePrice(promo, price.amount, price.display_price)
        : null;
  /** "6 days left": whole days until the running offer ends, counting the last partial day as one. */
  const promoEnds = promo ? checkoutPromotionEnds(promo) : null;
  const promoDaysLeft = promoEnds ? Math.max(1, Math.ceil((promoEnds.getTime() - Date.now()) / 86_400_000)) : null;
  const promoUntil = promoDaysLeft ? t("promoDaysLeft", { count: promoDaysLeft }) : null;
  const initialParams = useRef<PricingParams | null>(null);
  useEffect(() => {
    if (/[?&]ref=product[\s_-]?hunt\b/i.test(window.location.search)) rememberCheckoutPromotion("PRODUCTHUNT");
    // Applied for every visitor while the offer runs, not only those who came through a launch link.
    setPromo(activeCheckoutPromotion());
    setAffiliate(rememberedAffiliate());
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

  async function onFailure(failure: BillingFailure) {
    if (failure.kind === "unauthenticated") endSession();
    let plan = entitlement.kind === "ready" ? entitlement.entitlement : null;
    // Without the server's reason, whether an already_pro from a web
    // subscription means "unpaid" depends on the plan; read it once more when
    // the page could not.
    if (!plan && failure.kind === "already_pro" && !failure.reason && token) plan = await getEntitlement(token).catch(() => null);
    setFixPayment(isUnpaidWebSubscription(failure, plan));
    setPaymentPending(isPaymentPending(failure));
    setPortalState("idle");
    setErrorKey(checkoutErrorKey(failure, plan));
  }

  function clearError() {
    setErrorKey(null);
    setFixPayment(false);
    setPaymentPending(false);
    setPortalState("idle");
  }

  // `payment_pending`: the payment is being confirmed. Read the plan again a
  // few times; once it reads Pro, the cards show it and the notice goes.
  useEffect(() => {
    if (!paymentPending || !token) return;
    const controller = new AbortController();
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const recheck = () => {
      tries += 1;
      getEntitlement(token, controller.signal)
        .then(value => {
          setEntitlement({ kind: "ready", entitlement: value });
          if (value.plan === "pro") {
            setPaymentPending(false);
            setErrorKey(null);
          } else if (tries < PAYMENT_PENDING_RECHECKS) {
            timer = setTimeout(recheck, PAYMENT_PENDING_RECHECK_MS);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted && tries < PAYMENT_PENDING_RECHECKS) timer = setTimeout(recheck, PAYMENT_PENDING_RECHECK_MS);
        });
    };
    timer = setTimeout(recheck, PAYMENT_PENDING_RECHECK_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [paymentPending, token]);

  /** The Stripe billing page, where an unpaid subscription's card is updated. */
  async function openBillingPage() {
    if (!token || portalState === "opening") return;
    setPortalState("opening");
    try {
      const { url } = await startPortal(token, { locale, return: fromApp ? "app" : "web" });
      window.location.assign(url);
    } catch (caught) {
      if (billingFailure(caught).kind === "unauthenticated") {
        endSession();
        clearError();
        return;
      }
      setPortalState("failed");
    }
  }

  function signOut() {
    const current = session?.token;
    endSession();
    clearError();
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
        onStart={clearError}
        onFailure={failure => void onFailure(failure)}
      />
    );
  }

  return (
    <section className="pricing-plans" aria-label={t("plansLabel")}>
      {cancelled && <p className="pricing-notice" role="status">{t("cancelled")}</p>}

      {!checkoutEnabled && !paidEntry && (
        <div className="pricing-soon" role="status">
          <h2>{t("soonTitle")}</h2>
          <p>{t("soonSub", { free: freeCreations })}</p>
        </div>
      )}

      {affiliate && plans.length > 0 ? (
        <div className="pricing-soon" role="status">
          <h2>{affiliate.name ? t("affiliateTitle", { name: affiliate.name }) : t("promoTitle")}</h2>
          <p>
            {affiliate.discount
              ? t(affiliate.discount.scope === "lifetime" ? "affiliateNoteLifetime" : "affiliateNoteAll", {
                  percent: affiliate.discount.percent,
                  name: affiliate.name,
                  code: affiliate.code,
                })
              : t("affiliateNoteCode", { name: affiliate.name, code: affiliate.code })}
          </p>
        </div>
      ) : promo && plans.length > 0 && (
        <div className="pricing-soon" role="status">
          <h2>{promo === "BLACKFRIDAY" ? t("promoTitleBlackFriday") : t("promoTitle")}</h2>
          <p>{promo === "BLACKFRIDAY" ? t("promoNoteBlackFriday", { code: promo }) : t("promoNote", { code: promo })}</p>
        </div>
      )}

      {plans.length > 0 && (
        <div className={`pricing-grid${paidEntry ? " pricing-grid--entry" : ""}`}>
          {paidEntry && (
            <article className="pricing-card pricing-card--free">
              <h2>{entry("freeName")}</h2>
              <p className="pricing-desc">{entry("freeText")}</p>
              <button type="button" className="pricing-button" disabled>{entry("freeButton")}</button>
              <span className="pricing-free-tag">{entry("freeBadge")}</span>
            </article>
          )}
          {plans.map(price => (
            <article
              key={price.plan}
              id={`plan-${planParam(price.plan)}`}
              className={`pricing-card${selected === price.plan ? " selected" : ""}`}
            >
              {offerPrice(price) && affiliateOffer(price.plan) && affiliate?.discount ? (
                <span className="pricing-badge pricing-badge--offer">{t("affiliateBadge", { percent: affiliate.discount.percent })}</span>
              ) : offerPrice(price) && promo === "BLACKFRIDAY" ? (
                <span className="pricing-badge pricing-badge--offer">{t("promoBadgeBlackFriday")}</span>
              ) : offerPrice(price) ? (
                <span className="pricing-badge pricing-badge--offer">
                  <svg viewBox="0 0 40 40" width="13" height="13" aria-hidden="true" focusable="false">
                    <circle cx="20" cy="20" r="20" fill="#FF6154" />
                    <path fill="#fff" d="M22.6 20H17v-6h5.6a3 3 0 0 1 0 6zm0-10H13v20h4v-6h5.6a7 7 0 0 0 0-14z" />
                  </svg>
                  {t("promoBadge")}
                </span>
              ) : (
                selected === price.plan && <span className="pricing-badge">{t("selected")}</span>
              )}
              <h2>{t(NAME_KEY[price.plan])}</h2>
              <p className="pricing-price">
                {offerPrice(price) && (
                  <>
                    <s className="pricing-before">{roundedPrice(price.amount, price.display_price)}</s>{" "}
                  </>
                )}
                <span className="pricing-amount">{withoutEmptyCents(offerPrice(price) ?? price.display_price)}</span>{" "}
                {/* Lifetime's description already opens with "Pay once", so its price carries no unit. */}
                {price.plan !== "pro_lifetime" && <span className="pricing-per">{t(PER_KEY[price.plan])}</span>}
              </p>
              {offerPrice(price) && affiliateOffer(price.plan) && affiliate?.discount && price.plan !== "pro_lifetime" &&
                affiliate.discount.duration !== "forever" && (
                <p className="pricing-was">
                  {affiliate.discount.duration === "repeating"
                    ? t("affiliateFirstMonths", { count: affiliate.discount.months ?? 1 })
                    : t("affiliateFirstPayment")}
                </p>
              )}
              {offerPrice(price) && !affiliateOffer(price.plan) && promoUntil && (
                <p className="pricing-was">
                  {promoUntil}
                </p>
              )}
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
              <Link className="pricing-link" href="/create-account" data-umami-event="create-account" data-umami-event-placement="pricing">
                {t("requestAccess")}
              </Link>
            </p>
          )}
        </div>
      )}

      {paidEntry && (
        <p className="pricing-redeem">
          {entry.rich("redeem", { link: chunks => <Link href="/redeem">{chunks}</Link> })}
        </p>
      )}

      {errorKey && <p className="pricing-error" role="alert">{t(errorKey)}</p>}
      {errorKey && fixPayment && session && (
        <div className="pricing-account">
          <button type="button" className="pricing-button" onClick={() => void openBillingPage()} disabled={portalState === "opening"}>
            {portalState === "opening" ? t("fixPaymentBusy") : t("fixPayment")}
          </button>
          {portalState === "failed" && <p className="pricing-error" role="alert">{t("errPortal")}</p>}
        </div>
      )}

      {plans.length > 0 && (
        <div className="pricing-fineprint">
          <p className="pricing-stripe">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/stripe.svg" alt="" width={16} height={16} />
            {t("stripeLine")}
          </p>
          <p>
            {t.rich("termsShort", {
              days: refundDays,
              terms: chunks => <Link href="/terms#toone-pro">{chunks}</Link>,
            })}
          </p>
          {/* EU withdrawal function and German cancel button, without signing in. */}
          <p className="pricing-contract"><Link href="/cancel-contract">{t("contractLink")}</Link></p>
          <details>
            <summary>{t("termsMore")}</summary>
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
          </details>
        </div>
      )}
    </section>
  );
}
