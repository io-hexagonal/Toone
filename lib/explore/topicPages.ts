import type { CatalogQuery } from "./presentation";
import type { ExploreFacet, ExploreTaxonomy, TaxonomyTerm } from "./taxonomy";

/**
 * Topic pages: one clean URL per taxonomy term (category, topic, audience),
 * listing the approved records classified under it. Unlike the hub's filter
 * and search views, which stay `noindex` (TECH-007), a topic page is its own
 * canonical and becomes indexable once it lists enough records to be useful.
 */
export const TOPIC_PAGE_MIN_LISTINGS = 3;

export type TopicKind = TaxonomyTerm["kind"];
const SEGMENT: Record<TopicKind, string> = { category: "category", topic: "topic", useful_for: "for" };
const ID_PREFIX: Record<TopicKind, string> = { category: "cat_", topic: "topic_", useful_for: "role_" };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The URL slug of a term: its id without the kind prefix. */
export function termSlug(term: { id: string; kind: TopicKind }): string | null {
  const prefix = ID_PREFIX[term.kind];
  if (!term.id.startsWith(prefix)) return null;
  const slug = term.id.slice(prefix.length);
  return SLUG.test(slug) && slug.length <= 64 ? slug : null;
}

/** `/explore/category/marketing-sales`, without the locale. */
export function topicPagePath(term: { id: string; kind: TopicKind }): string | null {
  const slug = termSlug(term);
  return slug ? `/explore/${SEGMENT[term.kind]}/${slug}` : null;
}

/** The active term a URL names, or null: unknown, inactive or malformed. */
export function findTopicTerm(taxonomy: ExploreTaxonomy | null, kind: TopicKind, slug: string): TaxonomyTerm | null {
  if (!taxonomy || !SLUG.test(slug) || slug.length > 64) return null;
  const id = ID_PREFIX[kind] + slug;
  return taxonomy.terms.find((term) => term.id === id && term.kind === kind && term.active) ?? null;
}

export function topicQuery(term: { id: string; kind: TopicKind }): CatalogQuery {
  const base: CatalogQuery = { type: "all", query: "", tag: "", page: 1 };
  if (term.kind === "category") return { ...base, category: term.id };
  if (term.kind === "topic") return { ...base, topics: [term.id] };
  return { ...base, usefulFor: [term.id] };
}

export function isTopicPageIndexable(listings: number): boolean {
  return Number.isSafeInteger(listings) && listings >= TOPIC_PAGE_MIN_LISTINGS;
}

/** Records a term lists, from the unfiltered facet counts. */
export function facetListings(facets: ExploreFacet[], termId: string): number {
  const facet = facets.find((f) => f.term_id === termId);
  return facet ? facet.routines + facet.bundles : 0;
}

/** "Marketing & sales" reads as "marketing & sales" mid-sentence; "SEO content" stays. */
function inSentence(label: string): string {
  return /^[A-Z][a-z]/.test(label) ? label[0].toLowerCase() + label.slice(1) : label;
}

/**
 * Heading and intro of a topic page. The taxonomy's own descriptions are
 * classifier guidance ("Prefer Data & reporting when..."), so they are never
 * shown; the copy is built from the label.
 */
export function topicPageCopy(term: { kind: TopicKind; label: string }): { heading: string; intro: string } {
  const forWhom = term.kind === "useful_for";
  return {
    heading: forWhom
      ? `AI Routines & Workflow Templates for ${term.label}`
      : `${term.label} AI Routines & Workflow Templates`,
    intro: `Reviewed routines and bundles for ${inSentence(term.label)}. Bring your own AI, add one to Toone, answer a few setup questions, then run it and review the output.`,
  };
}
