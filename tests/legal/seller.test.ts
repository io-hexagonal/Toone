import "./render";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as sellerModule from "../../lib/legal/seller";
import {
  LINK_SELLER_ENTITY,
  STRIPE_EU_ENTITY,
  TOONE_PRO_SELLERS,
  isManagedPayments,
  newPurchasesSentence,
  sellerFromServer,
} from "../../lib/legal/seller";

test("two seller models, and no hard-coded default seller", () => {
  assert.deepEqual([...TOONE_PRO_SELLERS], ["managed_payments", "direct"]);
  assert.ok(isManagedPayments("managed_payments"));
  assert.ok(!isManagedPayments("direct"));
  assert.equal(LINK_SELLER_ENTITY, "Sold through Link, LLC");
  assert.equal(STRIPE_EU_ENTITY, "Stripe Payments Europe, Limited");
  // Review #63: the old fallback constant could name the wrong seller while the API was unreachable.
  assert.ok(!("TOONE_PRO_SELLER" in sellerModule));
  assert.ok(!("currentSeller" in sellerModule));
});

test("the API's answer only picks the 'currently sold' sentence; no answer, no sentence", () => {
  assert.equal(sellerFromServer("direct"), "direct");
  assert.equal(sellerFromServer("managed_payments"), "managed_payments");
  assert.equal(sellerFromServer("bogus"), null);
  assert.equal(sellerFromServer(undefined), null);
  assert.equal(newPurchasesSentence("managed_payments"), "New purchases are currently sold through Link.");
  assert.equal(newPurchasesSentence("direct"), "New purchases are currently sold by Toone.");
  assert.equal(newPurchasesSentence(null), null);
  assert.equal(newPurchasesSentence(undefined), null);
  const loader = fs.readFileSync("lib/legal/current-seller.ts", "utf8");
  assert.match(loader, /Promise<TooneProSeller \| null>/);
  assert.match(loader, /return features\.billing_seller;/);
  assert.match(loader, /revalidate: SELLER_REVALIDATE_SECONDS/);
});

test("Terms, Privacy and the Legal notice all render the seller the API names", () => {
  for (const file of ["app/[locale]/terms/page.tsx", "app/[locale]/privacy/page.tsx", "app/[locale]/legal-notice/page.tsx"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, /const seller = await loadSeller\(\);/, file);
    assert.match(source, /seller=\{seller\}/, file);
    assert.match(source, /export const revalidate = 300;/, file);
    assert.doesNotMatch(source, /TOONE_PRO_SELLER/, file);
    assert.doesNotMatch(source, /"managed_payments"|"direct"/, `${file} must not hard-code a seller`);
  }
  for (const file of fs.readdirSync("lib/legal")) {
    if (file === "seller.ts") continue;
    assert.doesNotMatch(fs.readFileSync(`lib/legal/${file}`, "utf8"), /TOONE_PRO_SELLER\b/, file);
  }
});

test("no blocked country is hard-coded: the server's blocked-country list is the one list", async () => {
  const seller = await import("../../lib/legal/seller");
  assert.ok(!("DIRECT_BLOCKED_COUNTRIES" in seller));
  assert.doesNotMatch(fs.readFileSync("lib/legal/seller.ts", "utf8"), /United Kingdom/);
});
