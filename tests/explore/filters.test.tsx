import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ExploreFilters from "../../components/explore/ExploreFilters";
import { parseCatalogQuery } from "../../lib/explore/presentation";
import type { ExploreTaxonomy } from "../../lib/explore/taxonomy";

const term = (id: string, kind: "category" | "topic" | "useful_for", sort_order: number) =>
  ({ id, kind, label: id, description: "", active: true, sort_order });
const taxonomy: ExploreTaxonomy = {
  version: "1",
  terms: [term("marketing", "category", 1), term("finance", "category", 2), term("drafting", "topic", 1), term("debugging", "topic", 2)],
};
const facets = [
  { term_id: "marketing", routines: 1, bundles: 1 },
  { term_id: "finance", routines: 0, bundles: 0 },
  { term_id: "drafting", routines: 1, bundles: 0 },
  { term_id: "debugging", routines: 0, bundles: 0 },
];
const copy = { category: "Category", topics: "Topics", usefulFor: "Useful for", filters: "Filters", applyFilters: "Apply", clearFilters: "Clear", closeFilters: "Close", allCategories: "All" };
const render = (raw: Record<string, string>) =>
  renderToStaticMarkup(createElement(ExploreFilters, { query: parseCatalogQuery(raw), taxonomy, facets, locale: "en", copy }));

test("unfiltered view hides terms with no approved items", () => {
  const html = render({});
  assert.ok(html.includes('value="marketing"') && html.includes('value="drafting"'));
  assert.ok(!html.includes('value="finance"') && !html.includes('value="debugging"'));
});

test("filtered views keep every term so visitors can switch", () => {
  const html = render({ category: "marketing" });
  assert.ok(html.includes('value="finance"') && html.includes('value="debugging"'));
});
