import { getExploreFeed } from "@/lib/explore/api";
import { isExploreIndexable } from "@/lib/explore/presentation";

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
 * A feed outage yields an empty urlset (200) rather than an error: Google
 * keeps previously discovered URLs, while a 5xx would make it retry the
 * fetch and, repeated, distrust the file.
 */
export const dynamic = "force-dynamic";

const BASE_URL = "https://trytoone.com";
const SLUG_OR_ID = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

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

export async function GET() {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  let ok = true;
  try {
    const feed = await getExploreFeed();
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
  } catch (error) {
    ok = false;
    console.error(
      "[sitemap-explore] feed fetch failed; omitting Explore items",
      error instanceof Error ? error.message : error,
    );
  }
  lines.push("</urlset>");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      // A failed render must not be pinned at the CDN for an hour.
      "Cache-Control": ok
        ? "public, max-age=600, s-maxage=600, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
