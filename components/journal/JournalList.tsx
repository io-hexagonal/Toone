import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { setRequestLocale } from "next-intl/server";
import { JOURNAL_PAGE_SIZE, listPosts } from "@/lib/journal/api";
import {
  JOURNAL_DESCRIPTION,
  JOURNAL_HUBS,
  collectionPageSchema,
  hubForSegment,
  listBreadcrumbSchema,
  listMetadata,
  listPath,
  pageCount,
  parsePageParam,
  type JournalHub,
} from "@/lib/journal/presentation";
import type { JournalPostEntry } from "@/lib/journal/types";
import { JournalShell, JsonLd, PostCard, RssIcon } from "./JournalParts";

/**
 * Index (`/en/journal`), its pages (`/page/{n}`), and the three type hubs
 * with theirs (contract §2, §10). Twelve posts a page, self-canonical,
 * `index, follow` (`noindex, follow` while a list has no post at all); a page
 * past the last one is a 404.
 *
 * Outages: during `next build` a failed read renders the outage state
 * (`noindex`), so an API incident cannot block a deploy. At runtime the error
 * propagates instead: an ISR revalidation that throws keeps serving the last
 * good render, which is better than caching an outage page for ten minutes.
 */

type ListState =
  | { kind: "ok"; posts: JournalPostEntry[]; total: number; pages: number }
  | { kind: "unavailable" };

const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

/** One list read per request, shared by `generateMetadata` and the page. */
const loadList = cache(async (segment: string | null, page: number): Promise<ListState> => {
  const hub = segment ? hubForSegment(segment) : null;
  try {
    const { items, total } = await listPosts({
      type: hub?.type,
      limit: JOURNAL_PAGE_SIZE,
      offset: (page - 1) * JOURNAL_PAGE_SIZE,
    });
    return { kind: "ok", posts: items, total, pages: pageCount(total, JOURNAL_PAGE_SIZE) };
  } catch (error) {
    if (!isBuild()) throw error;
    console.error("[journal] list unavailable during build", error instanceof Error ? error.message : error);
    return { kind: "unavailable" };
  }
});

/** Resolve `/page/{n}`: 1 redirects to the unpaged URL, anything malformed is a 404. */
export function resolvePageParam(hub: JournalHub | null, value: string | undefined): number {
  if (value === undefined) return 1;
  if (value === "1") permanentRedirect(listPath(hub));
  const page = parsePageParam(value);
  if (!page) notFound();
  return page;
}

export async function journalListMetadata(
  hub: JournalHub | null,
  page: number,
): Promise<Metadata> {
  const state = await loadList(hub?.segment ?? null, page).catch(() => null);
  if (!state || state.kind === "unavailable") {
    return { ...listMetadata(hub, page), robots: { index: false, follow: true } };
  }
  return listMetadata(hub, page, { empty: state.posts.length === 0 });
}

export async function JournalList({ hub, page }: { hub: JournalHub | null; page: number }) {
  const state = await loadList(hub?.segment ?? null, page);
  if (state.kind === "ok" && page > state.pages) notFound();
  const posts = state.kind === "ok" ? state.posts : [];
  const lead = !hub && page === 1;
  const heading = hub ? hub.heading : "Journal";
  const intro = hub ? hub.description : JOURNAL_DESCRIPTION;

  return (
    <JournalShell>
      <JsonLd value={collectionPageSchema(hub, page, posts)} />
      <JsonLd value={listBreadcrumbSchema(hub, page)} />
      <header className="jr-hero">
        <div className="jr-hero-inner">
          <nav className="jr-breadcrumb" aria-label="Breadcrumb">
            <a href="/en">Home</a>
            <span aria-hidden="true">→</span>
            {hub ? (
              <>
                <a href={listPath(null)}>Journal</a>
                <span aria-hidden="true">→</span>
                <span aria-current={page === 1 ? "page" : undefined}>{hub.label}</span>
              </>
            ) : (
              <span aria-current={page === 1 ? "page" : undefined}>Journal</span>
            )}
            {page > 1 && (
              <>
                <span aria-hidden="true">→</span>
                <span aria-current="page">Page {page}</span>
              </>
            )}
          </nav>
          <p className="jr-eyebrow">{hub ? "Toone Journal" : "News from Toone"}</p>
          <h1>{page > 1 ? `${heading}, page ${page}` : heading}</h1>
          <p className="jr-hero-intro">{intro}</p>
          <nav aria-label="Journal sections">
            <ul className="jr-tabs">
              <li>
                <a href={listPath(null)} aria-current={!hub ? "page" : undefined}>All posts</a>
              </li>
              {JOURNAL_HUBS.map((item) => (
                <li key={item.segment}>
                  <a href={listPath(item)} aria-current={hub?.segment === item.segment ? "page" : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="jr-rss-item" style={{ marginLeft: "auto" }}>
                <a className="jr-rss" href="/journal/feed.xml" type="application/rss+xml">
                  <RssIcon /> RSS feed
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="jr-list jr-width">
        {state.kind === "unavailable" ? (
          <div className="jr-empty" role="status">
            <strong>The Journal is temporarily unavailable.</strong>
            Posts could not be loaded right now. Please try again in a few minutes.{" "}
            <a href={listPath(hub, page)}>Retry</a>
          </div>
        ) : posts.length === 0 ? (
          <div className="jr-empty">
            <strong>No posts here yet.</strong>
            {hub
              ? `The first ${hub.label.toLowerCase()} post will appear here when it is published.`
              : "The first post will appear here when it is published."}{" "}
            Meanwhile, browse <a href="/en/explore">routines in Explore</a> or read the{" "}
            <a href="/en/how-to">how-to guides</a>.
          </div>
        ) : (
          <ul className="jr-grid">
            {posts.map((post, index) => (
              <PostCard key={post.post_id} post={post} lead={lead && index === 0} />
            ))}
          </ul>
        )}
        {state.kind === "ok" && state.pages > 1 && (
          <nav className="jr-pagination" aria-label="Pagination">
            {page > 1 ? (
              <a href={listPath(hub, page - 1)} rel="prev">← Newer posts</a>
            ) : (
              <span />
            )}
            <span>
              Page {page} of {state.pages}
            </span>
            {page < state.pages ? (
              <a href={listPath(hub, page + 1)} rel="next">Older posts →</a>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
    </JournalShell>
  );
}

type ListProps = { params: Promise<{ locale: string; n?: string }> };

/**
 * The page module for one list URL family. `segment` is a hub (`releases`,
 * `routines`, `launches`) or null for the index; `paged` is the `/page/{n}`
 * variant. Non-English locales never reach here in practice (proxy.ts 308s
 * them); the guard keeps a build-time prerender of `/de/journal` from
 * reading the API and makes the redirect hold even without the proxy.
 */
export function journalListRoute(segment: JournalHub["segment"] | null) {
  const hub = segment ? hubForSegment(segment) : null;
  async function generateMetadata({ params }: ListProps): Promise<Metadata> {
    const { locale, n } = await params;
    if (locale !== "en") return { robots: { index: false, follow: true } };
    const page = n === undefined ? 1 : parsePageParam(n);
    if (!page) return { robots: { index: false, follow: true } };
    return journalListMetadata(hub, page);
  }
  async function Page({ params }: ListProps) {
    const { locale, n } = await params;
    if (locale !== "en") {
      permanentRedirect(n === undefined ? listPath(hub) : `${listPath(hub)}/page/${encodeURIComponent(n)}`);
    }
    setRequestLocale(locale);
    const page = resolvePageParam(hub, n);
    return <JournalList hub={hub} page={page} />;
  }
  return { generateMetadata, Page };
}
