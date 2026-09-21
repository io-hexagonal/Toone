"use client";

import { useRef } from "react";
import { catalogHref, type CatalogQuery } from "@/lib/explore/presentation";
import { termLabel, type ExploreTaxonomy, type ExploreFacet } from "@/lib/explore/taxonomy";

export type FilterCopy = {
  category: string; topics: string; usefulFor: string; filters: string;
  applyFilters: string; clearFilters: string; closeFilters: string; allCategories: string;
};

export default function ExploreFilters({ query, taxonomy, facets, locale, copy }: {
  query: CatalogQuery; taxonomy: ExploreTaxonomy; facets: ExploreFacet[]; locale: string; copy: FilterCopy;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = [query.category, ...(query.topics ?? []), ...(query.usefulFor ?? [])].filter((id): id is string => !!id);
  const counts = new Map(facets.map((facet) => [facet.term_id, facet.routines + facet.bundles]));
  const clear = catalogHref(locale, { ...query, category: undefined, topics: [], usefulFor: [], tag: "", page: 1 });
  const terms = (kind: "category" | "topic" | "useful_for") => taxonomy.terms.filter((term) => term.kind === kind && term.active)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const fields = (scope: string) => <>
    <input type="hidden" name="q" value={query.query} />
    <input type="hidden" name="type" value={query.type} />
    {query.tag && <input type="hidden" name="tag" value={query.tag} />}
    <label className="explore-category-select">
      <span>{copy.category}</span>
      <select name="category" defaultValue={query.category ?? ""}>
        <option value="">{copy.allCategories}</option>
        {query.category && !taxonomy.terms.some((term) => term.active && term.kind === "category" && term.id === query.category) && <option value={query.category}>{termLabel(taxonomy, query.category)}</option>}
        {terms("category").map((term) => <option key={term.id} value={term.id}>{term.label}{counts.has(term.id) ? ` (${counts.get(term.id)})` : ""}</option>)}
      </select>
    </label>
    {(["topic", "useful_for"] as const).map((kind) => {
      const values = kind === "topic" ? query.topics ?? [] : query.usefulFor ?? [];
      const label = kind === "topic" ? copy.topics : copy.usefulFor;
      return <details name={`explore-facets-${scope}`} className="explore-multiselect" key={kind}>
        <summary>{label}{values.length ? ` (${values.length})` : ""}</summary>
        <fieldset>
          <legend className="explore-sr-only">{label}</legend>
          {terms(kind).map((term) => <label key={term.id} title={term.description}>
            <input type="checkbox" name={kind} value={term.id} defaultChecked={values.includes(term.id)} id={`${scope}-${term.id}`} />
            <span>{term.label}</span>
            {counts.has(term.id) && <small>{counts.get(term.id)}</small>}
          </label>)}
          {values.filter((id) => !terms(kind).some((term) => term.id === id)).map((id) => <label key={id}>
            <input type="checkbox" name={kind} value={id} defaultChecked />
            <span>{termLabel(taxonomy, id)}</span>
          </label>)}
        </fieldset>
      </details>;
    })}
    <button className="explore-apply-filters" type="submit">{copy.applyFilters}</button>
  </>;
  return <section className="explore-taxonomy-filters" aria-label={copy.filters}>
    <form className="explore-taxonomy-desktop" method="get" action={`/${locale}/explore`}>{fields("desktop")}</form>
    <button className="explore-mobile-filters" type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      {copy.filters}{selected.length ? ` (${selected.length})` : ""}
    </button>
    <dialog ref={dialog} className="explore-filter-dialog" aria-labelledby="explore-filter-dialog-title">
      <div className="explore-filter-dialog-header"><h2 id="explore-filter-dialog-title">{copy.filters}</h2><button type="button" onClick={() => dialog.current?.close()}>{copy.closeFilters}</button></div>
      <form method="get" action={`/${locale}/explore`}>{fields("mobile")}</form>
      <a href={clear}>{copy.clearFilters}</a>
    </dialog>
    {(selected.length > 0 || query.tag) && <div className="explore-active-filters">
      {selected.map((id) => <a key={id} href={catalogHref(locale, {
        ...query, page: 1, category: query.category === id ? undefined : query.category,
        topics: query.topics?.filter((value) => value !== id), usefulFor: query.usefulFor?.filter((value) => value !== id),
      })}>{termLabel(taxonomy, id)} <span aria-hidden="true">×</span><span className="explore-sr-only"> — {copy.closeFilters}</span></a>)}
      <a className="explore-clear-filters" href={clear}>{copy.clearFilters}</a>
    </div>}
  </section>;
}
