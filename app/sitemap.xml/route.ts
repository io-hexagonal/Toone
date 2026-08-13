import { locales } from "@/i18n/routing";
import { getPublications } from "@/lib/content";

export const dynamic = "force-static";

const BASE_URL = "https://trytoone.com";
const LOCALIZED_ROUTES = ["", "/showcases", "/download"] as const;
const DOWNLOAD_LAST_MODIFIED = "2026-08-13";

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

function url(
  loc: string,
  path: string,
  changefreq: string,
  priority: string,
  lastModified?: string,
) {
  const lastmod = lastModified ? `<lastmod>${lastModified}</lastmod>` : "";
  return `<url><loc>${loc}</loc>${lastmod}${alternates(path)}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export async function GET() {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];

  for (const locale of locales) {
    for (const path of LOCALIZED_ROUTES) {
      const changefreq = path === "/showcases" ? "monthly" : "weekly";
      const priority = path === "" ? "1.0" : path === "/download" ? "0.9" : "0.8";
      const lastModified = path === "/download" ? DOWNLOAD_LAST_MODIFIED : undefined;
      lines.push(url(`${BASE_URL}/${locale}${path}`, path, changefreq, priority, lastModified));
    }
  }

  // These trust surfaces are currently reviewed in English only. Their
  // non-English routes redirect until qualified translations are approved.
  for (const path of ["/privacy", "/about", "/editorial-policy", "/resources"] as const) {
    lines.push(
      `<url><loc>${BASE_URL}/en${path}</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
    );
  }
  for (const publication of getPublications()) {
    lines.push(
      `<url><loc>${BASE_URL}/en${publication.canonicalPath}</loc><lastmod>${publication.updated}</lastmod>${englishAlternates(publication.canonicalPath)}<changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    );
  }
  lines.push("</urlset>");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
