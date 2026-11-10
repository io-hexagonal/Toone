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

/** sessionStorage key: this tab came from the desktop app (`?from=app`). */
export const FROM_APP_STORAGE_KEY = "toone.pro.from";

/** Why the account cannot buy a plan right now. */
export type OwnedReason = "lifetime" | "app_store" | "web_subscription" | "other";

/** How an existing Pro reads to the buyer, from the entitlement or a 409 `already_pro`. */
export function ownedReason(source: ProSource | null, provider: BillingProvider | null): OwnedReason {
  if (source === "lifetime") return "lifetime";
  if (provider === "app_store") return "app_store";
  if (source === "subscription" && provider === "stripe") return "web_subscription";
  return "other";
}

/**
 * "open" when the plan can be bought, otherwise why not. The server decides
 * in the end (409 `already_pro`); this only avoids offering a checkout that
 * will be refused. Pro from a code or a guest month does not block a paid
 * plan, and a web subscription can still move to Lifetime.
 */
export function planAvailability(plan: ProPlanId, entitlement: Entitlement | null): "open" | OwnedReason {
  if (!entitlement || entitlement.plan !== "pro") return "open";
  if (entitlement.source === "grant" || entitlement.source === "guest") return "open";
  const reason = ownedReason(entitlement.source, entitlement.billing_provider);
  if (reason === "web_subscription" && plan === "pro_lifetime") return "open";
  return reason;
}

/** True when the account's current Pro is temporary (a code or a guest month). */
export function hasTemporaryPro(entitlement: Entitlement | null): boolean {
  return entitlement?.plan === "pro" && (entitlement.source === "grant" || entitlement.source === "guest");
}

/** `billing.pricing.*` message key for a plan the account already owns. */
export function ownedMessageKey(reason: OwnedReason): string {
  switch (reason) {
    case "lifetime": return "ownedLifetime";
    case "app_store": return "ownedAppStore";
    case "web_subscription": return "ownedWeb";
    default: return "ownedOther";
  }
}

/** `billing.pricing.*` message key for a failed checkout start. */
export function checkoutErrorKey(failure: BillingFailure): string {
  switch (failure.kind) {
    case "unauthenticated": return "errSession";
    case "already_pro": return ownedMessageKey(ownedReason(failure.source, failure.provider));
    case "payments_unavailable": return "errUnavailable";
    case "rate_limited": return "errRate";
    case "conflict": return "errConflict";
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
 * Whether the page offers checkout: the capability flag says so and there is
 * at least one known plan to buy. While payments are off the server answers
 * prices with an empty list (200), which reads as "coming soon".
 */
export function checkoutAvailable(flag: boolean, prices: readonly Price[]): boolean {
  return flag && orderedPrices(prices).length > 0;
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
