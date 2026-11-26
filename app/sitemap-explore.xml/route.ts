import { getExploreFacets, getExploreFeed, getExploreTaxonomy } from "@/lib/explore/api";
import { isExploreIndexable } from "@/lib/explore/presentation";
import { facetListings, isTopicPageIndexable, topicPagePath } from "@/lib/explore/topicPages";

/**
 * Sitemap of the public Explore items (contract §5.8, §11).
 *
 * Kept apart from `/sitemap.xml` on purpose: that file is `force-static` and
 * derives `lastmod` from git on the build host, which does not exist at
 * runtime on Vercel. This route is dynamic; the feed fetch itself is cached
 * by Next's data cache (600 s, tag `explore`) and expired by the webhook,
 * and the CDN holds the rendered XML for the same 600 s via `s-maxage`, so a
 * newly approved record is listed within ten minutes.
 *
 * Only `/en/...` is listed: the other locales are `noindex, follow` with a
 * self-canonical (TECH-021), so they get no entry, and no entry carries
 * hreflang alternates.
 * CONTENT-022 (v1.7.0): every approved record is listed unless a reviewer set
 * `noindex`; the feed's `indexable` flag carries that server-side rule.
 * Topic pages (one per taxonomy term) are listed only while they are
 * indexable (TOPIC-012: a written intro and 5 distinct records); they carry
 * no lastmod.
 *
 * Failures (TECH-023: "the Explore sitemap must fail visibly rather than
 * return an empty list when the data source is down"):
 *
 * - Feed outage (the data layer throws: upstream 5xx, timeout, malformed
 *   feed, a 429 with no last good answer). The data layer serves Next's data
 *   cache, then the last good feed answer while it is younger than
 *   `LAST_GOOD_MAX_AGE_MS` (24 h, lib/explore/data.ts), so a sitemap served
 *   before the outage keeps answering 200 from that copy. Only a throw here
 *   means no usable copy (never served on this instance, or older than
 *   24 h). The route then answers 503 with `Retry-After` and no urlset at
 *   all: an empty or partial urlset served as 200 reads as "these are all
 *   the Explore URLs" and hides the outage from Search Console, while a 503
 *   shows up there as a failed fetch, makes Google retry later and leaves
 *   the URLs it already knows untouched.
 * - Feed route not served yet (404 -> `null`). That is the deployed server's
 *   real state, not an outage, so it stays a cacheable 200 empty urlset.
 * - Taxonomy or facets fail while the feed works. The records are listed
 *   anyway (200) and only the topic pages are left out: the records are the
 *   URLs that matter, failing the whole file over the secondary part would
 *   hide every record for the length of a taxonomy outage, and a URL missing
 *   from one sitemap fetch is not a removal signal. That degraded answer is
 *   `no-store` so the CDN does not keep the topic-less file once the
 *   taxonomy is back.
 */
export const dynamic = "force-dynamic";

const BASE_URL = "https://trytoone.com";
const SLUG_OR_ID = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/**
 * Seconds a crawler should wait after a 503. Ten minutes is the sitemap's own
 * freshness window (the data cache and `s-maxage` above), short enough that
 * Google comes back soon after a brief upstream blip, long enough not to
 * hammer an API that is down (the contract's shared 60 req/min/IP bucket).
 * Google treats it as a hint and keeps its known URLs meanwhile.
 */
const OUTAGE_RETRY_AFTER_SECONDS = 600;

const CACHED = "public, max-age=600, s-maxage=600, stale-while-revalidate=86400";
// A failed or degraded render must never be held by the CDN or a browser.
const UNCACHED = "no-store";

/** The "feed not served yet" warning is logged at most once per window. */
const WARN_WINDOW_MS = 10 * 60_000;
let lastNotServedWarning = 0;
function warnNotServedOnce() {
  const now = Date.now();
  if (now - lastNotServedWarning < WARN_WINDOW_MS) return;
  lastNotServedWarning = now;
  console.warn("[sitemap-explore] feed route not available; listing no items");
}

function url(loc: string, lastmod: string) {
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : error;
}

export async function GET() {
  let feed: Awaited<ReturnType<typeof getExploreFeed>>;
  try {
    feed = await getExploreFeed();
  } catch (error) {
    console.error("[sitemap-explore] feed fetch failed; answering 503", errorMessage(error));
    return new Response("Explore sitemap temporarily unavailable\n", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": String(OUTAGE_RETRY_AFTER_SECONDS),
        "Cache-Control": UNCACHED,
      },
    });
  }

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  if (!feed) {
    // The deployed server predates the feed route (404): nothing to list yet.
    warnNotServedOnce();
  } else {
    for (const item of feed.items) {
      if (!isExploreIndexable(item) || (item.type !== "routine" && item.type !== "bundle"))
        continue;
      const slug = item.slug || item.id;
      if (!SLUG_OR_ID.test(slug) || slug.length > 128) continue;
      const lastmod = Date.parse(item.updated_at || item.approved_at);
      if (!Number.isFinite(lastmod)) continue;
      const path = `/explore/${item.type}s/${slug}`;
      lines.push(url(`${BASE_URL}/en${path}`, new Date(lastmod).toISOString()));
    }
  }

  // Topic pages fail on their own: their outage must not drop the records.
  let complete = true;
  try {
    const taxonomy = await getExploreTaxonomy();
    if (taxonomy) {
      const facets = await getExploreFacets({ type: "all", query: "", tag: "", page: 1 });
      for (const term of taxonomy.terms) {
        const path = term.active ? topicPagePath(term) : null;
        if (path && isTopicPageIndexable(term.id, facetListings(facets, term.id)))
          lines.push(`<url><loc>${BASE_URL}/en${path}</loc></url>`);
      }
    }
  } catch (error) {
    complete = false;
    console.error(
      "[sitemap-explore] taxonomy fetch failed; listing records without topic pages",
      errorMessage(error),
    );
  }
  lines.push("</urlset>");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": complete ? CACHED : UNCACHED,
    },
  });
}
