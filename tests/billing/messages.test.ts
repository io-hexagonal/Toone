import assert from "node:assert/strict";
import { test } from "node:test";
import { locales } from "../../i18n/routing";
import { TOONE_PRO_FREE_ROUTINE_CREATIONS } from "../../lib/legal/terms";

/* `billing.*` (pricing, success, cancel) and the FAQ Pro entry exist in every locale. */

type Tree = { [key: string]: string | Tree };

async function load(locale: string): Promise<Record<string, Tree>> {
  return (await import(`../../messages/${locale}.json`, { with: { type: "json" } })).default;
}

function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [inner, text] of leaves(value, path)) out.set(inner, text);
  }
  return out;
}

/** ICU arguments and rich-text tags a message uses. */
function tokens(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}|<(\w+)>/g)].map((match) => match[1] ?? `<${match[2]}>`).sort();
}

test("every locale has the same billing keys, filled, with the same placeholders", async () => {
  const english = leaves((await load("en")).billing);
  assert.ok(english.size > 50, "billing copy present");
  for (const locale of locales) {
    const local = leaves((await load(locale)).billing);
    assert.deepEqual([...local.keys()].sort(), [...english.keys()].sort(), `${locale} keys`);
    for (const [key, text] of local) {
      assert.ok(text.trim(), `${locale}.billing.${key} is empty`);
      assert.deepEqual(tokens(text), tokens(english.get(key)!), `${locale}.billing.${key} placeholders`);
    }
  }
});

test("there is no Russian checkout copy: ru shows the English billing strings", async () => {
  assert.deepEqual((await load("ru")).billing, (await load("en")).billing);
});

test("the FAQ has a Pro entry in every locale that takes the free allowance from the Terms", async () => {
  for (const locale of locales) {
    const faq = (await load(locale)).faq as Record<string, string>;
    assert.ok(faq.q9?.trim(), `${locale}.faq.q9`);
    assert.match(faq.a9 ?? "", /\{free\}/, `${locale}.faq.a9`);
    assert.doesNotMatch(faq.a9, /\b5\b/, `${locale}.faq.a9 states the old allowance`);
  }
  assert.equal(TOONE_PRO_FREE_ROUTINE_CREATIONS, 2);
});

test("payment copy promises an email only for a confirmed purchase, and a failed payment reads as not charged", async () => {
  for (const locale of locales) {
    const success = ((await load(locale)).billing as Tree).success as Record<string, string>;
    assert.ok(success.processingSub && success.expiredSub, locale);
  }
  const success = ((await load("en")).billing as Tree).success as Record<string, string>;
  assert.doesNotMatch(success.processingSub, /We'll email you\.$/);
  assert.match(success.processingSub, /we email you the purchase confirmation then\. If the payment doesn't go through, you aren't charged\./);
  assert.match(success.expiredSub, /If the payment didn't go through, you weren't charged\./);
  const pricing = ((await load("en")).billing as Tree).pricing as Record<string, string>;
  // From the 2026-11-20 Terms: no automatic full refund; subscriptions pro rata, Lifetime goodwill on request.
  assert.match(pricing.refund, /Withdraw from a subscription within \{days\} days and the unused part of the period is refunded/);
  assert.match(pricing.refund, /ask for a goodwill refund within \{days\} days/);
  assert.match(pricing.refund, /Lifetime bought with a discount code, including the Product Hunt price, is final/);
  for (const locale of locales) {
    const local = ((await load(locale)).billing as Tree).pricing as Record<string, string>;
    assert.doesNotMatch(`${local.refund} ${local.termsShort}`, /first (Toone Pro )?purchase|in full/i, `${locale} promises a full refund`);
  }
  assert.match(pricing.currencyNote, /local currency/);
});
