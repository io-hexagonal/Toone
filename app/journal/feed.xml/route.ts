import { JOURNAL_FEED_SIZE, listPosts } from "@/lib/journal/api";
import { buildRss } from "@/lib/journal/presentation";

/**
 * RSS 2.0 for the Journal (contract §2, §10): the newest 30 published posts.
 *
 * Lives outside `[locale]` at `/journal/feed.xml`. The dot keeps it out of
 * the proxy matcher, so next-intl never redirects it to a locale prefix.
 * Like `/sitemap-explore.xml`, the route is dynamic: the list read is held by
 * the data cache (600 s, tag `journal`, expired by the webhook) and the CDN
 * holds the XML for the same window.
 *
 * A server without the Journal (404) yields a valid empty channel; an outage
 * is a 503 with `Retry-After`, so readers retry instead of dropping items.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { items } = await listPosts({ limit: JOURNAL_FEED_SIZE });
    return new Response(buildRss(items), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        // As for /sitemap-explore.xml: the CDN holds the rendered XML for
        // 600 s via `s-maxage`, so a newly published post is in the feed
        // within ten minutes. The webhook refreshes the data underneath at
        // once; the CDN copy is left to age out. Readers poll on that order
        // anyway (`<ttl>60</ttl>`), and the cap keeps polling off the origin.
        "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[journal-feed] list failed", error instanceof Error ? error.message : error);
    return new Response("Journal feed temporarily unavailable\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600" },
    });
  }
}
