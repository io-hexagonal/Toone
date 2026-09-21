import type { CatalogQuery } from "./presentation";

export type ExploreClassification = {
  schema_version: number;
  taxonomy_version: string;
  input_hash: string;
  category_id: string;
  topic_ids: string[];
  useful_for_ids: string[];
  explanation: string;
};
export type TaxonomyTerm = {
  id: string;
  kind: "category" | "topic" | "useful_for";
  label: string;
  description: string;
  active: boolean;
  sort_order: number;
};
export type ExploreTaxonomy = { version: string; terms: TaxonomyTerm[] };
export type ExploreFacet = { term_id: string; routines: number; bundles: number };

export function validateCatalogTaxonomy(query: CatalogQuery, taxonomy: ExploreTaxonomy): string[] {
  const terms = new Map(taxonomy.terms.map((term) => [term.id, term]));
  const dimensions = [
    ["category", query.category ? [query.category] : []],
    ["topic", query.topics ?? []],
    ["useful_for", query.usefulFor ?? []],
  ] as const;
  return dimensions.flatMap(([kind, ids]) => ids.filter((id) => {
    const term = terms.get(id);
    return !term?.active || term.kind !== kind;
  }));
}

export function hasTaxonomyFilters(query: CatalogQuery): boolean {
  return !!(query.category || query.topics?.length || query.usefulFor?.length);
}

export function termLabel(taxonomy: ExploreTaxonomy | null, id: string): string {
  return taxonomy?.terms.find((term) => term.id === id)?.label ?? id.replace(/^(cat|topic|role)_/, "").replaceAll("-", " ");
}

/** Allow-list the public shape; never forward extra worker/reviewer metadata. */
export function normalizeClassification(value: unknown): ExploreClassification | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Record<string, unknown>;
  if (c.schema_version !== 1 || typeof c.taxonomy_version !== "string" || typeof c.input_hash !== "string" || typeof c.category_id !== "string" || typeof c.explanation !== "string" || !Array.isArray(c.topic_ids) || !Array.isArray(c.useful_for_ids) || !c.topic_ids.every((id) => typeof id === "string") || !c.useful_for_ids.every((id) => typeof id === "string")) return null;
  return {schema_version: 1, taxonomy_version: c.taxonomy_version, input_hash: c.input_hash, category_id: c.category_id, topic_ids: c.topic_ids, useful_for_ids: c.useful_for_ids, explanation: c.explanation};
}
