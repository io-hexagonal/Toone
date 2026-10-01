/**
 * URLs, metadata, structured data, RSS and sitemap markup for the Journal
 * (contract §2, §10). Pure functions over normalized posts so the pages,
 * route handlers and tests share one definition of every public surface.
 *
 * The Journal is English only: every canonical, hreflang and feed URL is the
 * `/en` one, and the other locales 308 to it (proxy.ts and each page).
 */
import type { Metadata } from "next";
import { resolveAssetUrl } from "./data";
import type {
  JournalAssistance,
  JournalFeedItem,
  JournalPostDetail,
  JournalPostEntry,
  JournalPostType,
  JournalRelease,
} from "./types";

export const SITE = "https://trytoone.com";
export const JOURNAL_PATH = "/en/journal";
export const JOURNAL_URL = `${SITE}${JOURNAL_PATH}`;
export const JOURNAL_FEED_URL = `${SITE}/journal/feed.xml`;
export const JOURNAL_NAME = "Toone Journal";
export const JOURNAL_DESCRIPTION =
  "Release notes, routine spotlights and launch announcements from the team building Toone, the macOS workspace where AI agents run your routines.";
export const EDITORIAL_POLICY_PATH = "/en/editorial-policy";
const DEFAULT_OG_IMAGE = `${SITE}/assets/og/toone-og.png`;

/* ---------- hubs ---------- */

export type JournalHub = {
  /** URL segment under /en/journal. */
  segment: "releases" | "routines" | "launches";
  type: JournalPostType;
  /** Nav and breadcrumb label. */
  label: string;
  /** Card eyebrow for a post of this type. */
  eyebrow: string;
  title: string;
  heading: string;
  description: string;
};

export const JOURNAL_HUBS: readonly JournalHub[] = [
  {
    segment: "releases",
    type: "release",
    label: "Releases",
    eyebrow: "Release",
    title: "Toone Releases and Changelog",
    heading: "Releases",
    description:
      "Every Toone release for macOS: what changed, what was fixed, and which channels (direct download or Mac App Store) carry each version.",
  },
  {
    segment: "routines",
    type: "spotlight",
    label: "Routines",
    eyebrow: "Routine spotlight",
    title: "Routine Spotlights from Explore",
    heading: "Routine spotlights",
    description:
      "Close looks at routines and bundles from Explore: what each one does, who it is for, and how to run it in Toone with your own agents.",
  },
  {
    segment: "launches",
    type: "launch",
    label: "Launches",
    eyebrow: "Launch",
    title: "Toone Launches and Announcements",
    heading: "Launches",
    description:
      "Announcements from Toone: new capabilities, programs and milestones for the macOS workspace where AI agents run your routines.",
  },
];

export function hubForType(type: JournalPostType): JournalHub {
  return JOURNAL_HUBS.find((hub) => hub.type === type)!;
}

export function hubForSegment(segment: string): JournalHub | null {
  return JOURNAL_HUBS.find((hub) => hub.segment === segment) ?? null;
}

/** `/en/journal`, `/en/journal/page/2`, `/en/journal/releases/page/3` … */
export function listPath(hub: JournalHub | null, page = 1): string {
  const base = hub ? `${JOURNAL_PATH}/${hub.segment}` : JOURNAL_PATH;
  return page > 1 ? `${base}/page/${page}` : base;
}

export function postPath(slug: string): string {
  return `${JOURNAL_PATH}/${slug}`;
}

export function postUrl(slug: string): string {
  return `${SITE}${postPath(slug)}`;
}

/** Generated 1200×630 card for posts without a cover (app/journal/og). */
export function generatedOgImageUrl(slug: string): string {
  return `${SITE}/journal/og/${slug}.png`;
}

/** Absolute site URL for a site-relative path; absolute URLs pass through. */
export function absoluteSiteUrl(value: string): string {
  return new URL(value, SITE).toString();
}

/* ---------- pagination ---------- */

/**
 * Parse a `/page/{n}` segment. Only canonical spellings of n ≥ 2 are pages;
 * `1`, `01`, `+2` and anything non-numeric are not (the page 404s or, for 1,
 * redirects to the unpaged URL).
 */
export function parsePageParam(value: string): number | null {
  if (!/^[1-9]\d{0,4}$/.test(value)) return null;
  return Number(value);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/* ---------- labels ---------- */

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatPostDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? dateFormatter.format(new Date(time)) : "";
}

/** True when two instants fall on different UTC calendar days. */
export function differentDay(a: string, b: string): boolean {
  return a.slice(0, 10) !== b.slice(0, 10) && Number.isFinite(Date.parse(b));
}

export function readTimeLabel(minutes: number): string {
  return `${minutes} min read`;
}

export const CHANNEL_LABELS: Record<JournalRelease["channels"][number], string> = {
  direct: "Direct download",
  appstore: "Mac App Store",
};

/**
 * The visible disclosure for `assistance` (§10). Agents may publish without
 * a human review step, so the copy states how the post was made and points at
 * the policy; it never claims a review that may not have happened.
 */
export function disclosureText(assistance: JournalAssistance): string | null {
  switch (assistance) {
    case "assisted":
      return "Written with AI assistance.";
    case "drafted":
      return "Drafted by AI agents.";
    default:
      return null;
  }
}

/** Card eyebrow: the type, plus the version for releases. */
export function postEyebrow(post: Pick<JournalPostEntry, "type" | "release">): string {
  const hub = hubForType(post.type);
  return post.type === "release" && post.release
    ? `${hub.eyebrow} ${post.release.version}`
    : hub.eyebrow;
}

/* ---------- images ---------- */

export type PostImage = { url: string; width: number; height: number; alt: string; generated: boolean };

/** The post's share image: its cover, else the generated card. */
export function postImage(post: Pick<JournalPostEntry, "slug" | "cover" | "heading">): PostImage {
  const cover = post.cover ? resolveAssetUrl(post.cover.url) : null;
  if (cover && post.cover) {
    return {
      url: cover,
      width: post.cover.width,
      height: post.cover.height,
      alt: post.cover.alt || post.heading,
      generated: false,
    };
  }
  return { url: generatedOgImageUrl(post.slug), width: 1200, height: 630, alt: post.heading, generated: true };
}

/* ---------- metadata ---------- */

const RSS_ALTERNATE = {
  "application/rss+xml": [{ url: JOURNAL_FEED_URL, title: JOURNAL_NAME }],
};

/** English canonical with en + x-default alternates and the RSS link. */
function englishAlternates(canonical: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical,
    languages: { en: canonical, "x-default": canonical },
    types: RSS_ALTERNATE,
  };
}

/**
 * Index, page n and the three hubs: self-canonical, `index, follow` (§10).
 * A list with no posts at all (a hub before its first post of that type, or
 * the index before the first publish) is `noindex, follow` instead: an empty
 * page is thin content, and the sitemap leaves it out for the same reason.
 * The webhook re-renders it by path when its first post is published.
 */
export function listMetadata(
  hub: JournalHub | null,
  page: number,
  { empty = false }: { empty?: boolean } = {},
): Metadata {
  const path = listPath(hub, page);
  const canonical = `${SITE}${path}`;
  const baseTitle = hub ? hub.title : "Toone Journal: Releases, Routines and Launches";
  const title = page > 1 ? `${baseTitle} (Page ${page})` : baseTitle;
  const description = hub ? hub.description : JOURNAL_DESCRIPTION;
  return {
    title: { absolute: `${title} | Toone` },
    description,
    alternates: englishAlternates(canonical),
    robots: { index: !empty, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Toone",
      locale: "en_US",
      images: [{ url: DEFAULT_OG_IMAGE, width: 2400, height: 1260, alt: "Toone Journal" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, alt: "Toone Journal" }],
    },
  };
}

export function postMetadata(post: JournalPostDetail): Metadata {
  const canonical = postUrl(post.slug);
  const image = postImage(post);
  const images = [{ url: image.url, width: image.width, height: image.height, alt: image.alt }];
  return {
    title: post.title,
    description: post.description,
    alternates: englishAlternates(canonical),
    robots: { index: true, follow: true },
    authors: [{ name: post.author.name, url: post.author.url ? absoluteSiteUrl(post.author.url) : undefined }],
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.description,
      siteName: "Toone",
      locale: "en_US",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author.name],
      section: hubForType(post.type).label,
      tags: [post.keywords.primary, ...post.keywords.secondary].filter(Boolean),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images,
    },
  };
}

/** Previews are never indexed, followed, or canonicalized to the live URL. */
export function previewMetadata(post: JournalPostDetail): Metadata {
  return {
    title: { absolute: `Preview: ${post.title}` },
    description: post.description,
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: null, languages: {} },
    openGraph: null,
    twitter: null,
  };
}

/* ---------- structured data ---------- */

export function exploreRecordUrl(ref: { type: "routine" | "bundle"; slug: string }): string {
  return `${SITE}/en/explore/${ref.type}s/${ref.slug}`;
}

export function blogPostingSchema(post: JournalPostDetail) {
  const canonical = postUrl(post.slug);
  const image = postImage(post);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonical}#article`,
    headline: post.heading,
    name: post.title,
    description: post.description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": post.author.type,
      name: post.author.name,
      ...(post.author.url ? { url: absoluteSiteUrl(post.author.url) } : {}),
    },
    publisher: { "@id": `${SITE}/#organization` },
    image: {
      "@type": "ImageObject",
      url: image.url,
      width: String(image.width),
      height: String(image.height),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}/#website` },
    keywords: [post.keywords.primary, ...post.keywords.secondary].filter(Boolean).join(", "),
    articleSection: hubForType(post.type).label,
    about: { "@id": `${SITE}/#software` },
    ...(post.explore_refs.length
      ? {
          mentions: post.explore_refs.map((ref) => ({
            "@type": "WebPage",
            "@id": exploreRecordUrl(ref),
            url: exploreRecordUrl(ref),
          })),
        }
      : {}),
  };
}

type Crumb = { name: string; item: string };

function breadcrumbList(levels: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: levels.map((level, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: level.name,
      item: level.item,
    })),
  };
}

/** Home › Journal › hub › post (§10). */
export function postBreadcrumbSchema(post: Pick<JournalPostEntry, "type" | "slug" | "title">) {
  const hub = hubForType(post.type);
  return breadcrumbList([
    { name: "Toone", item: `${SITE}/en` },
    { name: "Journal", item: JOURNAL_URL },
    { name: hub.label, item: `${SITE}${listPath(hub)}` },
    { name: post.title, item: postUrl(post.slug) },
  ]);
}

export function listBreadcrumbSchema(hub: JournalHub | null, page: number) {
  const levels: Crumb[] = [
    { name: "Toone", item: `${SITE}/en` },
    { name: "Journal", item: JOURNAL_URL },
  ];
  if (hub) levels.push({ name: hub.label, item: `${SITE}${listPath(hub)}` });
  if (page > 1) levels.push({ name: `Page ${page}`, item: `${SITE}${listPath(hub, page)}` });
  return breadcrumbList(levels);
}

/** `CollectionPage` for the index and hubs, listing the posts on the page. */
export function collectionPageSchema(
  hub: JournalHub | null,
  page: number,
  posts: JournalPostEntry[],
) {
  const url = `${SITE}${listPath(hub, page)}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: hub ? hub.title : JOURNAL_NAME,
    description: hub ? hub.description : JOURNAL_DESCRIPTION,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE}/#website` },
    publisher: { "@id": `${SITE}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: postUrl(post.slug),
        name: post.title,
      })),
    },
  };
}

/* ---------- RSS 2.0 ---------- */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // XML 1.0 forbids most C0 controls even when escaped.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

/** RFC 822 date as RSS 2.0 requires (`toUTCString` is RFC 7231/822 compatible). */
function rssDate(iso: string): string {
  return new Date(Date.parse(iso)).toUTCString();
}

/** RSS 2.0 for the newest posts, newest first (§10). */
export function buildRss(posts: JournalPostEntry[], now = new Date()): string {
  // Compare instants, not strings: `…T10:00:00+02:00` is older than
  // `…T09:00:00Z` although it sorts after it.
  const newest = posts.reduce<string | null>(
    (latest, post) =>
      !latest || Date.parse(post.updated_at) > Date.parse(latest) ? post.updated_at : latest,
    null,
  );
  const items = posts.map((post) => {
    const url = postUrl(post.slug);
    return [
      "<item>",
      `<title>${escapeXml(post.title)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      `<pubDate>${rssDate(post.published_at)}</pubDate>`,
      `<description>${escapeXml(post.description)}</description>`,
      `<category>${escapeXml(hubForType(post.type).label)}</category>`,
      `<dc:creator>${escapeXml(post.author.name)}</dc:creator>`,
      "</item>",
    ].join("");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "<channel>",
    `<title>${JOURNAL_NAME}</title>`,
    `<link>${JOURNAL_URL}</link>`,
    `<description>${escapeXml(JOURNAL_DESCRIPTION)}</description>`,
    "<language>en</language>",
    `<atom:link href="${JOURNAL_FEED_URL}" rel="self" type="application/rss+xml"/>`,
    `<lastBuildDate>${rssDate(newest ?? now.toISOString())}</lastBuildDate>`,
    "<ttl>60</ttl>",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

/* ---------- sitemap ---------- */

function sitemapUrl(loc: string, lastmod: string): string {
  return [
    `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod>`,
    `<xhtml:link rel="alternate" hreflang="en" href="${loc}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`,
    "</url>",
  ].join("");
}

/**
 * `sitemap-journal.xml` (§10): published posts only, `lastmod = updated_at`,
 * plus the index and each hub dated by its own newest post. A hub with no
 * published post of its type is left out (its page is `noindex` until then,
 * see `listMetadata`), and nothing at all is listed until the first post is
 * published.
 */
export function buildJournalSitemap(feed: JournalFeedItem[] | null): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  const published = (feed ?? []).filter((item) => item.state === "published");
  const iso = (value: string) => new Date(Date.parse(value)).toISOString();
  const newest = (items: JournalFeedItem[]) =>
    items.reduce<string | null>(
      (latest, item) => (!latest || Date.parse(item.updated_at) > Date.parse(latest) ? item.updated_at : latest),
      null,
    );
  const overall = newest(published);
  if (overall) {
    lines.push(sitemapUrl(JOURNAL_URL, iso(overall)));
    for (const hub of JOURNAL_HUBS) {
      const latest = newest(published.filter((item) => item.type === hub.type));
      if (latest) lines.push(sitemapUrl(`${SITE}${listPath(hub)}`, iso(latest)));
    }
  }
  const seen = new Set<string>();
  for (const item of published) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    lines.push(sitemapUrl(postUrl(item.slug), iso(item.updated_at)));
  }
  lines.push("</urlset>");
  return lines.join("\n");
}
