import { getExploreFeed } from "@/lib/explore/api";

/**
 * Sitemap of the public Explore items (contract §5.8, §11).
 *
 * Kept apart from `/sitemap.xml` on purpose: that file is `force-static` and
 * derives `lastmod` from git on the build host, which does not exist at
 * runtime on Vercel. This route is dynamic; the feed fetch itself is cached
 * by Next's data cache (600 s, tag `explore`) and expired by the webhook,
 * and the CDN holds the rendered XML for an hour via `s-maxage`.
 *
 * Only `/en/...` is listed: the other locales are `noindex` with an English
 * canonical (contract §11), so they get neither an entry nor an alternate.
 * Items the feed marks `indexable: false` (contract §13) are left out; their
 * pages render with `noindex, follow`.
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

function englishAlternates(path: string): string {
  const href = `${BASE_URL}/en${path}`;
  return [
    `<xhtml:link rel="alternate" hreflang="en" href="${href}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${href}"/>`,
  ].join("");
}

function url(loc: string, lastmod: string, alternateLinks: string) {
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod>${alternateLinks}</url>`;
}

export async function GET() {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  let ok = true;
  try {
    const feed = await getExploreFeed();
    if (!feed) {
      // The deployed server predates the feed route (404): nothing to list yet.
      warnNotServedOnce();
    } else {
      for (const item of feed.items) {
        if (item.type !== "routine" && item.type !== "bundle") continue;
        // Contract §13: records the server marks noindex stay out of the sitemap.
        if (item.indexable === false) continue;
        const slug = item.slug || item.id;
        if (!SLUG_OR_ID.test(slug) || slug.length > 128) continue;
        const lastmod = Date.parse(item.updated_at || item.approved_at);
        if (!Number.isFinite(lastmod)) continue;
        const path = `/explore/${item.type}s/${slug}`;
        lines.push(
          url(
            `${BASE_URL}/en${path}`,
            new Date(lastmod).toISOString(),
            englishAlternates(path),
          ),
        );
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
        ? "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400"
        : "no-store",
    },
  });
}
