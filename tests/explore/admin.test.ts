import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ApiError, getCapabilities, hasCapability } from "../../lib/api";
import {
  EXPLORE_EDIT_CAPABILITY, buildSaveRequest, canEditExplore, editCoverUrl, fieldForPath, formFromEdit,
  getListingEdit, groupErrorDetails, isEditDirty, isListingRef, normalizeTags, parseListingKind,
  publicListingPath, saveListingEdit, tagProblem,
  type ExploreListingEdit, type ListingProfileFull,
} from "../../lib/explore/admin";
import { resolveCoverPath } from "../../lib/explore/cover";
import EditListingLink from "../../components/explore/EditListingLink";

const profileFixture = (): ListingProfileFull =>
  JSON.parse(readFileSync(new URL("./fixtures/listing-profile.json", import.meta.url), "utf8"));

function loaded(overrides: Partial<ExploreListingEdit> = {}): ExploreListingEdit {
  return {
    kind: "routine",
    id: "wfl_abcdefgh",
    slug: "launch-prep",
    revision_id: "wfr_abcdefgh",
    content_hash: "c".repeat(64),
    title: "Launch Surface Preparation",
    summary: "Submitted summary",
    listing_profile: profileFixture(),
    profile_hash: "p".repeat(64),
    classification: {
      schema_version: 1,
      taxonomy_version: "2026-09-01",
      input_hash: "i".repeat(64),
      category_id: "cat_marketing-sales",
      topic_ids: ["topic_product-launch"],
      useful_for_ids: ["role_founders", "role_marketers"],
      explanation: "Prepares a launch.",
    },
    classification_hash: "k".repeat(64),
    tags: ["launch", "product hunt"],
    cover_url: "workflows/wfl_abcdefgh/revisions/wfr_abcdefgh/cover.jpg?v=pres_1",
    presentation_id: "pres_1",
    refs: { useful_for_ids: ["role_founders", "role_marketers"], artefacts: [], inputs: [] },
    ...overrides,
  };
}

/** Every leaf path of a JSON value, e.g. `search.slug_words[0]`. */
function leafPaths(value: unknown, at = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => leafPaths(item, `${at}[${i}]`));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, item]) => leafPaths(item, at ? `${at}.${key}` : key));
  return [at];
}

test("the save body sends the whole profile back: unexposed fields are preserved exactly", () => {
  const edit = loaded();
  const form = formFromEdit(edit);
  assert.ok(form.profile);
  form.profile.search.display_title = "Launch prep, edited";
  form.profile.results = [form.profile.results[1], form.profile.results[0]];
  form.profile.faq.pop();

  const body = buildSaveRequest(edit, form);
  const original = profileFixture();
  const sent = body.listing_profile!;
  assert.equal(sent.search.display_title, "Launch prep, edited");
  assert.deepEqual(sent.results.map((r) => r.artefact_id), ["artefact-strategies", "artefact-readiness-report"]);
  assert.equal(sent.faq.length, original.faq.length - 1);
  // Fields the editor never shows travel unchanged.
  assert.equal(sent.author_ran_it, original.author_ran_it);
  assert.deepEqual(sent.related_hints, original.related_hints);
  assert.equal(sent.guide_path, original.guide_path);
  assert.deepEqual(sent.search.slug_words, original.search.slug_words);
  assert.deepEqual(sent.search.search_phrases, original.search.search_phrases);
  assert.deepEqual(sent.customization, original.customization);
  assert.deepEqual(sent.third_parties, original.third_parties);
  assert.equal(sent.profile_schema_version, 1);
  // Same keys at the top level and in search: the server rejects unknown or missing keys.
  assert.deepEqual(Object.keys(sent).sort(), Object.keys(original).sort());
  assert.deepEqual(Object.keys(sent.search).sort(), Object.keys(original.search).sort());
  // The loaded edit state itself is untouched (the form edits a copy).
  assert.deepEqual(edit.listing_profile, original);
});

test("an unchanged form round-trips to the loaded profile, leaf for leaf", () => {
  const edit = loaded();
  const body = buildSaveRequest(edit, formFromEdit(edit));
  assert.deepEqual(leafPaths(body.listing_profile), leafPaths(profileFixture()));
  assert.deepEqual(body.listing_profile, profileFixture());
});

test("expected hashes come from the loaded state; classification keeps its loaded hash and versions", () => {
  const edit = loaded();
  const form = formFromEdit(edit);
  form.classification = { ...form.classification!, category_id: "cat_operations", input_hash: "tampered", taxonomy_version: "x", schema_version: 9 };
  form.coverDataUrl = "data:image/jpeg;base64,/9j/2Q==";
  form.reason = "  Fix the title  ";
  const body = buildSaveRequest(edit, form);
  assert.equal(body.revision_id, "wfr_abcdefgh");
  assert.equal(body.expected_content_hash, edit.content_hash);
  assert.equal(body.expected_profile_hash, edit.profile_hash);
  assert.equal(body.expected_classification_hash, edit.classification_hash);
  assert.equal(body.expected_presentation_id, "pres_1");
  assert.equal(body.classification?.category_id, "cat_operations");
  assert.equal(body.classification?.input_hash, "i".repeat(64));
  assert.equal(body.classification?.taxonomy_version, "2026-09-01");
  assert.equal(body.classification?.schema_version, 1);
  assert.equal(body.classification?.explanation, "Prepares a launch.");
  assert.equal(body.cover_image_data_url, "data:image/jpeg;base64,/9j/2Q==");
  assert.equal(body.reason, "Fix the title");
  assert.equal(buildSaveRequest(edit, formFromEdit(edit)).cover_image_data_url, null, "cover is null when unchanged");
});

test("with a profile, the catalog title/summary go back as loaded even if the form holds others", () => {
  const edit = loaded({ title: "Catalog title", summary: "Catalog summary" });
  const form = formFromEdit(edit);
  form.title = "ignored";
  form.summary = "ignored";
  const body = buildSaveRequest(edit, form);
  assert.equal(body.title, "Catalog title");
  assert.equal(body.summary, "Catalog summary");
  assert.equal(isEditDirty(edit, form), false);
});

test("legacy listings (no profile, no classification) edit the catalog title/summary and send nulls", () => {
  const edit = loaded({
    listing_profile: null, profile_hash: "", classification: null, classification_hash: "",
    title: "micro1/peer2paper", summary: "Audit one caller-supplied quantitative claim.",
  });
  const form = formFromEdit(edit);
  assert.equal(form.profile, null);
  assert.equal(isEditDirty(edit, form), false);
  form.title = "  Peer2Paper scientific audit ";
  form.summary = "Audit one quantitative claim and get a replayable package. ";
  const body = buildSaveRequest(edit, form);
  assert.equal(body.title, "Peer2Paper scientific audit");
  assert.equal(body.summary, "Audit one quantitative claim and get a replayable package.");
  assert.equal(body.listing_profile, null);
  assert.equal(body.classification, null);
  assert.equal(body.expected_profile_hash, "");
  assert.equal(body.expected_classification_hash, "");
  assert.equal(isEditDirty(edit, form), true);
  form.title = `${edit.title} `;
  form.summary = edit.summary;
  assert.equal(isEditDirty(edit, form), false, "whitespace-only edits are not changes");
});

test("tags are trimmed, deduplicated and normalized per kind", () => {
  assert.deepEqual(normalizeTags(["  launch ", "launch", "", "product   hunt", "Launch"], "routine"), ["launch", "product hunt", "Launch"]);
  assert.deepEqual(normalizeTags([" Product Hunt ", "product-hunt", "SEO"], "bundle"), ["product-hunt", "seo"]);
  assert.equal(tagProblem("a".repeat(40), "routine"), null);
  assert.ok(tagProblem("a".repeat(41), "routine"));
  assert.ok(tagProblem("é".repeat(21), "routine"), "40 bytes, like the server's len()");
  assert.equal(tagProblem("growth-2026", "bundle"), null);
  assert.ok(tagProblem("growth_2026", "bundle"));
  assert.ok(tagProblem("a".repeat(33), "bundle"));
  const edit = loaded();
  const form = formFromEdit(edit);
  form.tags = [" launch", "launch ", "product hunt"];
  assert.deepEqual(buildSaveRequest(edit, form).tags, ["launch", "product hunt"]);
  assert.equal(isEditDirty(edit, form), false, "normalization alone is not a change");
});

test("dirty tracking ignores the reason and key order, and clears when an edit is reverted", () => {
  const edit = loaded();
  const form = formFromEdit(edit);
  assert.equal(isEditDirty(edit, form), false);
  assert.equal(isEditDirty(edit, { ...form, reason: "why" }), false);
  const reordered = formFromEdit(edit);
  reordered.profile = Object.fromEntries(Object.entries(reordered.profile!).reverse()) as ListingProfileFull;
  assert.equal(isEditDirty(edit, reordered), false);
  const changed = formFromEdit(edit);
  changed.profile!.answer += " More.";
  assert.equal(isEditDirty(edit, changed), true);
  changed.profile!.answer = edit.listing_profile!.answer;
  assert.equal(isEditDirty(edit, changed), false);
  assert.equal(isEditDirty(edit, { ...form, tags: [...form.tags, "new"] }), true);
  assert.equal(isEditDirty(edit, { ...form, coverDataUrl: "data:image/jpeg;base64,AA==" }), true);
  assert.equal(isEditDirty(edit, { ...form, classification: { ...form.classification!, topic_ids: [] } }), true);
});

test("validation paths map to the nearest rendered field, the rest go to the summary", () => {
  const known = new Set([
    "tags", "cover_image_data_url", "classification.category_id", "listing_profile.search.display_title",
    "listing_profile.results", "listing_profile.results[1]", "listing_profile.results[1].name",
  ]);
  assert.equal(fieldForPath("listing_profile.search.display_title", known), "listing_profile.search.display_title");
  assert.equal(fieldForPath("tags[2]", known), "tags");
  assert.equal(fieldForPath("listing_profile.results[1].artefact_id", known), "listing_profile.results[1]");
  assert.equal(fieldForPath("listing_profile.results[4].name", known), "listing_profile.results");
  assert.equal(fieldForPath("listing_profile.related_hints", known), null);
  const { fields, unmatched } = groupErrorDetails([
    { path: "tags[2]", rule: "format", instruction: "Bundle tags use lowercase letters." },
    { path: "tags[3]", rule: "format" },
    { path: "listing_profile.related_hints", rule: "max_items", instruction: "At most 4." },
  ], known);
  assert.deepEqual(fields.get("tags"), ["Bundle tags use lowercase letters.", "format"]);
  assert.deepEqual(unmatched.map((d) => d.path), ["listing_profile.related_hints"]);
});

test("cover paths accept the presentation ?v= suffix and nothing else", () => {
  const base = "https://api.example.test/v1/";
  assert.equal(resolveCoverPath(base, "bundles/wfb_abcdefgh/revisions/wbr_abcdefgh/cover.jpg"), "https://api.example.test/v1/bundles/wfb_abcdefgh/revisions/wbr_abcdefgh/cover.jpg");
  assert.equal(resolveCoverPath(base, "workflows/wfl_a/revisions/wfr_b/cover.jpg?v=pres_1"), "https://api.example.test/v1/workflows/wfl_a/revisions/wfr_b/cover.jpg?v=pres_1");
  for (const bad of ["", "workflows/wfl_a/revisions/wfr_b/cover.jpg?v=", "workflows/wfl_a/revisions/wfr_b/cover.jpg?x=1", "workflows/wfl_a/revisions/wfr_b/cover.jpg?v=a&b=c", "https://evil.test/cover.jpg", "../cover.jpg"])
    assert.equal(resolveCoverPath(base, bad), null, bad);
  assert.equal(editCoverUrl(loaded({ cover_url: "" }), base), null);
  assert.equal(editCoverUrl(loaded(), base), `https://api.example.test/v1/${loaded().cover_url}`);
});

test("route params and public paths", () => {
  assert.equal(parseListingKind("routine"), "routine");
  assert.equal(parseListingKind("bundle"), "bundle");
  assert.equal(parseListingKind("workflow"), null);
  assert.ok(isListingRef("wfl_abcdefgh") && isListingRef("launch-prep"));
  assert.ok(!isListingRef("../admin") && !isListingRef("") && !isListingRef("a".repeat(129)) && !isListingRef(null));
  assert.equal(publicListingPath(loaded()), "/explore/routines/launch-prep");
  assert.equal(publicListingPath(loaded({ kind: "bundle", slug: "", id: "wfb_abcdefgh" })), "/explore/bundles/wfb_abcdefgh");
});

/* ---------- capability gate ---------- */

function mockFetch(t: { mock: { method: typeof test.mock.method } }, reply: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return reply(String(input), init);
  });
  return calls;
}

test("the edit capability is explore.edit and nothing else", () => {
  assert.equal(EXPLORE_EDIT_CAPABILITY, "explore.edit");
  assert.equal(canEditExplore(["explore.edit"]), true);
  assert.equal(canEditExplore(["invitation.manage"]), false);
  assert.equal(canEditExplore([]), false);
  assert.equal(canEditExplore(null), false);
});

test("capabilities come from /me/capabilities with the session token; odd shapes read as none", async (t) => {
  let payload: unknown = { data: { capabilities: ["invitation.manage", "explore.edit"] } };
  const calls = mockFetch(t, () => new Response(JSON.stringify(payload)));
  assert.equal(await hasCapability("tok", "explore.edit"), true);
  assert.ok(calls[0].url.endsWith("/me/capabilities"));
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), "Bearer tok");
  assert.equal(calls[0].init.cache, "no-store");
  payload = { data: { capabilities: ["invitation.manage"] } };
  assert.equal(await hasCapability("tok", "explore.edit"), false);
  payload = { data: { capabilities: "explore.edit" } };
  assert.deepEqual(await getCapabilities("tok"), []);
});

test("the Edit listing island renders nothing on the server (ISR output is unchanged)", () => {
  const html = renderToStaticMarkup(createElement(EditListingLink, { kind: "routine", id: "wfl_abcdefgh", locale: "en" }));
  assert.equal(html, "");
});

/* ---------- client API ---------- */

test("GET and PUT use the admin route with the bearer token and unwrap the data envelope", async (t) => {
  const edit = loaded();
  const calls = mockFetch(t, () => new Response(JSON.stringify({ data: edit })));
  assert.deepEqual(await getListingEdit("tok", "routine", "launch-prep"), edit);
  assert.ok(calls[0].url.endsWith("/admin/explore/listings/routine/launch-prep"));
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), "Bearer tok");

  const body = buildSaveRequest(edit, formFromEdit(edit));
  await saveListingEdit("tok", "bundle", "wfb_abcdefgh", body);
  assert.ok(calls[1].url.endsWith("/admin/explore/listings/bundle/wfb_abcdefgh"));
  assert.equal(calls[1].init.method, "PUT");
  assert.equal(new Headers(calls[1].init.headers).get("Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), body);
});

test("conflicts and validation errors keep the server message, code and details", async (t) => {
  let reply = new Response(JSON.stringify({ code: "conflict", message: "This listing changed; reload it." }), { status: 409 });
  mockFetch(t, () => reply);
  const edit = loaded();
  const body = buildSaveRequest(edit, formFromEdit(edit));
  await assert.rejects(saveListingEdit("tok", "routine", "x", body), (error: unknown) =>
    error instanceof ApiError && error.status === 409 && error.code === "conflict" && error.message === "This listing changed; reload it.");
  reply = new Response(JSON.stringify({
    code: "invalid_input", message: "The listing edit is incomplete or invalid.",
    details: [{ path: "tags[2]", rule: "format", action: "correct_listing_edit", instruction: "Tags must be 1–40 characters." }, { nope: true }],
  }), { status: 400 });
  await assert.rejects(saveListingEdit("tok", "routine", "x", body), (error: unknown) =>
    error instanceof ApiError && error.status === 400 && error.details.length === 1 && error.details[0].path === "tags[2]");
});
