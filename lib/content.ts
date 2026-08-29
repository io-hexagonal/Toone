import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "@/i18n/routing";

export type PublicationAuthorType = "Organization" | "Person";

export type Publication = {
  locale: Locale;
  slug: string;
  canonicalPath: string;
  title: string;
  heading: string;
  description: string;
  eyebrow: string;
  author: string;
  authorType: PublicationAuthorType;
  authorUrl: string;
  published: string;
  updated: string;
  readTime: string;
  featured: boolean;
  image: string;
  imageAlt: string;
  sourceWorkId: string;
  sourceSha256: string;
  englishSourceSha256?: string;
  translationManifestSha256?: string;
  translationQaSha256?: string;
  body: string;
};

const guidesDirectory = path.join(process.cwd(), "content/guides");
const DEFAULT_IMAGE = "/assets/og/toone-og.png";
const DEFAULT_IMAGE_ALT = "Toone";
export const RESERVED_ROOT_EDITORIAL_SLUGS = [
  "about",
  "business",
  "contact",
  "download",
  "editorial-policy",
  "governance",
  "guides",
  "privacy",
  "resources",
  "showcases",
  "signin",
  "signup",
] as const;

const reservedRootEditorialSlugs = new Set<string>(RESERVED_ROOT_EDITORIAL_SLUGS);

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

function defaultImage(slug: string): { image: string; imageAlt: string } {
  if (slug === "ai-native-company") {
    return {
      image: "/assets/guides/ai-native-company-diagnostic.png",
      imageAlt: "Five checks in the Toone AI-native operating-model diagnostic",
    };
  }
  return { image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT };
}

function readPublication(filePath: string, expectedLocale: Locale): Publication {
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

  const declaredLocale = data.locale ? String(data.locale) : "en";
  if (!isLocale(declaredLocale)) throw new Error(`Unsupported locale '${declaredLocale}' in ${filePath}`);
  if (declaredLocale !== expectedLocale) {
    throw new Error(`Locale mismatch in ${filePath}: expected ${expectedLocale}, received ${declaredLocale}`);
  }

  const slug = String(data.slug);
  const fallbackImage = defaultImage(slug);
  const authorType = data.authorType ? String(data.authorType) : "Organization";
  if (authorType !== "Organization" && authorType !== "Person") {
    throw new Error(`Invalid authorType '${authorType}' in ${filePath}`);
  }

  return {
    locale: declaredLocale,
    slug,
    canonicalPath: String(data.canonicalPath),
    title: String(data.title),
    heading: String(data.heading || data.title),
    description: String(data.description),
    eyebrow: String(data.eyebrow),
    author: String(data.author),
    authorType,
    authorUrl: String(data.authorUrl || "/en/editorial-policy"),
    published: String(data.published),
    updated: String(data.updated),
    readTime: String(data.readTime),
    featured: Boolean(data.featured),
    image: String(data.image || fallbackImage.image),
    imageAlt: String(data.imageAlt || fallbackImage.imageAlt),
    sourceWorkId: String(data.sourceWorkId),
    sourceSha256: String(data.sourceSha256),
    englishSourceSha256: data.englishSourceSha256
      ? String(data.englishSourceSha256)
      : undefined,
    translationManifestSha256: data.translationManifestSha256
      ? String(data.translationManifestSha256)
      : undefined,
    translationQaSha256: data.translationQaSha256
      ? String(data.translationQaSha256)
      : undefined,
    body: content.trim(),
  };
}

function localizedFilePath(locale: Locale, slug: string): string {
  return path.join(guidesDirectory, locale, `${slug}.md`);
}

function legacyEnglishFilePath(slug: string): string {
  return path.join(guidesDirectory, `${slug}.md`);
}

function hasCompleteLocalizedSet(slug: string): boolean {
  const localizedFiles = locales.map((locale) => localizedFilePath(locale, slug));
  const hasAnyNonEnglish = localizedFiles
    .slice(1)
    .some((filePath) => fs.existsSync(filePath));
  if (!hasAnyNonEnglish) return false;
  if (localizedFiles.some((filePath) => !fs.existsSync(filePath))) return false;

  return locales.every((locale) => {
    const publication = readPublication(localizedFilePath(locale, slug), locale);
    if (locale === "en") return true;
    return Boolean(
      publication.englishSourceSha256 &&
      publication.translationManifestSha256 &&
      publication.translationQaSha256,
    );
  });
}

function safeSlug(value: string): string | null {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
}

export function getPublications(locale: Locale = "en"): Publication[] {
  if (!fs.existsSync(guidesDirectory)) return [];
  const bySlug = new Map<string, Publication>();

  if (locale === "en") {
    for (const file of fs.readdirSync(guidesDirectory)) {
      if (!file.endsWith(".md")) continue;
      const publication = readPublication(path.join(guidesDirectory, file), "en");
      bySlug.set(publication.slug, publication);
    }
  }

  const localeDirectory = path.join(guidesDirectory, locale);
  if (fs.existsSync(localeDirectory)) {
    for (const file of fs.readdirSync(localeDirectory)) {
      if (!file.endsWith(".md")) continue;
      const publication = readPublication(path.join(localeDirectory, file), locale);
      if (locale !== "en" && !hasCompleteLocalizedSet(publication.slug)) continue;
      bySlug.set(publication.slug, publication);
    }
  }

  return [...bySlug.values()].sort((a, b) => b.updated.localeCompare(a.updated));
}

export function getPublication(slug: string, locale: Locale = "en"): Publication | null {
  const normalizedSlug = safeSlug(slug);
  if (!normalizedSlug) return null;

  const localizedPath = localizedFilePath(locale, normalizedSlug);
  if (
    fs.existsSync(localizedPath) &&
    (locale === "en" || hasCompleteLocalizedSet(normalizedSlug))
  ) {
    return readPublication(localizedPath, locale);
  }

  if (locale === "en") {
    const legacyPath = legacyEnglishFilePath(normalizedSlug);
    if (fs.existsSync(legacyPath)) return readPublication(legacyPath, "en");
  }
  return null;
}

export function getPublicationLocales(slug: string): Locale[] {
  const normalizedSlug = safeSlug(slug);
  if (!normalizedSlug) return [];
  if (hasCompleteLocalizedSet(normalizedSlug)) return [...locales];
  return locales.filter((locale) => {
    if (locale !== "en") return false;
    if (fs.existsSync(localizedFilePath(locale, normalizedSlug))) return true;
    return fs.existsSync(legacyEnglishFilePath(normalizedSlug));
  });
}

export function getGuideSlugs(): string[] {
  const slugs = new Set<string>();
  for (const locale of locales) {
    for (const publication of getPublications(locale)) {
      if (publication.canonicalPath.startsWith("/guides/")) slugs.add(publication.slug);
    }
  }
  return [...slugs].sort();
}

export function getRootEditorialSlugs(): string[] {
  const slugs = new Set<string>();
  for (const locale of locales) {
    for (const publication of getPublications(locale)) {
      if (
        publication.canonicalPath === `/${publication.slug}` &&
        !reservedRootEditorialSlugs.has(publication.slug)
      ) {
        slugs.add(publication.slug);
      }
    }
  }
  return [...slugs].sort();
}

export function isRootEditorialPublication(publication: Publication): boolean {
  return (
    publication.canonicalPath === `/${publication.slug}` &&
    !reservedRootEditorialSlugs.has(publication.slug)
  );
}

export function publicationUrl(publication: Publication, locale: Locale = publication.locale): string {
  return `https://trytoone.com/${locale}${publication.canonicalPath}`;
}

export function publicationAlternates(slug: string, canonicalPath: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of getPublicationLocales(slug)) {
    languages[locale] = `https://trytoone.com/${locale}${canonicalPath}`;
  }
  if (languages.en) languages["x-default"] = languages.en;
  return languages;
}

export type TableOfContentsItem = { id: string; label: string; level: 2 | 3 };

export function headingId(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
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
