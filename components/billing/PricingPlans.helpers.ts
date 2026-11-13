/**
 * Pure logic behind the pricing page: which plans the signed-in account can
 * buy, how checkout failures read, the sign-in link that comes back to a plan,
 * and the query parameters the page understands.
 */

import {
  PRO_PLANS,
  planFromParam,
  planParam,
  type BillingFailure,
  type BillingProvider,
  type Entitlement,
  type Price,
  type ProPlanId,
  type ProSource,
} from "@/lib/billing/api";
import { WEB_SALES_LEGALLY_READY } from "@/lib/legal/release";

/** sessionStorage key: this tab came from the desktop app (`?from=app`). */
export const FROM_APP_STORAGE_KEY = "toone.pro.from";

/** Why the account cannot buy a plan right now. */
export type OwnedReason = "lifetime" | "app_store" | "web_subscription" | "permanent_grant" | "other";

/** How an existing Pro reads to the buyer, from the entitlement or a 409 `already_pro`. */
export function ownedReason(source: ProSource | null, provider: BillingProvider | null): OwnedReason {
  if (source === "lifetime") return "lifetime";
  if (provider === "app_store") return "app_store";
  if (source === "subscription" && provider === "stripe") return "web_subscription";
  // The server refuses a paid plan for a grant only when it never ends.
  if (source === "grant") return "permanent_grant";
  return "other";
}

/** Pro from a code or an admin grant that never ends: a paid plan would add nothing. */
function hasPermanentGrant(entitlement: Entitlement): boolean {
  return entitlement.plan === "pro" && entitlement.source === "grant" && entitlement.expires_at === null;
}

/**
 * "open" when the plan can be bought, otherwise why not. The server decides
 * in the end (409 `already_pro`); this only avoids offering a checkout that
 * will be refused. Timed Pro from a code or a guest month does not block a
 * paid plan, a code or grant without an end does, and a web subscription can
 * still move to Lifetime.
 */
export function planAvailability(plan: ProPlanId, entitlement: Entitlement | null): "open" | OwnedReason {
  if (!entitlement || entitlement.plan !== "pro") return "open";
  if (hasPermanentGrant(entitlement)) return "permanent_grant";
  if (entitlement.source === "grant" || entitlement.source === "guest") return "open";
  const reason = ownedReason(entitlement.source, entitlement.billing_provider);
  if (reason === "web_subscription" && plan === "pro_lifetime") return "open";
  return reason;
}

/** True when the account's current Pro is temporary (a code or grant with an end date, or a guest month). */
export function hasTemporaryPro(entitlement: Entitlement | null): boolean {
  if (!entitlement || entitlement.plan !== "pro") return false;
  if (entitlement.source === "guest") return true;
  return entitlement.source === "grant" && !hasPermanentGrant(entitlement);
}

/** `billing.pricing.*` message key for a plan the account already owns. */
export function ownedMessageKey(reason: OwnedReason): string {
  switch (reason) {
    case "lifetime": return "ownedLifetime";
    case "app_store": return "ownedAppStore";
    case "web_subscription": return "ownedWeb";
    case "permanent_grant": return "ownedPermanent";
    default: return "ownedOther";
  }
}

/**
 * A 409 `already_pro` for a trytoone.com subscription whose last payment
 * failed and is still being retried. It no longer gives Pro, but it still
 * blocks a new one, so the way out is the billing page (update the card), not
 * another checkout. The server says so with `reason: "renewal_unpaid"`;
 * without a reason (an older server), it is inferred: a web subscription
 * refusal while the account's plan does not read Pro. False while the plan is
 * unknown: then the refusal reads as `ownedWeb`.
 */
export function isUnpaidWebSubscription(failure: BillingFailure, entitlement: Entitlement | null): boolean {
  if (failure.kind !== "already_pro") return false;
  if (failure.reason === "renewal_unpaid") return true;
  return failure.source === "subscription"
    && failure.provider === "stripe"
    && entitlement !== null
    && entitlement.plan !== "pro";
}

/** A 409 `conflict` whose checkout is already paid: Pro starts once the payment is confirmed. */
export function isPaymentPending(failure: BillingFailure): boolean {
  return failure.kind === "conflict" && failure.reason === "payment_pending";
}

/** How long the pricing page waits before reading the plan again after `payment_pending`, and how often it tries. */
export const PAYMENT_PENDING_RECHECK_MS = 4000;
export const PAYMENT_PENDING_RECHECKS = 4;

/**
 * `billing.pricing.*` message key for a failed checkout start. `entitlement`
 * is the account's plan as the page last read it (null when unknown).
 */
export function checkoutErrorKey(failure: BillingFailure, entitlement: Entitlement | null = null): string {
  switch (failure.kind) {
    case "unauthenticated": return "errSession";
    case "already_pro":
      if (isUnpaidWebSubscription(failure, entitlement)) return "errPaymentDue";
      return ownedMessageKey(ownedReason(failure.source, failure.provider));
    case "payments_unavailable": return "errUnavailable";
    case "rate_limited": return "errRate";
    case "conflict": return failure.reason === "payment_pending" ? "errPaymentPending" : "errConflict";
    default: return "errGeneric";
  }
}

/** The return path sign-in sends the buyer back to (allow-listed in `signInReturnPath`). */
export function pricingReturnPath(plan: ProPlanId | null): string {
  return plan ? `/pricing?plan=${planParam(plan)}` : "/pricing";
}

/** Locale-less sign-in link that comes back to the chosen plan. */
export function signInHref(plan: ProPlanId | null): string {
  return `/signin?next=${encodeURIComponent(pricingReturnPath(plan))}`;
}

export type PricingParams = {
  /** `?plan=` (monthly | yearly | lifetime); null when absent or unknown. */
  plan: ProPlanId | null;
  /** `?from=app`: the desktop app opened this page. */
  fromApp: boolean;
  /** `?checkout=cancelled`: Stripe sent the buyer back without a payment. */
  cancelled: boolean;
};

export function readPricingParams(search: string): PricingParams {
  const params = new URLSearchParams(search);
  return {
    plan: planFromParam(params.get("plan")),
    fromApp: params.get("from") === "app",
    cancelled: params.get("checkout") === "cancelled",
  };
}

/**
 * The address to show once the one-shot parameters are read: `from` and
 * `checkout` are dropped, `plan` stays so a reload keeps the selection.
 * Null when nothing changes.
 */
export function tidyPricingSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  if (!params.has("from") && !params.has("checkout")) return null;
  params.delete("from");
  params.delete("checkout");
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

/**
 * Whether the page offers checkout: the capability flag says so, there is at
 * least one known plan to buy, and the release gate allows web sales (a
 * production build hides checkout until the trader details are published).
 * While payments are off the server answers prices with an empty list (200),
 * which reads as "coming soon".
 */
export function checkoutAvailable(flag: boolean, prices: readonly Price[], legallyReady: boolean = WEB_SALES_LEGALLY_READY): boolean {
  return flag && legallyReady && orderedPrices(prices).length > 0;
}

/** Known plans in display order (monthly, yearly, lifetime); one price per plan. */
export function orderedPrices(prices: readonly Price[]): Price[] {
  return PRO_PLANS.flatMap(plan => {
    const price = prices.find(entry => entry.plan === plan);
    return price ? [price] : [];
  });
}

/** Which tax line goes under the prices. */
export function taxNoteKey(prices: readonly Price[]): "vatIncluded" | "taxExcluded" {
  return prices.length > 0 && prices.every(price => price.tax_inclusive) ? "vatIncluded" : "taxExcluded";
}
