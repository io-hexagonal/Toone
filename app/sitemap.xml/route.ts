import { INDEXED_LOCALES } from "@/i18n/indexing";
import { getGuideSlugs, getPublication, getRootEditorialSlugs } from "@/lib/content";
import { getProductGuideSlugs, getProductGuideSourcePath } from "@/lib/product-showcase";
import { BUILD_DATE, gitLastCommitDate } from "@/lib/source-date";

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
  // `lastmod` values above are computed on the build host, where git exists.
  { path: "/explore", source: "app/[locale]/explore/page.tsx" },
] as const;

/**
 * `lastmod` for a route: the date of the last commit that touched the file
 * backing it, falling back to the build date. `changefreq`/`priority` were
 * dropped — Google has ignored both since 2023 (audit P3-2).
 *
 * The fallback used to be silent, so a renamed or mistyped source path would
 * emit a permanently-today `lastmod` that no one could see (G2 follow-up 5).
 * Every fallback is now recorded and reported as a build warning naming the
 * URLs affected.
 */
function makeLastModified() {
  const fallbacks: string[] = [];
  return {
    fallbacks,
    lastModified(loc: string, sourcePath: string | null, declaredDate?: string): string {
      const committed = gitLastCommitDate(sourcePath);
      if (committed) return committed;
      if (declaredDate) return declaredDate;
      fallbacks.push(loc);
      return BUILD_DATE;
    },
  };
}

function reportFallbacks(fallbacks: readonly string[]): void {
  if (fallbacks.length === 0) return;
  console.warn(
    `[sitemap] WARNING: lastmod fell back to the build date (${BUILD_DATE}) for ` +
      `${fallbacks.length} URL(s). Their declared source path is missing, untracked ` +
      `or absent from git history, so these dates are not real content dates:\n` +
      fallbacks.map((loc) => `  - ${loc}`).join("\n"),
  );
}

function url(loc: string, lastmod: string) {
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
}

export async function GET() {
  const { fallbacks, lastModified } = makeLastModified();
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

  for (const slug of ["", ...getProductGuideSlugs()]) {
    const path = `/how-to${slug ? `/${slug}` : ""}`;
    const loc = `${BASE_URL}/en${path}`;
    lines.push(url(loc, lastModified(loc, getProductGuideSourcePath(slug))));
  }

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

  reportFallbacks(fallbacks);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
