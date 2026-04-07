import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";

// Generate one sitemap per locale — keeps each file small (~1K URLs)
// Next.js auto-generates the sitemap index at /sitemap.xml
export async function generateSitemaps() {
  return locales.map((_, index) => ({ id: index }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://trytoone.com";
  const locale = locales[id];
  const entries: MetadataRoute.Sitemap = [];

  // Landing page
  entries.push({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  });

  // AI Digest listing page
  entries.push({
    url: `${baseUrl}/${locale}/ai-digest`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  });

  // AI Digest post pages
  const posts = getAllPosts(locale);
  for (const post of posts) {
    entries.push({
      url: `${baseUrl}/${locale}/ai-digest/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // Polymarket
  entries.push({
    url: `${baseUrl}/${locale}/polymarket`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  });

  // Showcase
  entries.push({
    url: `${baseUrl}/${locale}/showcase`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  });

  // Privacy
  entries.push({
    url: `${baseUrl}/${locale}/privacy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  });

  return entries;
}
