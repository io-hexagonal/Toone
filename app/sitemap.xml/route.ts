import { INDEXED_LOCALES } from "@/i18n/indexing";
import { getGuideSlugs, getPublication, getRootEditorialSlugs } from "@/lib/content";
import { gitLastCommitDate } from "@/lib/source-date";

export const dynamic = "force-static";

const BASE_URL = "https://trytoone.com";

/**
 * Only indexable 200 canonicals belong here (TECH-013, audit P2-8/P3-2), and
 * only English is indexed (TECH-021): the other seven locales still serve,
 * `noindex, follow`, so none of their URLs is listed and no entry carries
 * hreflang (`xhtml:link`) alternates. `/early-access` stays out: it is the
 * invitation-code gate and ships `noindex`. The public request form it links
 * to lives at `/request-access` and is listed below.
 */
const LOCALIZED_ROUTES = [
  { path: "", source: "app/[locale]/page.tsx" },
  { path: "/resources", source: "app/[locale]/resources/page.tsx" },
  { path: "/business", source: "app/[locale]/business/page.tsx" },
] as const;

const ENGLISH_ONLY_ROUTES = [
  { path: "/privacy", source: "app/[locale]/privacy/page.tsx" },
  { path: "/terms", source: "app/[locale]/terms/page.tsx" },
  { path: "/about", source: "app/[locale]/about/page.tsx" },
  { path: "/contact", source: "app/[locale]/contact/page.tsx" },
  { path: "/editorial-policy", source: "app/[locale]/editorial-policy/page.tsx" },
  // `/request-access` is the public request page of the invitation-only funnel
  // (request -> personal code -> account). `/early-access` is the code gate
  // itself and stays `noindex`, so it is still absent from this list. Only
  // `/en/request-access` qualifies: the seven other locales render form-only
  // copy and stay `noindex`, so they get no sitemap entry (TECH-013).
  { path: "/request-access", source: "app/[locale]/request-access/page.tsx" },
  // `/explore` is the public routine and bundle directory. Its seven non-English
  // locales render translated chrome around English catalog content and are
  // `noindex` (self-canonical), so only `/en/explore` is listed. The
  // per-item URLs come from the API and live in `/sitemap-explore.xml`, which
  // revalidates at runtime; this file stays `force-static` so the git-derived
  // `lastmod` values above are computed on the build host (omitted if it has no git).
  { path: "/explore", source: "app/[locale]/explore/page.tsx" },
] as const;

/**
 * `lastmod` for a route: the date of the last commit that touched the file
 * backing it, then the page's declared editorial date if it has one. When
 * neither is known the entry is listed with no `<lastmod>` at all (TECH-013).
 * `changefreq`/`priority` were dropped — Google has ignored both since 2023
 * (audit P3-2).
 *
 * The last resort used to be the build date. Vercel builds (Git and CLI
 * alike) can lack usable git history, so on 2026-11-02 39 of 46 URLs claimed
 * a change on deploy day with no content change. Google stops trusting
 * `lastmod` that is wrong, and an absent `lastmod` is valid sitemap XML, so an
 * unknown date is now omitted rather than invented. Each omission is still
 * reported as a build warning naming the URLs affected, so a renamed or
 * mistyped source path stays visible (G2 follow-up 5).
 */
function makeLastModified() {
  const omitted: string[] = [];
  return {
    omitted,
    lastModified(loc: string, sourcePath: string | null, declaredDate?: string): string | null {
      const committed = gitLastCommitDate(sourcePath);
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
    `[sitemap] WARNING: lastmod omitted for ${omitted.length} URL(s). Their git ` +
      `date is unknown (source path missing or untracked, or no git history on ` +
      `the build host), so no date is published for them:\n` +
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

  // Preserve English-only editorial surfaces whose canonical route is not in
  // the locale guide family (currently /governance). Its `lastmod` comes from
  // the same git date the page reports as `Article.dateModified`, so the two
  // can no longer disagree (G2 follow-up 4).
  const governance = getPublication("ai-agent-governance", "en");
  if (governance) {
    const loc = `${BASE_URL}/en${governance.canonicalPath}`;
    lines.push(url(loc, lastModified(loc, governance.sourcePath, governance.updated)));
  }
  lines.push("</urlset>");

  reportOmitted(omitted);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
