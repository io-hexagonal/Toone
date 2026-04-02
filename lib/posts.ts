import fs from "fs";
import path from "path";
import type { Post } from "./types";

const contentDir = path.join(process.cwd(), "content", "posts");

export function getAllPosts(locale: string): Post[] {
  const filePath = path.join(contentDir, `${locale}.json`);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const posts: Post[] = JSON.parse(raw);
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(locale: string, slug: string): Post | undefined {
  const posts = getAllPosts(locale);
  return posts.find((p) => p.slug === slug);
}

export function getPaginatedPosts(
  locale: string,
  page: number,
  perPage: number,
  category?: string
): { posts: Post[]; totalPages: number } {
  let all = getAllPosts(locale);
  if (category) {
    all = all.filter((p) => p.category === category);
  }
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));
  const start = (page - 1) * perPage;
  const posts = all.slice(start, start + perPage);
  return { posts, totalPages };
}

export const CATEGORIES = [
  "ai-models",
  "development",
  "business",
  "data-finance",
  "guides",
  "tools",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function getCategoryCounts(locale: string): Record<string, number> {
  const all = getAllPosts(locale);
  const counts: Record<string, number> = {};
  for (const post of all) {
    counts[post.category] = (counts[post.category] || 0) + 1;
  }
  return counts;
}
