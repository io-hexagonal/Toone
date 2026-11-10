/**
 * Pure pieces of the page Stripe returns to after a payment: taking the
 * Checkout `session_id` out of the address before anything else can read it,
 * remembering it for a reload of the same tab, and choosing what to show.
 *
 * The session id only lets the page ask the API about that checkout. Pro is
 * shown as on only when the account's entitlement says so and that checkout
 * is complete.
 */

import { splitSessionId, stripSessionId, type CheckoutReceipt, type CheckoutReturnState } from "@/lib/billing/checkout-return";
import { FROM_APP_STORAGE_KEY } from "./PricingPlans.helpers";

/** Where the inline head script parks the id it removed from the address. */
export const CHECKOUT_SESSION_GLOBAL = "__tooneCheckoutSession";

/** sessionStorage key: the checkout this tab is confirming (survives a reload). */
export const CHECKOUT_SESSION_STORAGE_KEY = "toone.pro.checkout";

/** Asks the Direct app to refresh its plan. It never turns anything on by itself. */
export const TOONE_PRO_SUCCESS_URL = "toone://pro/success";

/**
 * Runs inline while the HTML is parsed, before any bundle, analytics or
 * referrer can see the address: removes `session_id` with `replaceState` and
 * keeps the raw value in memory for the page to validate.
 */
export const STRIP_SESSION_ID_SCRIPT = `(function(){try{var u=new URL(window.location.href);if(!u.searchParams.has("session_id"))return;window.${CHECKOUT_SESSION_GLOBAL}=u.searchParams.get("session_id")||"";u.searchParams.delete("session_id");var q=u.searchParams.toString();window.history.replaceState(window.history.state,"",u.pathname+(q?"?"+q:"")+u.hash);}catch(e){}})();`;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type ReturnWindow = Parameters<typeof stripSessionId>[0] & {
  [CHECKOUT_SESSION_GLOBAL]?: unknown;
  sessionStorage?: StorageLike;
};

function storage(win: ReturnWindow): StorageLike | null {
  try {
    return win.sessionStorage ?? null;
  } catch {
    return null; // storage blocked
  }
}

function validSessionId(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  return splitSessionId(`/?session_id=${encodeURIComponent(raw)}`).sessionId;
}

/**
 * The checkout to confirm: the id the head script removed, else one still in
 * the address (removed now), else the one this tab stored before a reload.
 * Null when there is none, or it is malformed.
 */
export function takeCheckoutSessionId(win: ReturnWindow | undefined): string | null {
  if (!win) return null;
  let id: string | null;
  if (CHECKOUT_SESSION_GLOBAL in win) {
    id = validSessionId(win[CHECKOUT_SESSION_GLOBAL]);
    delete win[CHECKOUT_SESSION_GLOBAL];
    stripSessionId(win); // a second copy, if any
  } else {
    id = stripSessionId(win);
  }
  const store = storage(win);
  try {
    if (id) store?.setItem(CHECKOUT_SESSION_STORAGE_KEY, id);
    else id = validSessionId(store?.getItem(CHECKOUT_SESSION_STORAGE_KEY));
  } catch {
    // storage blocked: confirm without remembering
  }
  return id;
}

/** Forget the stored checkout once its outcome is final. */
export function forgetCheckoutSession(win: ReturnWindow | undefined): void {
  if (!win) return;
  try {
    storage(win)?.removeItem(CHECKOUT_SESSION_STORAGE_KEY);
  } catch {
    // nothing to forget
  }
}

/**
 * True when the desktop app started this purchase: `?return=app` on the
 * return URL, or `?from=app` seen on the pricing page in this tab. It only
 * decides whether a "Return to Toone" button is offered.
 */
export function cameFromApp(search: string, win: ReturnWindow | undefined): boolean {
  if (new URLSearchParams(search).get("return") === "app") return true;
  if (!win) return false;
  try {
    return storage(win)?.getItem(FROM_APP_STORAGE_KEY) === "app";
  } catch {
    return false;
  }
}

export type ReturnView =
  | "pending"
  | "active"
  /** Paid with a method that clears later; Pro turns on then, by email. */
  | "processing"
  | "timeout"
  | "signed_out"
  | "expired"
  | "unreachable"
  /** Opened without a checkout to confirm, and the account is not Pro. */
  | "none"
  /** Opened without a checkout to confirm, and the account already has Pro. */
  | "already_pro";

/** What the page shows for a polling state. */
export function returnView(state: CheckoutReturnState, hasCheckout: boolean): ReturnView {
  switch (state.kind) {
    case "pending": return "pending";
    // Without a checkout there is no purchase to celebrate, only a plan to show.
    case "active": return hasCheckout ? "active" : "already_pro";
    case "processing": return "processing";
    case "signed_out": return "signed_out";
    case "timeout": return hasCheckout ? "timeout" : "none";
    case "error": return state.reason === "expired" ? "expired" : "unreachable";
  }
}

/** The order reference and legal invoice a final state shows, or null. */
export function returnReceipt(state: CheckoutReturnState): CheckoutReceipt | null {
  return state.kind === "active" || state.kind === "processing"
    ? { orderRef: state.orderRef, legalInvoice: state.legalInvoice }
    : null;
}

/**
 * Polling limits. With no checkout to confirm one answer is enough: the
 * page only reports whether the account already has Pro.
 */
export function returnPollConfig(hasCheckout: boolean): { timeoutMs: number } | undefined {
  return hasCheckout ? undefined : { timeoutMs: 0 };
}
