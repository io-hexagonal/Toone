import { locales } from "@/i18n/routing";

export const dynamic = "force-static";

export async function GET() {
  const baseUrl = "https://trytoone.com";
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const locale of locales) {
    const now = new Date().toISOString();

    // Landing page
    lines.push(
      `<url><loc>${baseUrl}/${locale}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`
    );

    // Showcases
    lines.push(
      `<url><loc>${baseUrl}/${locale}/showcases</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
    );

    // Privacy
    lines.push(
      `<url><loc>${baseUrl}/${locale}/privacy</loc><lastmod>${now}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>`
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
