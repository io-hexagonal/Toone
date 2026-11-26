// Enforce the server boundary; credentials and the API origin never enter a client module graph.
import "server-only";
export * from "./data";

import { cache } from "react";
import { getExploreFacets, getExploreTaxonomy, loadCatalogWithTaxonomy, getExploreTags } from "./data";
import { facetListings, isTopicPageIndexable, topicPageIntro, topicPagePath } from "./topicPages";
import type { CatalogQuery } from "./presentation";
// Metadata and the page share one catalog read per request, including failures.
export const getCatalog = cache(async (serializedQuery: string) => {
  const [catalog, tags] = await Promise.all([
    loadCatalogWithTaxonomy(JSON.parse(serializedQuery) as CatalogQuery),
    getExploreTags(),
  ]);
  return { ...catalog, tags };
});

/**
 * Whether a category's topic page is indexable, by the same rule as its
 * metadata, the hub's term links and /sitemap-explore.xml (TOPIC-012): an
 * active term with a topic URL, a written intro and 5 routines in the
 * unfiltered facet counts. Record pages ask it before their breadcrumb links
 * the category (A7). A term with no intro (every term while
 * TOPIC_PAGE_INTROS is empty) answers false with no API call; otherwise the
 * taxonomy and facet reads are the cached ones the hub uses. Any failure
 * answers false: the breadcrumb then skips the level, it never links a page
 * that may be `noindex`.
 */
/**
 * Distinct records (routines) a taxonomy term lists, from the unfiltered
 * facet counts: the one count used by topic page metadata, the hub's term
 * links, record breadcrumbs and /sitemap-explore.xml, so they cannot disagree
 * (TOPIC-012). Throws on an outage; callers decide.
 */
export const topicListings = cache(async (termId: string): Promise<number> =>
  facetListings(await getExploreFacets({ type: "all", query: "", tag: "", page: 1 }), termId),
);

export const isCategoryTopicIndexable = cache(async (categoryId: string): Promise<boolean> => {
  if (!topicPagePath({ id: categoryId, kind: "category" }) || topicPageIntro(categoryId) === null) return false;
  try {
    const taxonomy = await getExploreTaxonomy();
    const active = taxonomy?.terms.some((term) => term.id === categoryId && term.kind === "category" && term.active);
    if (!active) return false;
    return isTopicPageIndexable(categoryId, await topicListings(categoryId));
  } catch {
    return false;
  }
});
