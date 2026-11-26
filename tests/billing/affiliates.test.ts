import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ATTRIBUTION_DAYS,
  affiliateAppliesTo,
  affiliatePromotionFor,
  discountText,
  percentOffPrice,
  promotionCodeFromSlug,
  rememberAffiliate,
  rememberedAffiliate,
  slugFromName,
  slugProblem,
  type PublicAffiliate,
} from "../../lib/affiliates";
import { EMPTY_AFFILIATE_FORM, affiliateRequestFrom } from "../../components/admin/affiliate-form";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

function withWindow<T>(run: () => T): T {
  const globals = globalThis as unknown as { window?: unknown };
  const previous = globals.window;
  globals.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
  try {
    return run();
  } finally {
    globals.window = previous;
  }
}

const jane: PublicAffiliate = {
  slug: "jane-doe",
  name: "Jane Doe",
  promotion_code: "JANEDOE",
  discount: { percent: 20, duration: "once", months: null, scope: "all" },
  discount_text: "20% off the first payment",
};

test("slugs follow the server's rules", () => {
  assert.equal(slugFromName("  Jané Dœ & Co! "), "jane-d-co");
  assert.equal(slugProblem("jane"), null);
  assert.equal(slugProblem("jane-doe-2"), null);
  assert.notEqual(slugProblem("ab"), null);
  assert.notEqual(slugProblem("-jane"), null);
  assert.notEqual(slugProblem("jane--doe"), null);
  assert.notEqual(slugProblem("Jane"), null);
  assert.notEqual(slugProblem("admin"), null);
  assert.notEqual(slugProblem("a".repeat(33)), null);
  assert.equal(promotionCodeFromSlug("jane-doe-2"), "JANEDOE2");
});

test("discount text matches the server's wording", () => {
  assert.equal(discountText({ percent: 20, duration: "once", months: null, scope: "all" }), "20% off the first payment");
  assert.equal(discountText({ percent: 15, duration: "forever", months: null, scope: "all" }), "15% off every payment");
  assert.equal(discountText({ percent: 10, duration: "repeating", months: 3, scope: "all" }), "10% off the first 3 months");
  assert.equal(discountText({ percent: 30, duration: "once", months: null, scope: "lifetime" }), "30% off Toone Pro Lifetime");
  assert.equal(discountText(null), "Discount set in Stripe");
});

test("the discounted price keeps the price's own format and Stripe's rounding", () => {
  assert.equal(percentOffPrice(20, 19999, "€199.99"), "€159.99");
  assert.equal(percentOffPrice(20, 999, "9,99 €"), "7,99 €");
  assert.equal(percentOffPrice(15, 7999, "$79.99"), "$67.99");
  assert.equal(percentOffPrice(0, 7999, "$79.99"), null);
});

test("a creator link is remembered for the attribution window and the last link wins", () => {
  withWindow(() => {
    const start = new Date("2026-11-22T12:00:00Z");
    assert.equal(rememberedAffiliate(start), null);
    rememberAffiliate(jane, start);
    assert.equal(rememberedAffiliate(start)?.code, "JANEDOE");
    assert.equal(affiliatePromotionFor("pro_monthly", start), "JANEDOE");
    const later = new Date(start.getTime() + (ATTRIBUTION_DAYS - 1) * 86_400_000);
    assert.equal(rememberedAffiliate(later)?.slug, "jane-doe");
    const expired = new Date(start.getTime() + (ATTRIBUTION_DAYS + 1) * 86_400_000);
    assert.equal(rememberedAffiliate(expired), null);
    assert.equal(affiliatePromotionFor("pro_lifetime", expired), null);
    rememberAffiliate({ ...jane, slug: "max", name: "Max", promotion_code: "MAX" }, later);
    assert.equal(rememberedAffiliate(later)?.code, "MAX");
  });
});

test("a lifetime-only creator code is sent with lifetime checkouts only", () => {
  withWindow(() => {
    const now = new Date("2026-11-22T12:00:00Z");
    rememberAffiliate({ ...jane, discount: { percent: 30, duration: "once", months: null, scope: "lifetime" } }, now);
    const remembered = rememberedAffiliate(now);
    assert.equal(affiliateAppliesTo(remembered, "pro_yearly"), false);
    assert.equal(affiliateAppliesTo(remembered, "pro_lifetime"), true);
    assert.equal(affiliatePromotionFor("pro_monthly", now), null);
    assert.equal(affiliatePromotionFor("pro_lifetime", now), "JANEDOE");
  });
});

test("a tampered or malformed remembered value is ignored", () => {
  withWindow(() => {
    const storage = (globalThis as unknown as { window: { localStorage: ReturnType<typeof memoryStorage> } }).window.localStorage;
    storage.setItem("toone.affiliate", JSON.stringify({ code: "drop table", savedAt: Date.now() }));
    assert.equal(rememberedAffiliate(), null);
    storage.setItem("toone.affiliate", "not json");
    assert.equal(rememberedAffiliate(), null);
  });
});

test("the admin form builds the create request and names the first problem", () => {
  const ok = affiliateRequestFrom({ ...EMPTY_AFFILIATE_FORM, name: " Jane ", slug: "jane" });
  assert.deepEqual(ok, {
    ok: true,
    input: {
      name: "Jane",
      slug: "jane",
      commission_percent: 25,
      discount: { percent: 75, duration: "once", months: null, scope: "lifetime" },
    },
  });
  const lifetime = affiliateRequestFrom({ ...EMPTY_AFFILIATE_FORM, name: "Jane", slug: "jane", scope: "all", duration: "repeating", months: 0 });
  assert.deepEqual(lifetime.ok && lifetime.input.discount, { percent: 75, duration: "once", months: null, scope: "lifetime" });
  const existing = affiliateRequestFrom({ ...EMPTY_AFFILIATE_FORM, name: "Jane", slug: "jane", source: "existing", existingCode: "spring26" });
  assert.equal(existing.ok && existing.input.existing_promotion_code, "SPRING26");
  assert.equal(existing.ok && existing.input.discount, undefined);
  const problems: Array<[Partial<typeof EMPTY_AFFILIATE_FORM>, string]> = [
    [{ name: "" }, "affiliate-name"],
    [{ slug: "admin" }, "affiliate-slug"],
    [{ commission: 60 }, "affiliate-commission"],
    [{ percent: 95 }, "affiliate-percent"],
    [{ source: "existing", existingCode: "x" }, "affiliate-existing"],
  ];
  for (const [change, field] of problems) {
    const result = affiliateRequestFrom({ ...EMPTY_AFFILIATE_FORM, name: "Jane", slug: "jane", ...change });
    assert.equal(result.ok, false, field);
    assert.equal(!result.ok && result.field, field);
  }
});

test("every creator idea has a unique slug, steps and safe links", async () => {
  const { CREATOR_IDEAS, creatorIdea } = await import("../../lib/creator-ideas");
  const slugs = new Set<string>();
  for (const idea of CREATOR_IDEAS) {
    assert.match(idea.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, idea.slug);
    assert.ok(!slugs.has(idea.slug), `duplicate ${idea.slug}`);
    slugs.add(idea.slug);
    assert.ok(idea.title && idea.summary && idea.label && idea.showYourAudience, idea.slug);
    assert.ok(idea.steps.length >= 2, idea.slug);
    assert.ok(idea.prompts.length >= 1, `${idea.slug} has no setup prompt`);
    for (const prompt of idea.prompts) {
      assert.match(prompt.text, /^Set up /, `${idea.slug}: ${prompt.label} starts with what to set up`);
      assert.match(prompt.text, /During setup, ask me for:/, `${idea.slug}: ${prompt.label} names its setup questions`);
      // The second paragraph sets up the page where I review runs and leave remarks;
      // what I do there is saved as files the routine reads back.
      const reviewPage = prompt.text.split("\n\n")[1];
      assert.match(reviewPage, /^[A-Z][a-z]+ page \([a-z-]+\.html\)[^]*create it in this project, open it in my browser/, `${idea.slug}: ${prompt.label} has no review page`);
      assert.match(reviewPage, /remark/, `${idea.slug}: ${prompt.label} review page takes no remarks`);
      assert.match(reviewPage, /Save every [^.]* as a file in this project/, `${idea.slug}: ${prompt.label} review page does not save what I do there`);
      // A guard against runaway prompts, not a hard limit: the Reddit watcher's prompt grew
      // on purpose to about 4,600 characters (radar page, learning from edits) in d2d26f1.
      assert.ok(prompt.text.length < 5000, `${idea.slug}: ${prompt.label} is too long`);
      assert.doesNotMatch(prompt.text, /\u2014/, `${prompt.label} uses an em dash`);
    }
    for (const link of idea.links) assert.match(link.href, /^https:\/\//, link.href);
    assert.equal(creatorIdea(idea.slug), idea);
    assert.doesNotMatch(`${idea.title} ${idea.summary} ${idea.steps.join(" ")}`, /—/, `${idea.slug} uses an em dash`);
  }
  assert.ok(CREATOR_IDEAS.length >= 3);
  assert.equal(creatorIdea("nope"), null);
});
