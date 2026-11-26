import type { CatalogQuery } from "./presentation";
import type { ExploreFacet, ExploreTaxonomy, TaxonomyTerm } from "./taxonomy";

/**
 * Topic pages: one clean URL per taxonomy term (category, topic, audience),
 * listing the approved records classified under it. Unlike the hub's filter
 * and search views, which stay `noindex` (TECH-007), a topic page is its own
 * canonical. It becomes indexable only when it meets playbook TOPIC-012: at
 * least 5 approved, distinct records and its own intro.
 *
 * "Distinct" counts routines only. Every public bundle packages routines that
 * are also listed, so a bundle repeats jobs already on the page (CONTENT-022).
 * On 2026-11-26 the 8-record catalog gave 4 indexable topic pages that were
 * 62-89% the same as each other and the hub; none had its own intro.
 */
export const TOPIC_PAGE_MIN_LISTINGS = 5;

/**
 * Written intros, by term id. A term with no entry keeps the label-built
 * intro and stays `noindex, follow`, whatever its record count. Add an entry
 * (reviewed copy that says what this set of routines is for) to open a page.
 */
export const TOPIC_PAGE_INTROS: Readonly<Record<string, string>> = {};

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

/** The term's written intro, or null when it has none (a blank entry counts as none). */
export function topicPageIntro(
  termId: string,
  intros: Readonly<Record<string, string>> = TOPIC_PAGE_INTROS,
): string | null {
  if (!Object.hasOwn(intros, termId)) return null;
  const intro = intros[termId];
  return typeof intro === "string" && intro.trim() ? intro.trim() : null;
}

/** TOPIC-012: a written intro and at least 5 distinct records (routines). */
export function isTopicPageIndexable(
  termId: string,
  distinctListings: number,
  intros: Readonly<Record<string, string>> = TOPIC_PAGE_INTROS,
): boolean {
  return (
    topicPageIntro(termId, intros) !== null &&
    Number.isSafeInteger(distinctListings) &&
    distinctListings >= TOPIC_PAGE_MIN_LISTINGS
  );
}

/** Distinct records a term lists (routines; see above), from the unfiltered facet counts. */
export function facetListings(facets: ExploreFacet[], termId: string): number {
  const facet = facets.find((f) => f.term_id === termId);
  return facet ? facet.routines : 0;
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
export function topicPageCopy(term: { id?: string; kind: TopicKind; label: string }): { heading: string; intro: string } {
  const forWhom = term.kind === "useful_for";
  const written = term.id ? topicPageIntro(term.id) : null;
  return {
    heading: forWhom
      ? `AI Routines & Workflow Templates for ${term.label}`
      : `${term.label} AI Routines & Workflow Templates`,
    intro:
      written ??
      `Reviewed routines and bundles for ${inSentence(term.label)}. Bring your own AI, add one to Toone, answer a few setup questions, then run it and review the output.`,
  };
}
