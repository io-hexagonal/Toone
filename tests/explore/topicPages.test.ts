import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  TOPIC_PAGE_INTROS,
  TOPIC_PAGE_MIN_LISTINGS,
  facetListings,
  findTopicTerm,
  isTopicPageIndexable,
  termSlug,
  topicPageCopy,
  topicPageIntro,
  topicPagePath,
  topicQuery,
} from "../../lib/explore/topicPages";
import { categoryHref } from "../../lib/explore/presentation";
import type { ExploreTaxonomy } from "../../lib/explore/taxonomy";

const taxonomy: ExploreTaxonomy = {
  version: "explore-v1",
  terms: [
    { id: "cat_marketing-sales", kind: "category", label: "Marketing & sales", description: "Prefer X when Y.", active: true, sort_order: 3 },
    { id: "topic_seo-content", kind: "topic", label: "SEO content", description: "", active: true, sort_order: 0 },
    { id: "role_founders-entrepreneurs", kind: "useful_for", label: "Founders & entrepreneurs", description: "", active: true, sort_order: 0 },
    { id: "topic_retired", kind: "topic", label: "Retired", description: "", active: false, sort_order: 9 },
  ],
};

test("each term kind has its own clean path", () => {
  assert.equal(topicPagePath(taxonomy.terms[0]), "/explore/category/marketing-sales");
  assert.equal(topicPagePath(taxonomy.terms[1]), "/explore/topic/seo-content");
  assert.equal(topicPagePath(taxonomy.terms[2]), "/explore/for/founders-entrepreneurs");
});

test("an id of the wrong kind or shape has no slug", () => {
  assert.equal(termSlug({ id: "topic_seo-content", kind: "category" }), null);
  assert.equal(termSlug({ id: "cat_Has Space", kind: "category" }), null);
  assert.equal(termSlug({ id: "cat_", kind: "category" }), null);
});

test("a URL resolves only to an active term of that kind", () => {
  assert.equal(findTopicTerm(taxonomy, "topic", "seo-content")?.id, "topic_seo-content");
  assert.equal(findTopicTerm(taxonomy, "category", "seo-content"), null);
  assert.equal(findTopicTerm(taxonomy, "topic", "retired"), null);
  assert.equal(findTopicTerm(taxonomy, "topic", "../search"), null);
  assert.equal(findTopicTerm(null, "topic", "seo-content"), null);
});

test("a topic page filters the catalog on exactly its term", () => {
  assert.deepEqual(topicQuery(taxonomy.terms[0]), { type: "all", query: "", tag: "", page: 1, category: "cat_marketing-sales" });
  assert.deepEqual(topicQuery(taxonomy.terms[1]).topics, ["topic_seo-content"]);
  assert.deepEqual(topicQuery(taxonomy.terms[2]).usefulFor, ["role_founders-entrepreneurs"]);
});

test("a topic page is indexable only with a written intro and 5 distinct records (TOPIC-012)", () => {
  assert.equal(TOPIC_PAGE_MIN_LISTINGS, 5);
  const intros = { "cat_marketing-sales": "Routines for a marketing team's weekly work." };
  assert.equal(isTopicPageIndexable("cat_marketing-sales", 4, intros), false);
  assert.equal(isTopicPageIndexable("cat_marketing-sales", 5, intros), true);
  assert.equal(isTopicPageIndexable("cat_marketing-sales", Number.NaN, intros), false);
  // A blank intro counts as none.
  assert.equal(isTopicPageIndexable("cat_marketing-sales", 50, { "cat_marketing-sales": "   " }), false);
  assert.equal(topicPageIntro("cat_marketing-sales", { "cat_marketing-sales": "  Weekly marketing work.  " }), "Weekly marketing work.");
  assert.equal(topicPageIntro("cat_marketing-sales", { "cat_marketing-sales": "" }), null);
  // No written intro: noindex at any count.
  assert.equal(isTopicPageIndexable("topic_seo-content", 50, intros), false);
  // Nothing has a written intro yet, so no topic page is indexable today.
  assert.deepEqual(TOPIC_PAGE_INTROS, {});
  assert.equal(isTopicPageIndexable("cat_marketing-sales", 50), false);
  // Bundles repeat routines already listed: only routines count as distinct.
  const facets = [{ term_id: "cat_marketing-sales", routines: 4, bundles: 1 }];
  assert.equal(facetListings(facets, "cat_marketing-sales"), 4);
  assert.equal(facetListings(facets, "topic_seo-content"), 0);
});

test("the copy comes from the label, never the classifier description", () => {
  const category = topicPageCopy(taxonomy.terms[0]);
  assert.equal(category.heading, "Marketing & sales AI Routines & Workflow Templates");
  assert.match(category.intro, /^Reviewed routines and bundles for marketing & sales\./);
  assert.doesNotMatch(category.intro, /Prefer/);
  assert.match(topicPageCopy(taxonomy.terms[1]).intro, /for SEO content\./);
  assert.equal(topicPageCopy(taxonomy.terms[2]).heading, "AI Routines & Workflow Templates for Founders & entrepreneurs");
});

test("the category breadcrumb links to the topic page, never to a filter view", () => {
  assert.equal(categoryHref("en", "cat_marketing-sales"), "/en/explore/category/marketing-sales");
  assert.equal(categoryHref("en", "odd id"), null);
});

test("record pages link the category only while its topic page is indexable (A7)", () => {
  // The decision lives in isCategoryTopicIndexable (lib/explore/api.ts, server-only):
  // the topic page's own rule, so with no written intro there is no category level.
  const api = readFileSync("lib/explore/api.ts", "utf8");
  assert.match(api, /export const isCategoryTopicIndexable = cache\(/);
  assert.match(api, /topicPageIntro\(categoryId\) === null\) return false/);
  assert.match(api, /isTopicPageIndexable\(categoryId, await topicListings\(categoryId\)\)/);
  for (const page of ["app/[locale]/explore/routines/[slug]/page.tsx", "app/[locale]/explore/bundles/[slug]/page.tsx"]) {
    const source = readFileSync(page, "utf8");
    assert.match(source, /const categoryLinked = !!categoryId && \(await isCategoryTopicIndexable\(categoryId\)\)/, page);
    assert.match(source, /const category = categoryId && categoryLinked/, page);
  }
  const hero = readFileSync("components/explore/ProfileView.tsx", "utf8");
  assert.match(hero, /category && categoryLinked \? categoryHref\(locale, category\) : null/);
});

test("TOPIC-012: topic metadata and record breadcrumbs count listings with one shared helper", () => {
  const page = readFileSync("components/explore/TopicPage.tsx", "utf8");
  const api = readFileSync("lib/explore/api.ts", "utf8");
  assert.match(page, /await topicListings\(topic\.term\.id\)/, "metadata uses the facet count");
  assert.doesNotMatch(page, /getCatalog\(/, "no second, differently counted catalog read");
  assert.match(api, /isTopicPageIndexable\(categoryId, await topicListings\(categoryId\)\)/);
  assert.match(api, /facetListings\(await getExploreFacets\(\{ type: "all", query: "", tag: "", page: 1 \}\), termId\)/);
});
