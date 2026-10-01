import { getJournalFeed } from "@/lib/journal/api";
import { buildJournalSitemap } from "@/lib/journal/presentation";

/**
 * Sitemap of the Journal (contract §10), modelled on `/sitemap-explore.xml`:
 * dynamic, built from `GET /v1/journal/feed` (data cache 600 s, tag
 * `journal`, expired by the webhook), published posts only with
 * `lastmod = updated_at`, plus the index and every hub that has a post, each
 * dated by its own newest post. Only `/en` URLs exist, so each entry carries the en and
 * x-default alternates of itself.
 *
 * A feed outage, or a server that does not serve the feed yet, yields an
 * empty urlset (200) rather than an error: Google keeps previously
 * discovered URLs, while a 5xx would make it retry and, repeated, distrust
 * the file. The failed render is `no-store` so the CDN does not pin it.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let ok = true;
  let feed = null;
  try {
    feed = await getJournalFeed();
    if (!feed) console.warn("[sitemap-journal] feed route not available; listing no items");
  } catch (error) {
    ok = false;
    console.error(
      "[sitemap-journal] feed fetch failed; omitting Journal items",
      error instanceof Error ? error.message : error,
    );
  }
  return new Response(buildJournalSitemap(feed), {
    headers: {
      "Content-Type": "application/xml",
      // As for /sitemap-explore.xml: the CDN holds the rendered XML for
      // 600 s via `s-maxage`, so a newly published post is listed within ten
      // minutes (the webhook refreshes the data underneath at once; the CDN
      // copy ages out). A failed render must not be pinned at the CDN.
      "Cache-Control": ok
        ? "public, max-age=600, s-maxage=600, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
