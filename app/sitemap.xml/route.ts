import { INDEXED_LOCALES } from "@/i18n/indexing";
import { getGuideSlugs, getPublication, getRootEditorialSlugs } from "@/lib/content";
import { contentDate } from "@/lib/source-date";
import { ROUTE_SOURCES, type SourcedRoute } from "@/lib/route-sources";
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
type StaticRoute = { path: string; sources: SourcedRoute };

const LOCALIZED_ROUTES: readonly StaticRoute[] = [
  { path: "", sources: "" },
  { path: "/resources", sources: "/resources" },
  // Toone Pro plans; prices come from the API at request time.
  { path: "/pricing", sources: "/pricing" },
];

/** Listed only once the trader details are complete; until then the page is a 404. */
const LEGAL_NOTICE_ROUTE: StaticRoute = { path: "/legal-notice", sources: "/legal-notice" };

const ENGLISH_ONLY_ROUTES: readonly StaticRoute[] = [
  { path: "/privacy", sources: "/privacy" },
  { path: "/terms", sources: "/terms" },
  ...(TRADER_DETAILS_COMPLETE ? [LEGAL_NOTICE_ROUTE] : []),
  { path: "/about", sources: "/about" },
  // Toone vs n8n, Make and Zapier, and AI agents on a schedule.
  { path: "/compare", sources: "/compare" },
  // Help for the Toone connector in Claude; the Connectors Directory links it.
  { path: "/claude", sources: "/claude" },
  { path: "/editorial-policy", sources: "/editorial-policy" },
  // `/explore` is the public routine and bundle directory. Its seven non-English
  // locales render translated chrome around English catalog content and are
  // `noindex` (self-canonical), so only `/en/explore` is listed. Its lastmod is
  // dated by the page file alone: the catalog it shows is live API data, and
  // each record's own date is its lastmod in `/sitemap-explore.xml`, which
  // revalidates at runtime. This file stays `force-static`.
  { path: "/explore", sources: "/explore" },
  // Public routine ideas for people new to Toone. English only; the idea
  // pages are written in lib/creator-ideas.ts, one of their sources.
  { path: "/newcomers/ideas", sources: "/newcomers/ideas" },
  ...CREATOR_IDEAS.map((idea) => ({ path: `/newcomers/ideas/${idea.slug}`, sources: "/newcomers/ideas/[slug]" as const })),
];

/**
 * `lastmod` for a route: the latest date among the files that render it, its
 * page.tsx and the components and data files that make up its main content
 * (lib/route-sources.ts), each dated by lib/content-dates.json (written from
 * full git history, checked by `npm test` and CI). A page with
 * a declared editorial date and no dated source falls back to that date. When
 * nothing is known the entry is listed with no `<lastmod>` at all (TECH-013).
 * `changefreq`/`priority` were dropped: Google has ignored both since 2023
 * (audit P3-2).
 *
 * Known limit: copy kept only in messages/<locale>.json does not move any
 * `lastmod`. Those files are shared by every page, so dating pages by them
 * would date the whole site to any one copy edit. A copy change that matters
 * for search should ship with an edit to the page's own sources, or wait for
 * the next one.
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
    lastModified(loc: string, sourcePaths: readonly (string | null)[], declaredDate?: string): string | null {
      const dates = sourcePaths.map((source) => contentDate(source));
      // YYYY-MM-DD sorts as text. A source missing from the manifest is
      // reported, not skipped silently: the date could be too old without it.
      const latest = dates.reduce<string | null>((max, date) => (date && (!max || date > max) ? date : max), null);
      if (latest && !dates.includes(null)) return latest;
      if (!latest && declaredDate) return declaredDate;
      omitted.push(loc);
      return latest;
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
      lines.push(url(loc, lastModified(loc, ROUTE_SOURCES[route.sources])));
    }
  }

  // /how-to is for signed-in accounts only (lib/site-session.ts): not listed.

  // These trust surfaces are currently reviewed in English only. Their
  // non-English routes redirect until qualified translations are approved.
  for (const route of ENGLISH_ONLY_ROUTES) {
    const loc = `${BASE_URL}/en${route.path}`;
    lines.push(url(loc, lastModified(loc, ROUTE_SOURCES[route.sources])));
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
