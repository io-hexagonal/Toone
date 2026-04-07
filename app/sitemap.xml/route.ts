import { locales } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

    // AI Digest listing
    lines.push(
      `<url><loc>${baseUrl}/${locale}/ai-digest</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
    );

    // AI Digest posts
    const posts = getAllPosts(locale);
    for (const post of posts) {
      const slug = escapeXml(post.slug);
      const date = new Date(post.date).toISOString();
      lines.push(
        `<url><loc>${baseUrl}/${locale}/ai-digest/${slug}</loc><lastmod>${date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
      );
    }

    // Polymarket
    lines.push(
      `<url><loc>${baseUrl}/${locale}/polymarket</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );

    // Showcase
    lines.push(
      `<url><loc>${baseUrl}/${locale}/showcase</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
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
