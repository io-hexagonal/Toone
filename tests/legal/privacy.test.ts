import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PRIVACY_UPDATED_DATE } from "../../lib/legal/privacy";
import { SITE_SESSION_COOKIE } from "../../lib/site-session";

const privacy = fs.readFileSync("app/[locale]/privacy/page.tsx", "utf8");

test("Privacy names the httpOnly site session cookie", () => {
  assert.equal(SITE_SESSION_COOKIE, "toone_site_session");
  assert.match(privacy, /a cookie named \{SITE_SESSION_COOKIE\}/);
  assert.match(privacy, /httpOnly/);
  assert.match(privacy, /toone\.session/);
});

test("Privacy describes Toone Pro bought through Stripe and Link", () => {
  assert.match(privacy, /<h2 id="toone-pro"/);
  assert.match(privacy, /id="toone-pro-web"/);
  for (const phrase of [
    /Stripe&apos;s Managed\s+Payments service/,
    /Sold through Link, LLC/,
    /never receives your full\s+card number/,
    /billing country and address/,
    /IP address and country as\s+evidence/,
    /subscription, checkout and invoice identifiers/,
    /which version of that text you saw/,
    /Stripe processes this data for Toone as a service provider/,
    /independent controllers\s+for their own purposes/,
    /STRIPE_PRIVACY_URL/,
    /LINK_PRIVACY_URL/,
    /Data Privacy Framework/,
    /checkout\.stripe\.com/,
    /Cancel contract here or Withdraw from contract here/,
  ]) {
    assert.match(privacy, phrase);
  }
});

test("Privacy covers codes and account deletion with a Stripe subscription", () => {
  assert.match(privacy, /When you check or redeem a code/);
  assert.match(privacy, /keyed\s+hash of the email address that redeemed it/);
  assert.match(privacy, /deleting\s+your account cancels it at Stripe straight away/);
  assert.match(privacy, /Invoices and the records of your purchases, refunds, and codes are\s+kept/);
  assert.match(privacy, /Deleting your account does not cancel an Apple subscription/);
});

test("Privacy carries the provider, retention, controller and rights statements", () => {
  assert.match(privacy, /id="third-parties"/);
  assert.match(privacy, /<strong>Stripe<\/strong> runs checkout and payments/);
  assert.match(privacy, /same or equal\s+protection as this policy/);
  assert.match(privacy, /How Long We Keep Data/);
  assert.match(privacy, /no longer linked to you/);
  assert.match(privacy, /id="controller"/);
  assert.match(privacy, /Matheus Paranhos/);
  assert.match(privacy, /id="your-rights"/);
  assert.match(privacy, /cnpd\.pt/);
  assert.match(privacy, /LEGAL_NOTICE_PATH/);
});

test("Privacy date is bumped and comes from lib/legal/privacy.ts", () => {
  assert.equal(PRIVACY_UPDATED_DATE, "November 10, 2026");
  assert.match(privacy, /Updated: \{PRIVACY_UPDATED_DATE\}/);
  assert.doesNotMatch(privacy, /Toone Pro \(Mac App Store\)\s*<\/h2>/, "Pro is no longer described as Store-only");
});
