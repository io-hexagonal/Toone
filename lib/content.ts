import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Publication = {
  slug: string;
  canonicalPath: string;
  title: string;
  description: string;
  eyebrow: string;
  author: string;
  published: string;
  updated: string;
  readTime: string;
  featured: boolean;
  sourceWorkId: string;
  sourceSha256: string;
  body: string;
};

const guidesDirectory = path.join(process.cwd(), "content/guides");

function readPublication(filePath: string): Publication {
  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const required = [
    "slug",
    "canonicalPath",
    "title",
    "description",
    "eyebrow",
    "author",
    "published",
    "updated",
    "readTime",
    "sourceWorkId",
    "sourceSha256",
  ];

  for (const key of required) {
    if (!data[key]) throw new Error(`Missing ${key} in ${filePath}`);
  }

  return {
    slug: String(data.slug),
    canonicalPath: String(data.canonicalPath),
    title: String(data.title),
    description: String(data.description),
    eyebrow: String(data.eyebrow),
    author: String(data.author),
    published: String(data.published),
    updated: String(data.updated),
    readTime: String(data.readTime),
    featured: Boolean(data.featured),
    sourceWorkId: String(data.sourceWorkId),
    sourceSha256: String(data.sourceSha256),
    body: content.trim(),
  };
}

export function getPublications(): Publication[] {
  if (!fs.existsSync(guidesDirectory)) return [];
  return fs
    .readdirSync(guidesDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readPublication(path.join(guidesDirectory, file)))
    .sort((a, b) => b.updated.localeCompare(a.updated));
}

export function getPublication(slug: string): Publication | null {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const filePath = path.join(guidesDirectory, `${safeSlug}.md`);
  return fs.existsSync(filePath) ? readPublication(filePath) : null;
}

export type TableOfContentsItem = { id: string; label: string; level: 2 | 3 };

export function headingId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getTableOfContents(body: string): TableOfContentsItem[] {
  return body
    .split("\n")
    .flatMap((line) => {
      const match = line.match(/^(##|###)\s+(.+)$/);
      if (!match) return [];
      return [{ id: headingId(match[2]), label: match[2], level: match[1].length as 2 | 3 }];
    });
}
