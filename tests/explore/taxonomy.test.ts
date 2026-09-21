import test from "node:test";
import assert from "node:assert/strict";
import { catalogHref, parseCatalogQuery } from "../../lib/explore/presentation";
import { validateCatalogTaxonomy } from "../../lib/explore/taxonomy";

test("all three dimensions survive URL round trips, search, type and pagination", () => {
  const query = parseCatalogQuery({ q: "research", type: "bundles", category: "cat_research-analysis", topic: ["topic_competitive-research", "topic_market-research", "topic_market-research"], useful_for: ["role_marketers", "role_product-managers"], page: "3" });
  const url = new URL(catalogHref("pt", query), "https://example.test");
  assert.equal(url.searchParams.get("category"), "cat_research-analysis");
  assert.deepEqual(url.searchParams.getAll("topic"), ["topic_competitive-research", "topic_market-research"]);
  assert.deepEqual(url.searchParams.getAll("useful_for"), ["role_marketers", "role_product-managers"]);
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.pathname, "/pt/explore");
});

test("invalid taxonomy selections are reported rather than silently removed", () => {
  const query = parseCatalogQuery({ useful_for: "role_invented", category: "cat_missing" });
  assert.equal(query.category, "cat_missing");
  const errors = validateCatalogTaxonomy(query, {version: "v1", terms: []});
  assert.deepEqual(errors, ["cat_missing", "role_invented"]);
});

test("a term of the wrong kind cannot be used as a topic", () => {
  const query = parseCatalogQuery({ topic: "role_marketers" });
  const errors = validateCatalogTaxonomy(query, {version: "v1", terms: [{id: "role_marketers", kind: "useful_for", label: "Marketers", description: "Marketing work", active: true, sort_order: 0}]});
  assert.deepEqual(errors, ["role_marketers"]);
});


test("conflicting Category query values are visible as invalid instead of broadening results", () => {
  const q = parseCatalogQuery({category:["cat_one","cat_two"]});
  assert.ok(q.category);
  assert.deepEqual(validateCatalogTaxonomy(q,{version:"v1",terms:[]}), [q.category]);
});
