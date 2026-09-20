import { locales } from "@/i18n/routing";
import {
  getGuideSlugs,
  getPublication,
  getPublicationLocales,
  getRootEditorialSlugs,
} from "@/lib/content";
import { getProductGuideSlugs, getProductGuideSourcePath } from "@/lib/product-showcase";
import { BUILD_DATE, gitLastCommitDate } from "@/lib/source-date";

export const dynamic = "force-static";

const BASE_URL = "https://trytoone.com";

/**
 * Only indexable 200 canonicals belong here (TECH-013, audit P2-8/P3-2).
 * `/early-access` was removed 2026-09-20: it is an access-code gate that now
 * ships `noindex` and emitted zero hreflang while this file claimed nine
 * alternates for it.
 */
const LOCALIZED_ROUTES = [
  { path: "", source: "app/[locale]/page.tsx" },
  { path: "/business/showcases", source: "app/[locale]/business/showcases/page.tsx" },
  { path: "/resources", source: "app/[locale]/resources/page.tsx" },
] as const;

/**
 * `/business` still serves in all eight locales, but only `/en/business` is a
 * distinct canonical. The seven non-English variants duplicate their locale
 * home verbatim and now canonicalise to it (G2 follow-up 1), so they are
 * non-canonical URLs and must not appear here (TECH-013) or in anyone's
 * hreflang set (TECH-010).
 */
const CANONICAL_ENGLISH_LOCALIZED_ROUTES = [
  { path: "/business", source: "app/[locale]/business/page.tsx" },
] as const;

const ENGLISH_ONLY_ROUTES = [
  { path: "/privacy", source: "app/[locale]/privacy/page.tsx" },
  { path: "/about", source: "app/[locale]/about/page.tsx" },
  { path: "/contact", source: "app/[locale]/contact/page.tsx" },
  { path: "/editorial-policy", source: "app/[locale]/editorial-policy/page.tsx" },
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

function alternates(path: string): string {
  const links = locales.map(
    (locale) =>
      `<xhtml:link rel="alternate" hreflang="${locale}" href="${BASE_URL}/${locale}${path}"/>`,
  );
  links.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en${path}"/>`,
  );
  return links.join("");
}

function englishAlternates(path: string): string {
  const href = `${BASE_URL}/en${path}`;
  return [
    `<xhtml:link rel="alternate" hreflang="en" href="${href}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${href}"/>`,
  ].join("");
}

function publicationAlternateLinks(path: string, availableLocales: readonly string[]): string {
  const links = availableLocales.map(
    (locale) =>
      `<xhtml:link rel="alternate" hreflang="${locale}" href="${BASE_URL}/${locale}${path}"/>`,
  );
  if (availableLocales.includes("en")) {
    links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en${path}"/>`);
  }
  return links.join("");
}

function url(loc: string, lastmod: string, alternateLinks: string) {
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod>${alternateLinks}</url>`;
}

export async function GET() {
  const { fallbacks, lastModified } = makeLastModified();
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const locale of locales) {
    for (const route of LOCALIZED_ROUTES) {
      const loc = `${BASE_URL}/${locale}${route.path}`;
      lines.push(url(loc, lastModified(loc, route.source), alternates(route.path)));
    }
  }

  for (const route of CANONICAL_ENGLISH_LOCALIZED_ROUTES) {
    const loc = `${BASE_URL}/en${route.path}`;
    lines.push(url(loc, lastModified(loc, route.source), englishAlternates(route.path)));
  }

  for (const slug of ["", ...getProductGuideSlugs()]) {
    const path = `/how-to${slug ? `/${slug}` : ""}`;
    const loc = `${BASE_URL}/en${path}`;
    lines.push(
      url(loc, lastModified(loc, getProductGuideSourcePath(slug)), englishAlternates(path)),
    );
  }

  // These trust surfaces are currently reviewed in English only. Their
  // non-English routes redirect until qualified translations are approved.
  for (const route of ENGLISH_ONLY_ROUTES) {
    const loc = `${BASE_URL}/en${route.path}`;
    lines.push(url(loc, lastModified(loc, route.source), englishAlternates(route.path)));
  }

  for (const slug of [...getGuideSlugs(), ...getRootEditorialSlugs()]) {
    const availableLocales = getPublicationLocales(slug);
    for (const locale of availableLocales) {
      const publication = getPublication(slug, locale);
      if (!publication) continue;
      // Articles keep their editorial `updated:` date: it is the reviewed,
      // translated-set-wide publication date, not a file mtime.
      lines.push(
        url(
          `${BASE_URL}/${locale}${publication.canonicalPath}`,
          publication.updated,
          publicationAlternateLinks(publication.canonicalPath, availableLocales),
        ),
      );
    }
  }

  // Preserve English-only editorial surfaces whose canonical route is not in
  // the locale guide family (currently /governance). Its `lastmod` comes from
  // the same git date the page reports as `Article.dateModified`, so the two
  // can no longer disagree (G2 follow-up 4).
  const governance = getPublication("ai-agent-governance", "en");
  if (governance) {
    const loc = `${BASE_URL}/en${governance.canonicalPath}`;
    lines.push(
      url(
        loc,
        lastModified(loc, governance.sourcePath, governance.updated),
        englishAlternates(governance.canonicalPath),
      ),
    );
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
