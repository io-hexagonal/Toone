import { INDEXED_LOCALES } from "@/i18n/indexing";
import { getGuideSlugs, getPublication, getRootEditorialSlugs } from "@/lib/content";
import { contentDate } from "@/lib/source-date";
import { TRADER_DETAILS_COMPLETE } from "@/lib/legal/trader";
import { CREATOR_IDEAS } from "@/lib/creator-ideas";

export const dynamic = "force-static";

const BASE_URL = "https://trytoone.com";

/**
 * Only indexable 200 canonicals belong here (TECH-013, audit P2-8/P3-2), and
 * only English is indexed (TECH-021): the other seven locales still serve,
 * `noindex, follow`, so none of their URLs is listed and no entry carries
 * hreflang (`xhtml:link`) alternates. `/early-access` stays out: it is the
 * invitation-code gate and ships `noindex`.
 *
 * Left out on 2026-11-26 because they are `noindex` (indexing plan A3, A4):
 * `/business` (a near-copy of the home page), `/contact` and
 * `/request-access` (utility pages), `/governance` (thin until filled in).
 */
const LOCALIZED_ROUTES = [
  { path: "", source: "app/[locale]/page.tsx" },
  { path: "/resources", source: "app/[locale]/resources/page.tsx" },
  // Toone Pro plans; prices come from the API at request time.
  { path: "/pricing", source: "app/[locale]/pricing/page.tsx" },
] as const;

/** Listed only once the trader details are complete; until then the page is a 404. */
const LEGAL_NOTICE_ROUTE = { path: "/legal-notice", source: "app/[locale]/legal-notice/page.tsx" } as const;

const ENGLISH_ONLY_ROUTES = [
  { path: "/privacy", source: "app/[locale]/privacy/page.tsx" },
  { path: "/terms", source: "app/[locale]/terms/page.tsx" },
  ...(TRADER_DETAILS_COMPLETE ? [LEGAL_NOTICE_ROUTE] : []),
  { path: "/about", source: "app/[locale]/about/page.tsx" },
  // Toone vs n8n, Make and Zapier, and AI agents on a schedule.
  { path: "/compare", source: "app/[locale]/compare/page.tsx" },
  // Help for the Toone connector in Claude; the Connectors Directory links it.
  { path: "/claude", source: "app/[locale]/claude/page.tsx" },
  { path: "/editorial-policy", source: "app/[locale]/editorial-policy/page.tsx" },
  // `/explore` is the public routine and bundle directory. Its seven non-English
  // locales render translated chrome around English catalog content and are
  // `noindex` (self-canonical), so only `/en/explore` is listed. The
  // per-item URLs come from the API and live in `/sitemap-explore.xml`, which
  // revalidates at runtime; this file stays `force-static`, its `lastmod`
  // values come from lib/content-dates.json.
  { path: "/explore", source: "app/[locale]/explore/page.tsx" },
  // Public routine ideas for people new to Toone. English only; the idea
  // pages come from lib/creator-ideas.ts, so that file dates them.
  { path: "/newcomers/ideas", source: "app/[locale]/newcomers/ideas/page.tsx" },
  ...CREATOR_IDEAS.map((idea) => ({ path: `/newcomers/ideas/${idea.slug}`, source: "lib/creator-ideas.ts" })),
] as const;

/**
 * `lastmod` for a route: the date of the last commit that touched the file
 * backing it (lib/content-dates.json, written from full git history and
 * checked by `npm test`), then the page's declared editorial date if it has
 * one. When neither is known the entry is listed with no `<lastmod>` at all
 * (TECH-013). `changefreq`/`priority` were dropped: Google has ignored both
 * since 2023 (audit P3-2).
 *
 * Git is never asked at build time. Vercel builds from a shallow clone, where
 * every file untouched in the last ~10 commits looks changed by the oldest
 * of them, so the deploy-day dates the 2026-11-02 fix meant to remove came
 * back through git itself (technical audit M3, 2026-11-26). An unknown date
 * is omitted rather than invented, and reported as a build warning naming the
 * URLs affected, so a renamed or mistyped source path stays visible.
 */
function makeLastModified() {
  const omitted: string[] = [];
  return {
    omitted,
    lastModified(loc: string, sourcePath: string | null, declaredDate?: string): string | null {
      const committed = contentDate(sourcePath);
      if (committed) return committed;
      if (declaredDate) return declaredDate;
      omitted.push(loc);
      return null;
    },
  };
}

function reportOmitted(omitted: readonly string[]): void {
  if (omitted.length === 0) return;
  console.warn(
    `[sitemap] WARNING: lastmod omitted for ${omitted.length} URL(s). Their ` +
      `source file has no date in lib/content-dates.json (missing, renamed or ` +
      "not listed yet: run `npm run content:dates`), so no date is published:\n" +
      omitted.map((loc) => `  - ${loc}`).join("\n"),
  );
}

function url(loc: string, lastmod: string | null) {
  return lastmod
    ? `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
    : `<url><loc>${loc}</loc></url>`;
}

export async function GET() {
  const { omitted, lastModified } = makeLastModified();
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const locale of INDEXED_LOCALES) {
    for (const route of LOCALIZED_ROUTES) {
      const loc = `${BASE_URL}/${locale}${route.path}`;
      lines.push(url(loc, lastModified(loc, route.source)));
    }
  }

  // /how-to is for signed-in accounts only (lib/site-session.ts): not listed.

  // These trust surfaces are currently reviewed in English only. Their
  // non-English routes redirect until qualified translations are approved.
  for (const route of ENGLISH_ONLY_ROUTES) {
    const loc = `${BASE_URL}/en${route.path}`;
    lines.push(url(loc, lastModified(loc, route.source)));
  }

  for (const slug of [...getGuideSlugs(), ...getRootEditorialSlugs()]) {
    for (const locale of INDEXED_LOCALES) {
      const publication = getPublication(slug, locale);
      if (!publication) continue;
      // Articles keep their editorial `updated:` date: it is the reviewed,
      // translated-set-wide publication date, not a file mtime.
      lines.push(url(`${BASE_URL}/${locale}${publication.canonicalPath}`, publication.updated));
    }
  }

  // `/governance` (an English-only editorial page outside the guide family)
  // is `noindex` until it is filled in, so it is not listed (indexing plan A4).
  lines.push("</urlset>");

  reportOmitted(omitted);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
