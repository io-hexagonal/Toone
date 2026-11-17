/**
 * Discount codes that belong on the Stripe payment page ("Add promotion
 * code"), not in Toone's own code box. Typed into the code box they are not
 * Toone codes, so the box explains where they go instead of refusing them.
 */
const CHECKOUT_PROMOTION_CODES: readonly string[] = ["PRODUCTHUNT"];
const STORAGE_KEY = "toone.checkoutPromotion";

/** The canonical code when `raw` is a checkout discount code; null otherwise. */
export function checkoutPromotionCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const canonical = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return CHECKOUT_PROMOTION_CODES.includes(canonical) ? canonical : null;
}

/** Keeps the offer for this tab, so the plans can remind the visitor of the code. */
export function rememberCheckoutPromotion(code: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Private mode without storage: the reminder is simply not shown later.
  }
}

export function rememberedCheckoutPromotion(): string | null {
  try {
    return checkoutPromotionCode(window.sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
