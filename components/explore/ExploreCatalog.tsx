import ExploreFeaturedOn from "./ExploreFeaturedOn";
import ExploreFilters from "./ExploreFilters";
import FeaturedCarousel, { type FeaturedSlide } from "./FeaturedCarousel";
import { hasTaxonomyFilters, termLabel, type TaxonomyTerm } from "@/lib/explore/taxonomy";
import { facetListings, isTopicPageIndexable, topicPagePath } from "@/lib/explore/topicPages";
import { getCatalog, PAGE_SIZE, resolveCardCoverUrl, resolveSlug } from "@/lib/explore/api";
import { exploreOutage } from "@/lib/explore/outage";
import HowToLink from "@/components/HowToLink";
import {
  catalogHref,
  type CatalogQuery,
  type CatalogItem,
  cardText,
  exploreMetadata,
  featuredCover,
  featuredItems,
  SITE,
  EXPLORE_GUIDES,
  recordHref,
} from "@/lib/explore/presentation";
import {
  ExploreShell,
  ExploreUnavailable,
  CatalogCard,
  JsonLd,
  getExploreCopy,
  priceLabel,
} from "./ExploreView";

/** The parameter-free first view of the hub, the only indexable one. */
function isPlainView(query: CatalogQuery) {
  return !(query.query || query.tag || hasTaxonomyFilters(query) || query.type !== "all" || query.page > 1);
}

/**
 * Hub metadata: only the plain first view of `/en/explore` is indexable. The
 * other locales' hubs are `noindex` with a self canonical, and no sitemap
 * lists them (TECH-021).
 */
export async function exploreCatalogMetadata(locale: string, query: CatalogQuery) {
  const ui = await getExploreCopy(locale);
  const meta = exploreMetadata(locale, "/explore", ui.heading, ui.intro, null);
  if (!isPlainView(query)) meta.robots.index = false;
  if (!meta.robots.index) return meta;
  try {
    await getCatalog(JSON.stringify(query));
  } catch (error) {
    // The plain hub is indexable: an outage is a server error, not noindex (A8).
    exploreOutage("catalog metadata", error);
  }
  return meta;
}
/**
 * The Explore hub body, shared by the cached parameter-free hub
 * (`/[locale]/explore`) and the request-time filter/search view
 * (`/[locale]/explore/search`, reached through the proxy rewrite).
 */
export default async function ExploreCatalog({ locale, query, topic }: {
  locale: string;
  query: CatalogQuery;
  /** A topic page: its own heading, intro and URL over the same catalog body. */
  topic?: { heading: string; intro: string; path: string };
}) {
  const ui = await getExploreCopy(locale);
  const heading = topic?.heading ?? ui.heading;
  const intro = topic?.intro ?? ui.intro;
  let catalog;
  let tags;
  try {
    catalog = await getCatalog(JSON.stringify(query));
    tags = catalog.tags;
  } catch (error) {
    // The hub and topic pages are indexable URLs: an outage there is a server
    // error that crawlers retry (A8). Filter and search views are `noindex`
    // already, so people get the retry page there.
    if (topic || isPlainView(query)) exploreOutage("catalog", error);
    console.error(
      "[explore] catalog unavailable",
      error instanceof Error ? error.name : "unknown",
    );
    return <ExploreUnavailable ui={ui} locale={locale} />;
  }
  const active = { ...query, page: catalog.page };
  // Featured only on the plain first view, never on a search or filter.
  const unfiltered = !query.query && !query.tag && !hasTaxonomyFilters(query) && query.type === "all" && catalog.page === 1;
  const libraryTerms = (kind: "category" | "topic" | "useful_for") =>
    (catalog.taxonomy?.terms ?? [])
      .filter((term) => term.kind === kind && term.active)
      .sort((a, b) => a.sort_order - b.sort_order);
  // The hub's crawlable way into its taxonomy: each term links to its own
  // topic page while that page is indexable (the same test as the page's
  // metadata and /sitemap-explore.xml), never to a `noindex` filter view (A7).
  const termLink = (term: TaxonomyTerm) => {
    const path = topicPagePath(term);
    return path && isTopicPageIndexable(term.id, facetListings(catalog.facets, term.id)) ? (
      <a href={`/${locale}${path}`}>{term.label}</a>
    ) : (
      <>{term.label}</>
    );
  };
  const featured: FeaturedSlide[] = unfiltered
    ? featuredItems(catalog.items, (item) => !!featuredCover(item, resolveCardCoverUrl)).map((item) => {
        const text = cardText(item.entry);
        const category = item.entry.classification?.category_id;
        return {
          id: item.type + ("workflow_id" in item.entry ? item.entry.workflow_id : item.entry.bundle_id),
          href: recordHref(item.type, resolveSlug(item.entry)),
          eyebrow: [ui.featured, item.type === "bundle" ? ui.bundle : ui.routine, category && termLabel(catalog.taxonomy, category), priceLabel(item.entry.price, locale, ui)]
            .filter(Boolean)
            .join(" · "),
          title: text.title,
          summary: text.summary,
          cta: item.type === "bundle" ? ui.viewBundle : ui.viewRoutine,
          coverUrl: featuredCover(item, resolveCardCoverUrl) as string,
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
          name: heading,
          description: intro,
          isPartOf: { "@id": `${SITE}/#website` },
          url: `${SITE}/en${topic?.path ?? "/explore"}`,
          mainEntity: itemList,
        }}
      />
      <header className="explore-hero explore-hero-index">
        <div className="explore-width">
          <h1>{heading}</h1>
          <p className="explore-intro">{intro}</p>
          <p className="explore-howto">
            <HowToLink href={EXPLORE_GUIDES.explore} fallback="none">{ui.exploreGuide} →</HowToLink>
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
            {/* A form, not links: each type is a `noindex` filter view of
                the hub, so crawlers get no link to it (A7). It still works
                without JavaScript. */}
            <form className="explore-type-options" method="get" action={`/${locale}/explore`}>
              {query.query && <input type="hidden" name="q" value={query.query} />}
              {query.tag && <input type="hidden" name="tag" value={query.tag} />}
              {query.category && <input type="hidden" name="category" value={query.category} />}
              {(query.topics ?? []).map((id) => <input key={id} type="hidden" name="topic" value={id} />)}
              {(query.usefulFor ?? []).map((id) => <input key={id} type="hidden" name="useful_for" value={id} />)}
              {(["all", "routines", "bundles"] as const)
                .filter((type) => type !== "bundles" || catalog.bundlesAvailable)
                .map((type) => (
                <button
                  type="submit"
                  /* "All" sends no `type`, so with nothing else set it lands
                     on the clean hub, not a `?type=all` noindex copy. */
                  name={type === "all" ? undefined : "type"}
                  value={type === "all" ? undefined : type}
                  className="explore-type-option"
                  aria-current={query.type === type ? "true" : undefined}
                  key={type}
                >
                  {ui[type]}
                </button>
              ))}
            </form>
          </nav>
          <form
            className="explore-search"
            method="get"
            action={`/${locale}/explore`}
            role="search"
          >
            {query.type !== "all" && <input type="hidden" name="type" value={query.type} />}
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
            {/* A form, not links: a `?tag=` view is a `noindex` filter of
                the hub (A7). Only shown on servers without the taxonomy. */}
            <form className="explore-topic-options" method="get" action={`/${locale}/explore`}>
              {query.type !== "all" && <input type="hidden" name="type" value={query.type} />}
              {query.query && <input type="hidden" name="q" value={query.query} />}
              {tags.map(({ tag }) => (
                <button
                  type="submit"
                  name="tag"
                  value={tag}
                  key={tag}
                  className="explore-topic-option"
                  aria-current={query.tag === tag ? "true" : undefined}
                >
                  {tag}
                </button>
              ))}
              {query.tag && (
                <a
                  className="explore-topic-clear"
                  href={catalogHref(locale, { ...active, tag: "", page: 1 })}
                >
                  {ui.clearTopic} <span aria-hidden="true">×</span>
                </a>
              )}
            </form>
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
        {unfiltered && (
          <section className="explore-library-section explore-about" aria-labelledby="explore-about">
            <h2 id="explore-about">{ui.aboutHeading}</h2>
            <p>{ui.aboutWhat}</p>
            <p>{ui.aboutReview}</p>
            {libraryTerms("category").length > 0 && (
              <>
                <h3>{ui.aboutCategories}</h3>
                <ul className="explore-about-terms">
                  {libraryTerms("category").map((term) => <li key={term.id}>{termLink(term)}</li>)}
                </ul>
              </>
            )}
            {libraryTerms("topic").length > 0 && (
              <>
                <h3>{ui.topics}</h3>
                <ul className="explore-about-terms">
                  {libraryTerms("topic").map((term) => <li key={term.id}>{termLink(term)}</li>)}
                </ul>
              </>
            )}
            {libraryTerms("useful_for").length > 0 && (
              <>
                <h3>{ui.aboutRoles}</h3>
                <ul className="explore-about-terms">
                  {libraryTerms("useful_for").map((term) => <li key={term.id}>{termLink(term)}</li>)}
                </ul>
              </>
            )}
            <h3>{ui.aboutUseHeading}</h3>
            <ul className="explore-about-links">
              <li><HowToLink href={EXPLORE_GUIDES.explore} fallback="text">{ui.exploreGuide}</HowToLink></li>
              <li><HowToLink href={EXPLORE_GUIDES.setup} fallback="text">{ui.aboutImport}</HowToLink></li>
              <li><HowToLink href={EXPLORE_GUIDES.share} fallback="text">{ui.aboutShare}</HowToLink></li>
              <li><HowToLink href={EXPLORE_GUIDES.routines} fallback="text">{ui.learnRoutines}</HowToLink></li>
              <li><a href={EXPLORE_GUIDES.routineGuide}>{ui.aboutRoutineGuide}</a></li>
            </ul>
          </section>
        )}
        {unfiltered && <ExploreFeaturedOn />}
      </main>
    </ExploreShell>
  );
}
