import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://trytoone.com";
  const entries: MetadataRoute.Sitemap = [];

  // Landing pages
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    });
  }

  // AI Digest listing pages
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}/ai-digest`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // AI Digest post pages
  for (const locale of locales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      entries.push({
        url: `${baseUrl}/${locale}/ai-digest/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Polymarket pages
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}/polymarket`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Showcase / Media & Marketing pages
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}/showcase`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Privacy pages
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  return entries;
}
