import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getCatalog, PAGE_SIZE, resolveSlug } from "@/lib/explore/api";
import {
  parseCatalogQuery,
  catalogHref,
  exploreMetadata,
  SITE,
} from "@/lib/explore/presentation";
import {
  ExploreShell,
  ExploreUnavailable,
  CatalogCard,
  JsonLd,
  getExploreCopy,
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
  const meta = exploreMetadata(locale, "/explore", ui.title, ui.intro, null);
  if (query.query || query.tag || query.type !== "all" || query.page > 1)
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
  const itemList = {
    "@type": "ItemList",
    numberOfItems: catalog.total,
    itemListElement: catalog.items.map((item, index) => ({
      "@type": "ListItem",
      position: (catalog.page - 1) * PAGE_SIZE + index + 1,
      url: `${SITE}/en/explore/${item.type}s/${resolveSlug(item.entry)}`,
      name: item.entry.title,
    })),
  };
  return (
    <ExploreShell>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: ui.title,
          description: ui.intro,
          url: `${SITE}/en/explore`,
          mainEntity: itemList,
        }}
      />
      <header className="explore-hero">
        <div className="explore-width">
          <p className="explore-eyebrow">Toone / {ui.title}</p>
          <h1>{ui.title}</h1>
          <p className="explore-intro">{ui.intro}</p>
        </div>
      </header>
      <main className="explore-catalog explore-width">
        <div className="explore-filters">
          <nav className="explore-filter-list" aria-label={ui.title}>
            {(["all", "routines", "bundles"] as const).map((type) => (
              <a
                className="explore-filter"
                aria-current={query.type === type ? "true" : undefined}
                key={type}
                href={catalogHref(locale, { ...active, type, page: 1 })}
              >
                {ui[type]}
              </a>
            ))}
          </nav>
          <form
            className="explore-search"
            method="get"
            action={`/${locale}/explore`}
            role="search"
          >
            <input type="hidden" name="type" value={query.type} />
            {query.tag && <input type="hidden" name="tag" value={query.tag} />}
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
        <nav className="explore-filter-list" aria-label={ui.tags}>
          <a
            className="explore-filter"
            aria-current={!query.tag ? "true" : undefined}
            href={catalogHref(locale, { ...active, tag: "", page: 1 })}
          >
            {ui.allTags}
          </a>
          {tags.map(({ tag }) => (
            <a
              key={tag}
              className="explore-filter"
              aria-current={query.tag === tag ? "true" : undefined}
              href={catalogHref(locale, { ...active, tag, page: 1 })}
            >
              #{tag}
            </a>
          ))}
        </nav>
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
                locale={locale}
                ui={ui}
              />
            ))}
          </div>
        ) : (
          <p className="explore-empty">
            {query.query || query.tag || query.type !== "all"
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
      </main>
    </ExploreShell>
  );
}
