import assert from "node:assert/strict";
import test from "node:test";
import { FREE, formatPrice, isFree, normalizePrice } from "../../lib/explore/price";
import { getBundle, getRoutine, listRoutines, resetExploreMemo } from "../../lib/explore/data";
import { readFileSync } from "node:fs";

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));

test("prices parse leniently: missing is free, unusable is hidden, never \"Free\"", () => {
  assert.deepEqual(normalizePrice({ amount: 1999, currency: "usd" }), { amount: 1999, currency: "USD" });
  assert.deepEqual(normalizePrice({ amount: 500, currency: "JPY" }), { amount: 500, currency: "JPY" });
  for (const raw of [undefined, null, { amount: 0, currency: "EUR" }, { amount: 0 }])
    assert.deepEqual(normalizePrice(raw), FREE, JSON.stringify(raw));
  for (const raw of [
    "free", 0, [], {},
    { amount: -100, currency: "EUR" },
    { amount: 12.5, currency: "EUR" },
    { amount: "1999", currency: "EUR" },
    { amount: Number.MAX_VALUE, currency: "EUR" },
    { amount: 1999 },
    { amount: 1999, currency: "EURO" },
    { amount: 1999, currency: "ZZZ!" },
    { amount: 1999, currency: "QQQ" },
  ])
    assert.equal(normalizePrice(raw), null, JSON.stringify(raw));
  assert.equal(isFree(undefined), true);
  assert.equal(isFree(FREE), true);
  assert.equal(isFree(null), false);
  assert.equal(isFree({ amount: 1, currency: "USD" }), false);
});

test("a paid price that cannot be formatted shows no tag instead of Free", () => {
  assert.equal(formatPrice(null, "en", "Free"), null);
  assert.equal(formatPrice({ amount: 1999, currency: "QQQ" }, "en", "Free"), null);
  assert.equal(formatPrice({ amount: 1999, currency: "" }, "en", "Free"), null);
});

test("free shows the localized label; paid amounts format as currency in the page locale", () => {
  assert.equal(formatPrice(undefined, "en", "Free"), "Free");
  assert.equal(formatPrice(FREE, "de", "Kostenlos"), "Kostenlos");
  assert.equal(formatPrice({ amount: 1999, currency: "USD" }, "en", "Free"), "$19.99");
  assert.equal(formatPrice({ amount: 1000, currency: "USD" }, "en", "Free"), "$10");
  assert.equal(formatPrice({ amount: 1999, currency: "EUR" }, "de", "Kostenlos")?.replace(/\s/g, " "), "19,99 €");
  assert.equal(formatPrice({ amount: 1500, currency: "EUR" }, "fr", "Gratuit")?.replace(/\s/g, " "), "15 €");
  // Zero-decimal currencies: the minor unit is the whole unit.
  assert.equal(formatPrice({ amount: 500, currency: "JPY" }, "en", "Free"), "¥500");
});

test("public entries, details and bundle members carry a normalized price", async (t) => {
  resetExploreMemo();
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  const routine = { ...fixture("routine-detail"), price: { amount: 900, currency: "eur" } };
  const bundle = fixture("bundle-detail");
  bundle.members[0] = { ...bundle.members[0], price: { amount: 300, currency: "USD" } };
  delete bundle.price;
  const entry = { ...fixture("routine-entry"), price: "nonsense" };
  const freeEntry = { ...fixture("routine-entry"), workflow_id: "wfl_freeentry1" };
  delete freeEntry.price;
  t.mock.method(globalThis, "fetch", async (input: string | URL) => {
    const url = String(input);
    const data = url.includes("/bundles/") ? bundle : url.includes("/workflows/") ? routine : [entry, freeEntry];
    return new Response(JSON.stringify({ data }));
  });
  const detail = await getRoutine(fixture("routine-detail").workflow_id);
  assert.deepEqual(detail?.price, { amount: 900, currency: "EUR" });
  const bundleDetail = await getBundle(bundle.bundle_id);
  assert.deepEqual(bundleDetail?.price, FREE);
  assert.deepEqual(bundleDetail?.members[0].price, { amount: 300, currency: "USD" });
  const list = await listRoutines();
  assert.equal(list.items[0].price, null, "malformed: no tag");
  assert.deepEqual(list.items[1].price, FREE, "missing: free");
});
