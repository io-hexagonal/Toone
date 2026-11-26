import assert from "node:assert/strict";
import test from "node:test";
import {
  TOPIC_PAGE_INTROS,
  TOPIC_PAGE_MIN_LISTINGS,
  facetListings,
  findTopicTerm,
  isTopicPageIndexable,
  termSlug,
  topicPageCopy,
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

test("the category breadcrumb links to the topic page", () => {
  assert.equal(categoryHref("en", "cat_marketing-sales"), "/en/explore/category/marketing-sales");
  assert.match(categoryHref("en", "odd id"), /^\/en\/explore\?/);
});
