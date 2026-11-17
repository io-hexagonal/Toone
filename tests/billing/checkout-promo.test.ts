import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutPromotionCode, discountedLifetimePrice } from "../../lib/billing/checkout-promo";

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
