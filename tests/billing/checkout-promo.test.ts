import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkoutPromotionCode,
  checkoutPromotionEnded,
  discountedLifetimePrice,
  rememberCheckoutPromotion,
  rememberedCheckoutPromotion,
} from "../../lib/billing/checkout-promo";

test("the launch code is recognised however it is typed, and nothing else is", () => {
  assert.equal(checkoutPromotionCode(" producthunt "), "PRODUCTHUNT");
  assert.equal(checkoutPromotionCode("product-hunt"), "PRODUCTHUNT");
  assert.equal(checkoutPromotionCode("APPSUMO-AAAA-BBBB-CCCC-DDDD"), null);
  assert.equal(checkoutPromotionCode(null), null);
});

test("the lifetime price with the launch code matches what Stripe charges, in the price's own format", () => {
  // Stripe: 199.99 with 81.5% off is a 162.99 discount and 37.00 to pay.
  assert.equal(discountedLifetimePrice("PRODUCTHUNT", 19999, "€199.99"), "€37.00");
  assert.equal(discountedLifetimePrice("PRODUCTHUNT", 19999, "$199.99"), "$37.00");
  assert.equal(discountedLifetimePrice("PRODUCTHUNT", 19999, "199,99 €"), "37,00 €");
  assert.equal(discountedLifetimePrice("OTHER", 19999, "€199.99"), null);
  assert.equal(discountedLifetimePrice("PRODUCTHUNT", 0, "€0.00"), null);
});

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

test("the offer is still there in another tab of the same browser, until the code ends", () => {
  const globals = globalThis as unknown as { window?: unknown };
  const local = memoryStorage();
  const during = new Date("2026-11-18T08:00:00Z");
  try {
    globals.window = { localStorage: local, sessionStorage: memoryStorage() };
    rememberCheckoutPromotion("PRODUCTHUNT");
    // Another tab: same localStorage, its own empty sessionStorage.
    globals.window = { localStorage: local, sessionStorage: memoryStorage() };
    assert.equal(rememberedCheckoutPromotion(during), "PRODUCTHUNT");
    assert.equal(rememberedCheckoutPromotion(new Date("2026-11-26T00:00:00Z")), null);
    // A browser that refuses localStorage keeps the offer for the tab.
    const session = memoryStorage();
    const refusing = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
    globals.window = { localStorage: refusing, sessionStorage: session };
    rememberCheckoutPromotion("PRODUCTHUNT");
    assert.equal(rememberedCheckoutPromotion(during), "PRODUCTHUNT");
    globals.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
    assert.equal(rememberedCheckoutPromotion(during), null);
  } finally {
    delete globals.window;
  }
});

test("the launch code ends with the last minute of 25 November UTC", () => {
  assert.equal(checkoutPromotionEnded("PRODUCTHUNT", new Date("2026-11-25T23:59:00Z")), false);
  assert.equal(checkoutPromotionEnded("PRODUCTHUNT", new Date("2026-11-25T23:59:01Z")), true);
  assert.equal(checkoutPromotionEnded("OTHER", new Date("2030-01-01T00:00:00Z")), false);
});
