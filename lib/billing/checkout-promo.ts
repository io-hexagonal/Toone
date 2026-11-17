/**
 * Discount codes that belong on the Stripe payment page ("Add promotion
 * code"), not in Toone's own code box. Typed into the code box they are not
 * Toone codes, so the box explains where they go instead of refusing them.
 */
const CHECKOUT_PROMOTION_CODES: readonly string[] = ["PRODUCTHUNT"];

/**
 * What each code takes off the lifetime plan, in percent. It mirrors the
 * coupon in Stripe and is only used to show the price before the payment
 * page; Stripe computes what is actually charged.
 */
const LIFETIME_PERCENT_OFF: Readonly<Record<string, number>> = { PRODUCTHUNT: 81.5 };

/**
 * The lifetime price with the code applied, written like `displayPrice`
 * (same symbol, position and decimal separator); null for a code without a
 * known discount. `amount` is in the currency's minor unit.
 */
export function discountedLifetimePrice(code: string, amount: number, displayPrice: string): string | null {
  const percent = LIFETIME_PERCENT_OFF[code];
  if (!percent || !Number.isFinite(amount) || amount <= 0) return null;
  // Stripe rounds the discount, then subtracts it.
  const discounted = amount - Math.round((amount * percent) / 100);
  const number = displayPrice.match(/\d[\d.,\u00a0\u202f ]*\d|\d/);
  if (!number) return null;
  const decimalComma = /,\d{2}$/.test(number[0]);
  const text = (discounted / 100).toFixed(2);
  return displayPrice.replace(number[0], decimalComma ? text.replace(".", ",") : text);
}
const STORAGE_KEY = "toone.checkoutPromotion";

/** When each code stops being accepted at the payment page (mirrors Stripe). */
const PROMOTION_ENDS: Readonly<Record<string, string>> = { PRODUCTHUNT: "2026-11-25T23:59:00Z" };

/** True once the code has ended: it is then neither shown nor sent to the checkout. */
export function checkoutPromotionEnded(code: string, now: Date = new Date()): boolean {
  const ends = PROMOTION_ENDS[code];
  return Boolean(ends) && now.getTime() > Date.parse(ends);
}

/** The canonical code when `raw` is a checkout discount code; null otherwise. */
export function checkoutPromotionCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const canonical = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return CHECKOUT_PROMOTION_CODES.includes(canonical) ? canonical : null;
}

/**
 * Keeps the offer in this browser until the code ends, so it is still there
 * when the visitor continues in another tab or comes back later.
 */
export function rememberCheckoutPromotion(code: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // No storage for the browser: fall back to this tab below.
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Private mode without storage: the offer is simply not shown later.
  }
}

/** The remembered code while it is still accepted; null once it has ended. */
export function rememberedCheckoutPromotion(now: Date = new Date()): string | null {
  for (const storage of ["localStorage", "sessionStorage"] as const) {
    try {
      const code = checkoutPromotionCode(window[storage].getItem(STORAGE_KEY));
      if (code && !checkoutPromotionEnded(code, now)) return code;
    } catch {
      // Storage refused: try the other one.
    }
  }
  return null;
}
