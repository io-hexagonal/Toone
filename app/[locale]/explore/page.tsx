import ExploreFilters from "@/components/explore/ExploreFilters";
import FeaturedCarousel, { type FeaturedSlide } from "@/components/explore/FeaturedCarousel";
import {hasTaxonomyFilters, termLabel} from "@/lib/explore/taxonomy";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getCatalog, listRoutines, PAGE_SIZE, resolveCardCoverUrl, resolveSlug } from "@/lib/explore/api";
import {
  parseCatalogQuery,
  catalogHref,
  type CatalogItem,
  cardText,
  exploreMetadata,
  featuredItems,
  SITE,
  EXPLORE_GUIDES,
} from "@/lib/explore/presentation";
import {
  ExploreShell,
  ExploreUnavailable,
  CatalogCard,
  JsonLd,
  getExploreCopy,
  priceLabel,
} from "@/components/explore/ExploreView";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const ui = await getExploreCopy(locale);
  const query = parseCatalogQuery(await searchParams);
  const meta = exploreMetadata(locale, "/explore", ui.heading, ui.intro, null);
  if (query.query || query.tag || hasTaxonomyFilters(query) || query.type !== "all" || query.page > 1)
    meta.robots.index = false;
  try {
    await getCatalog(JSON.stringify(query));
  } catch {
    meta.robots.index = false;
  }
  return meta;
}
export default async function ExplorePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ui = await getExploreCopy(locale);
  const query = parseCatalogQuery(await searchParams);
  let catalog;
  let tags;
  try {
    catalog = await getCatalog(JSON.stringify(query));
    tags = catalog.tags;
  } catch (error) {
    console.error(
      "[explore] catalog unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return <ExploreUnavailable ui={ui} locale={locale} />;
  }
  const active = { ...query, page: catalog.page };
  // Featured only on the plain first view, never on a search or filter.
  const unfiltered = !query.query && !query.tag && !hasTaxonomyFilters(query) && query.type === "all" && catalog.page === 1;
  // Routines listed only inside a bundle never reach the grid; the plain view
  // still links each one so every public record is one click from the hub.
  let bundleOnly: CatalogItem[] = [];
  if (unfiltered) {
    try {
      bundleOnly = (await listRoutines({ listing: "bundle_only" })).items.map((entry) => ({ type: "routine" as const, entry }));
    } catch {
      bundleOnly = [];
    }
  }
  const libraryTerms = (kind: "category" | "useful_for") =>
    (catalog.taxonomy?.terms ?? [])
      .filter((term) => term.kind === kind && term.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  const featured: FeaturedSlide[] = unfiltered
    ? featuredItems(catalog.items, (item) => !!resolveCardCoverUrl(item.entry)).map((item) => {
        const text = cardText(item.entry);
        const category = item.entry.classification?.category_id;
        return {
          id: item.type + ("workflow_id" in item.entry ? item.entry.workflow_id : item.entry.bundle_id),
          href: `/${locale}/explore/${item.type}s/${resolveSlug(item.entry)}`,
          eyebrow: [ui.featured, item.type === "bundle" ? ui.bundle : ui.routine, category && termLabel(catalog.taxonomy, category), priceLabel(item.entry.price, locale, ui)]
            .filter(Boolean)
            .join(" · "),
          title: text.title,
          summary: text.summary,
          cta: item.type === "bundle" ? ui.viewBundle : ui.viewRoutine,
          coverUrl: resolveCardCoverUrl(item.entry) as string,
        };
      })
    : [];
  const itemList = {
    "@type": "ItemList",
    numberOfItems: catalog.total,
    itemListElement: catalog.items.map((item, index) => ({
      "@type": "ListItem",
      position: (catalog.page - 1) * PAGE_SIZE + index + 1,
      url: `${SITE}/en/explore/${item.type}s/${resolveSlug(item.entry)}`,
      name: cardText(item.entry).title,
    })),
  };
  return (
    <ExploreShell>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: ui.heading,
          description: ui.intro,
          isPartOf: { "@id": `${SITE}/#website` },
          url: `${SITE}/en/explore`,
          mainEntity: itemList,
        }}
      />
      <header className="explore-hero explore-hero-index">
        <div className="explore-width">
          <h1>{ui.heading}</h1>
          <p className="explore-intro">{ui.intro}</p>
          <p className="explore-howto">
            <a href={EXPLORE_GUIDES.explore}>{ui.exploreGuide} →</a>
          </p>
        </div>
      </header>
      {featured.length > 0 && (
        <FeaturedCarousel
          slides={featured}
          copy={{ featuredLabel: ui.featuredLabel, previousSlide: ui.previousSlide, nextSlide: ui.nextSlide, goToSlide: ui.goToSlide, pause: ui.pauseSlides, play: ui.playSlides }}
        />
      )}
      <main className="explore-catalog explore-width">
        <div className="explore-filters">
          <nav
            className="explore-type-filter"
            aria-labelledby="explore-type-label"
          >
            <span className="explore-filter-label" id="explore-type-label">
              {ui.show}
            </span>
            <div className="explore-type-options">
              {(["all", "routines", "bundles"] as const)
                .filter((type) => type !== "bundles" || catalog.bundlesAvailable)
                .map((type) => (
                <a
                  className="explore-type-option"
                  aria-current={query.type === type ? "true" : undefined}
                  key={type}
                  href={catalogHref(locale, { ...active, type, page: 1 })}
                >
                  {ui[type]}
                </a>
              ))}
            </div>
          </nav>
          <form
            className="explore-search"
            method="get"
            action={`/${locale}/explore`}
            role="search"
          >
            <input type="hidden" name="type" value={query.type} />
            {query.tag && <input type="hidden" name="tag" value={query.tag} />}
            {query.category && <input type="hidden" name="category" value={query.category} />}
            {(query.topics ?? []).map((id) => <input key={id} type="hidden" name="topic" value={id} />)}
            {(query.usefulFor ?? []).map((id) => <input key={id} type="hidden" name="useful_for" value={id} />)}
            <label>
              <span className="explore-sr-only">{ui.search}</span>
              <input
                name="q"
                type="search"
                placeholder={ui.searchPlaceholder}
                defaultValue={query.query}
                maxLength={128}
              />
            </label>
            <button type="submit">{ui.search}</button>
          </form>
        </div>
        {catalog.taxonomy && <ExploreFilters query={active} taxonomy={catalog.taxonomy} facets={catalog.facets} locale={locale} copy={{ category: ui.category, topics: ui.topics, usefulFor: ui.usefulFor, filters: ui.filters, applyFilters: ui.applyFilters, clearFilters: ui.clearFilters, closeFilters: ui.closeFilters, allCategories: ui.allCategories }} />}
        {catalog.invalidFilters.length > 0 && <p className="explore-filter-error" role="alert">{ui.invalidFilters} <a href={catalogHref(locale, {...query, category: undefined, topics: [], usefulFor: [], page: 1})}>{ui.clearFilters}</a></p>}
        {((!catalog.taxonomy && tags.length > 0) || query.tag) && (
          <nav
            className="explore-topic-filter"
            aria-labelledby="explore-topic-label"
          >
            <span className="explore-filter-label" id="explore-topic-label">
              {ui.topics}
            </span>
            <ul className="explore-topic-options">
              {tags.map(({ tag }) => (
                <li key={tag}>
                  <a
                    className="explore-topic-option"
                    aria-current={query.tag === tag ? "true" : undefined}
                    href={catalogHref(locale, { ...active, tag, page: 1 })}
                  >
                    {tag}
                  </a>
                </li>
              ))}
              {query.tag && (
                <li>
                  <a
                    className="explore-topic-clear"
                    href={catalogHref(locale, { ...active, tag: "", page: 1 })}
                  >
                    {ui.clearTopic} <span aria-hidden="true">×</span>
                  </a>
                </li>
              )}
            </ul>
          </nav>
        )}
        <p className="explore-results">{ui.count("results", catalog.total)}</p>
        {catalog.items.length ? (
          <div className="explore-grid">
            {catalog.items.map((item) => (
              <CatalogCard
                key={
                  item.type +
                  ("workflow_id" in item.entry
                    ? item.entry.workflow_id
                    : item.entry.bundle_id)
                }
                item={item}
                taxonomy={catalog.taxonomy}
                locale={locale}
                ui={ui}
              />
            ))}
          </div>
        ) : (
          <p className="explore-empty">
            {query.query || query.tag || hasTaxonomyFilters(query) || query.type !== "all"
              ? ui.empty
              : ui.emptyCatalog}
          </p>
        )}
        {catalog.total > PAGE_SIZE && (
          <nav className="explore-pagination" aria-label={ui.page}>
            {catalog.page > 1 && (
              <a
                rel="prev"
                href={catalogHref(locale, {
                  ...active,
                  page: catalog.page - 1,
                })}
              >
                ← {ui.previous}
              </a>
            )}
            <span>
              {ui.page} {catalog.page} / {Math.ceil(catalog.total / PAGE_SIZE)}
            </span>
            {catalog.page * PAGE_SIZE < catalog.total && (
              <a
                rel="next"
                href={catalogHref(locale, {
                  ...active,
                  page: catalog.page + 1,
                })}
              >
                {ui.next} →
              </a>
            )}
          </nav>
        )}
        {bundleOnly.length > 0 && (
          <section className="explore-library-section" aria-labelledby="explore-in-bundles">
            <h2 id="explore-in-bundles">{ui.inBundlesHeading}</h2>
            <p>{ui.inBundlesBody}</p>
            <div className="explore-grid">
              {bundleOnly.map((item) => (
                <CatalogCard key={item.type + ("workflow_id" in item.entry ? item.entry.workflow_id : item.entry.bundle_id)} item={item} taxonomy={catalog.taxonomy} locale={locale} ui={ui} />
              ))}
            </div>
          </section>
        )}
        {unfiltered && (
          <section className="explore-library-section explore-about" aria-labelledby="explore-about">
            <h2 id="explore-about">{ui.aboutHeading}</h2>
            <p>{ui.aboutWhat}</p>
            <p>{ui.aboutReview}</p>
            {libraryTerms("category").length > 0 && (
              <>
                <h3>{ui.aboutCategories}</h3>
                <ul className="explore-about-terms">
                  {libraryTerms("category").map((term) => <li key={term.id}>{term.label}</li>)}
                </ul>
              </>
            )}
            {libraryTerms("useful_for").length > 0 && (
              <>
                <h3>{ui.aboutRoles}</h3>
                <ul className="explore-about-terms">
                  {libraryTerms("useful_for").map((term) => <li key={term.id}>{term.label}</li>)}
                </ul>
              </>
            )}
            <h3>{ui.aboutUseHeading}</h3>
            <ul className="explore-about-links">
              <li><a href={EXPLORE_GUIDES.explore}>{ui.exploreGuide}</a></li>
              <li><a href={EXPLORE_GUIDES.setup}>{ui.aboutImport}</a></li>
              <li><a href={EXPLORE_GUIDES.share}>{ui.aboutShare}</a></li>
              <li><a href={EXPLORE_GUIDES.routines}>{ui.learnRoutines}</a></li>
              <li><a href={EXPLORE_GUIDES.routineGuide}>{ui.aboutRoutineGuide}</a></li>
            </ul>
          </section>
        )}
      </main>
    </ExploreShell>
  );
}
