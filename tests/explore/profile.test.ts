import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { getRoutine, getBundle, listRoutines, resetExploreMemo } from "../../lib/explore/data";
import { normalizeListingProfile, normalizeThirdPartyReviews } from "../../lib/explore/profile";
import {
  breadcrumbSchema,
  cardText,
  exploreMetadata,
  isExploreIndexable,
  profileSchema,
  routineSchema,
  SITE,
} from "../../lib/explore/presentation";

beforeEach(() => resetExploreMemo());

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
const response = (data: unknown) => new Response(JSON.stringify({ data }));
/** §2.3 public projection of the §1.1 fixture. */
function publicProfile() {
  const { author_ran_it, related_hints, ...rest } = fixture("listing-profile");
  void author_ran_it;
  void related_hints;
  return rest;
}
function quiet(t: { mock: { method: (o: object, k: string, f: () => void) => { mock: { calls: { arguments: unknown[] }[] } } } }) {
  return t.mock.method(console, "warn", () => {});
}

test("the §1.1 fixture decodes to the public profile; private and unknown keys never survive", (t) => {
  const warn = quiet(t);
  const raw = { ...fixture("listing-profile"), future_field: { anything: true } };
  const profile = normalizeListingProfile(raw, "routine test");
  assert.ok(profile);
  assert.equal(warn.mock.calls.length, 0);
  assert.ok(!("author_ran_it" in profile));
  assert.ok(!("related_hints" in profile));
  assert.ok(!("future_field" in profile));
  assert.deepEqual(profile, publicProfile());
});

test("malformed profiles are absent (fallback layout) and logged, never thrown", (t) => {
  const warn = quiet(t);
  const base = publicProfile();
  const cases: [string, unknown][] = [
    ["wrong version", { ...base, profile_schema_version: 2 }],
    ["answer not text", { ...base, answer: 42 }],
    ["no search", { ...base, search: undefined }],
    ["empty title", { ...base, search: { ...base.search, display_title: "  " } }],
    ["results not a list", { ...base, results: "report" }],
    ["no results", { ...base, results: [] }],
    ["bad action", { ...base, third_parties: [{ ...base.third_parties[0], actions: ["hack"] }] }],
    ["non-https site", { ...base, third_parties: [{ ...base.third_parties[0], url: "javascript:alert(1)" }] }],
    ["bad customization kind", { ...base, customization: [{ ...base.customization[0], kind: "shell" }] }],
    ["not an object", "profile"],
    ["array", [base]],
  ];
  for (const [name, raw] of cases)
    assert.equal(normalizeListingProfile(raw, "routine wfl_test"), null, name);
  assert.equal(warn.mock.calls.length, cases.length);
  assert.match(String(warn.mock.calls[1].arguments[0]), /listing_profile\.answer/);
  assert.equal(normalizeListingProfile(null, "routine legacy"), null);
  assert.equal(normalizeListingProfile(undefined, "routine legacy"), null);
  assert.equal(warn.mock.calls.length, cases.length, "absent profiles are not logged");
});

test("optional lists default to empty and an unsafe guide path is dropped", () => {
  const base = publicProfile();
  const { faq, customization, third_parties, you_provide, ...rest } = base;
  void faq; void customization; void third_parties; void you_provide;
  const profile = normalizeListingProfile({ ...rest, guide_path: "https://evil.example/x" }, "r");
  assert.ok(profile);
  assert.deepEqual([profile.faq, profile.customization, profile.third_parties, profile.you_provide], [[], [], [], []]);
  assert.equal(profile.guide_path, "");
  assert.equal(normalizeListingProfile(base, "r")?.guide_path, "/en/ai-agent-routines");
});

test("third-party reviews never publish excluded domains", () => {
  assert.deepEqual(
    normalizeThirdPartyReviews([
      { domain: "ProductHunt.com", status: "well_known", note: "" },
      { domain: "bad.example", status: "excluded", note: "spam" },
      { domain: "betalist.com", status: "ok_with_note", note: " Paid fast track exists. " },
      "garbage",
    ]),
    [
      { domain: "producthunt.com", status: "well_known", note: "" },
      { domain: "betalist.com", status: "ok_with_note", note: "Paid fast track exists." },
    ],
  );
});

test("routine detail carries the profile, indexable, reviews and related; legacy records keep defaults", async (t) => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  const legacy = fixture("routine-detail");
  const entry = { ...fixture("routine-entry"), workflow_id: "wfl_a1b2c3d4e5f6g7h8" };
  const withProfile = {
    ...legacy,
    listing_profile: fixture("listing-profile"),
    indexable: false,
    third_party_reviews: [{ domain: "producthunt.com", status: "well_known", note: "" }],
    related: [entry, { ...entry }, { ...entry, workflow_id: legacy.workflow_id }, { junk: true }],
  };
  t.mock.method(globalThis, "fetch", async () => response(withProfile));
  const detail = await getRoutine(legacy.slug);
  assert.ok(detail?.listing_profile);
  assert.equal(detail.listing_profile.search.display_title, "Product launch prep for Product Hunt and directories");
  assert.ok(!("author_ran_it" in detail.listing_profile));
  assert.equal(detail.indexable, false);
  assert.equal(detail.third_party_reviews?.length, 1);
  // Self, duplicates and malformed entries are dropped.
  assert.deepEqual(detail.related?.map((item) => item.workflow_id), ["wfl_a1b2c3d4e5f6g7h8"]);

  resetExploreMemo();
  const plain = { ...legacy };
  for (const key of ["listing_profile", "indexable", "third_party_reviews", "related"]) delete plain[key];
  t.mock.method(globalThis, "fetch", async () => response(plain));
  const old = await getRoutine(legacy.slug);
  assert.equal(old?.listing_profile, null);
  assert.equal(old?.indexable, true);
  assert.deepEqual(old?.related, []);
});

test("a malformed profile on a detail falls back instead of failing the page", async (t) => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  const warn = quiet(t);
  const bundle = { ...fixture("bundle-detail"), listing_profile: { profile_schema_version: 1, answer: [] } };
  t.mock.method(globalThis, "fetch", async () => response(bundle));
  const detail = await getBundle(bundle.slug);
  assert.ok(detail);
  assert.equal(detail.listing_profile, null);
  assert.equal(warn.mock.calls.length, 1);
});

test("catalog entries expose the card fields only when usable", async (t) => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  const entry = fixture("routine-entry");
  t.mock.method(globalThis, "fetch", async () =>
    response([
      { ...entry, display_title: "Plain title", card_summary: "Plain summary.", results_count: 3 },
      { ...entry, display_title: 7, card_summary: "", results_count: -1 },
    ]),
  );
  const { items } = await listRoutines();
  assert.deepEqual(cardText(items[0]), { title: "Plain title", summary: "Plain summary." });
  assert.equal(items[0].results_count, 3);
  assert.deepEqual(cardText(items[1]), { title: entry.title, summary: entry.summary });
  assert.equal(items[1].results_count, null);
});

test("profile metadata: seo title, meta description, cover alt and robots from indexable", () => {
  const profile = normalizeListingProfile(fixture("listing-profile"), "r")!;
  const cover = "https://api.example/v1/workflows/x/cover.jpg";
  const meta = exploreMetadata("en", "/explore/routines/x", profile.search.seo_title, profile.search.meta_description, cover, {
    imageAlt: profile.cover_alt,
    indexable: true,
  });
  assert.equal(meta.title, "Product Launch Prep Routine for Product Hunt & Directories");
  assert.equal(meta.description, profile.search.meta_description);
  assert.deepEqual(meta.openGraph.images, [{ url: cover, alt: profile.cover_alt }]);
  assert.equal(meta.robots.index, true);
  const hidden = exploreMetadata("en", "/explore/routines/x", "t", "d", null, { indexable: false });
  assert.deepEqual(hidden.robots, { index: false, follow: true });
  // Legacy callers are unchanged.
  assert.equal(exploreMetadata("en", "/explore", "t", "d", null).robots.index, true);
  assert.equal(isExploreIndexable({ listing_profile: null, indexable: true }), false);
  assert.equal(isExploreIndexable({ listing_profile: profile, indexable: false }), false);
  assert.equal(isExploreIndexable({ listing_profile: profile, indexable: true }), true);
});

test("profile JSON-LD is a HowTo from the plain steps with tools, supplies and a category breadcrumb", () => {
  const detail = { ...fixture("routine-detail"), classification: null };
  const profile = normalizeListingProfile(fixture("listing-profile"), "r")!;
  const schema = profileSchema(detail, profile, "/explore/routines/x");
  assert.equal(schema["@type"], "HowTo");
  assert.equal(schema.name, profile.search.display_title);
  assert.equal(schema.description, profile.answer);
  assert.deepEqual(schema.step.map((step) => step.text), profile.how_it_works);
  assert.deepEqual(schema.tool, [{ "@type": "HowToTool", name: "Product Hunt" }]);
  assert.deepEqual(schema.supply?.map((s) => s.name), ["Your launch sites", "Approved product facts", "Account permissions"]);
  assert.ok(!JSON.stringify(schema).includes("FAQPage"));
  assert.equal(schema.author?.name, detail.author_name);
  const crumbs = breadcrumbSchema("Title", "/explore/routines/x", { id: "cat_marketing-sales", label: "Marketing & sales" });
  assert.deepEqual(crumbs.itemListElement.map((c) => c.name), ["Toone", "Explore", "Marketing & sales", "Title"]);
  assert.equal(crumbs.itemListElement[2].item, `${SITE}/en/explore?category=cat_marketing-sales`);
  assert.equal(breadcrumbSchema("Title", "/x").itemListElement.length, 3);
  // The legacy HowTo is untouched.
  assert.equal(routineSchema(fixture("routine-detail")).name, fixture("routine-detail").title);
});
