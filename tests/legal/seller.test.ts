import "./render";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  LINK_SELLER_ENTITY,
  STRIPE_EU_ENTITY,
  TOONE_PRO_SELLER,
  TOONE_PRO_SELLERS,
  currentSeller,
  isManagedPayments,
  sellerFromServer,
} from "../../lib/legal/seller";

test("one seller-model switch, defaulting to Stripe Managed Payments", () => {
  assert.deepEqual([...TOONE_PRO_SELLERS], ["managed_payments", "direct"]);
  assert.equal(TOONE_PRO_SELLER, "managed_payments");
  assert.ok(isManagedPayments("managed_payments"));
  assert.ok(!isManagedPayments("direct"));
  assert.equal(LINK_SELLER_ENTITY, "Sold through Link, LLC");
  assert.equal(STRIPE_EU_ENTITY, "Stripe Payments Europe, Limited");
});

test("the API's seller answer wins; the constant is only the fallback", () => {
  assert.equal(currentSeller("direct"), "direct");
  assert.equal(currentSeller("managed_payments", "direct"), "managed_payments");
  assert.equal(currentSeller(null), TOONE_PRO_SELLER);
  assert.equal(currentSeller(null, "direct"), "direct");
  assert.equal(currentSeller(sellerFromServer("direct"), "managed_payments"), "direct");
  assert.equal(currentSeller(sellerFromServer("bogus"), "direct"), "direct");
  const loader = fs.readFileSync("lib/legal/current-seller.ts", "utf8");
  assert.match(loader, /currentSeller\(features\.billing_seller\)/);
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
    assert.doesNotMatch(fs.readFileSync(`lib/legal/${file}`, "utf8"), /TOONE_PRO_SELLER\s*[:=]/, file);
  }
});

test("no blocked country is hard-coded: the server's blocked-country list is the one list", async () => {
  const seller = await import("../../lib/legal/seller");
  assert.ok(!("DIRECT_BLOCKED_COUNTRIES" in seller));
  assert.doesNotMatch(fs.readFileSync("lib/legal/seller.ts", "utf8"), /United Kingdom/);
});
