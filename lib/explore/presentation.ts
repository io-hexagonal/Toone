import type {
  RoutineCatalogEntry,
  BundleCatalogEntry,
  RoutinePublicDetail,
  BundlePublicDetail,
  ListingProfilePublic,
} from "./types";

export type CatalogQuery = {
  type: "all" | "routines" | "bundles";
  query: string;
  tag: string;
  page: number;
  category?: string;
  topics?: string[];
  usefulFor?: string[];
};
export type CatalogItem =
  | { type: "routine"; entry: RoutineCatalogEntry }
  | { type: "bundle"; entry: BundleCatalogEntry };
export const SITE = "https://trytoone.com";
export function parseCatalogQuery(
  raw: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const one = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";
  const page = Number(one("page"));
  const type = one("type");
  const tag = one("tag");
  const many = (key: string) => [...new Set((Array.isArray(raw[key]) ? raw[key] : raw[key] ? [raw[key]] : []) as string[])];
  const category = Array.isArray(raw.category) ? [...new Set(raw.category)].join(",") : one("category");
  const topics = many("topic");
  const usefulFor = many("useful_for");
  return {
    type: type === "routines" || type === "bundles" ? type : "all",
    query: one("q").trim().slice(0, 128),
    tag: /^[a-z0-9-]{1,32}$/.test(tag) ? tag : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    ...(category ? { category } : {}),
    ...(topics.length ? { topics } : {}),
    ...(usefulFor.length ? { usefulFor } : {}),
  };
}
export function catalogHref(locale: string, query: CatalogQuery): string {
  const params = new URLSearchParams();
  if (query.type !== "all") params.set("type", query.type);
  if (query.query) params.set("q", query.query);
  if (query.tag) params.set("tag", query.tag);
  if (query.category) params.set("category", query.category);
  for (const topic of query.topics ?? []) params.append("topic", topic);
  for (const role of query.usefulFor ?? []) params.append("useful_for", role);
  if (query.page > 1) params.set("page", String(query.page));
  return `/${locale}/explore${params.size ? `?${params}` : ""}`;
}
export function deepLink(
  type: "routine" | "bundle",
  id: string,
  revision?: string,
): string | null {
  if (
    !(
      type === "routine" ? /^wfl_[a-z0-9]{8,32}$/ : /^wfb_[a-z0-9]{8,32}$/
    ).test(id)
  )
    return null;
  if (
    revision &&
    !(
      type === "routine" ? /^wfr_[a-z0-9]{8,32}$/ : /^wbr_[a-z0-9]{8,32}$/
    ).test(revision)
  )
    return null;
  return `toone://explore/${type}s/${id}${revision ? `?revision=${revision}` : ""}`;
}
type OpenEnvironment = {
  listen: (event: string, fn: () => void) => () => void;
  later: (fn: () => void, ms: number) => () => void;
  visible: () => boolean;
  navigate: (url: string) => void;
};
/** Losing focus/visibility is evidence of handoff. Never redirect on return. */
export function createOpenAttempt(
  env: OpenEnvironment,
  url: string,
  fallback: string,
): () => void {
  let finished = false;
  const cleanups: Array<() => void> = [];
  const cancel = () => {
    if (finished) return;
    finished = true;
    cleanups.forEach((fn) => fn());
  };
  cleanups.push(
    env.listen("visibilitychange", () => {
      if (!env.visible()) cancel();
    }),
    env.listen("pagehide", cancel),
    env.listen("blur", cancel),
  );
  cleanups.push(
    env.later(() => {
      if (finished) return;
      const visible = env.visible();
      cancel();
      if (visible) env.navigate(fallback);
    }, 1500),
  );
  try {
    env.navigate(url);
  } catch {
    cancel();
    env.navigate(fallback);
  }
  return cancel;
}
/**
 * Attribution carried from Explore to the access request: `from=explore` and
 * the record (`routine:wfl_…` / `bundle:wfb_…`). Anything else is dropped.
 */
const ATTRIBUTION_ITEM = /^(routine:wfl|bundle:wfb)_[a-z0-9]{8,32}$/;
export function accessAttribution(from: unknown, item: unknown): { from?: string; item?: string } {
  if (from !== "explore") return {};
  return typeof item === "string" && ATTRIBUTION_ITEM.test(item) ? { from, item } : { from };
}
export function requestAccessHref(locale: string, item?: string): string {
  const params = new URLSearchParams(accessAttribution("explore", item));
  return `/${locale}/request-access?${params}`;
}
export function safeMarkdownUrl(value: string): string {
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (/^(#[^\s]*|\/(?!\/)[^\\]*)$/.test(value)) return value;
  return "";
}
/**
 * Search snippets cut near 160 characters. Keep whole sentences that fit,
 * otherwise cut at a word boundary; the full summary stays on the page.
 */
export function metaDescription(text: string, limit = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > limit) break;
    out += sentence;
  }
  if (out.trim()) return out.trim();
  const cut = clean.slice(0, limit - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "")}…`;
}
/** Shared schema.org fields for approved Explore records. */
export function recordSchemaFields(detail: {
  author_name: string;
  approved_at: string;
}) {
  return {
    dateModified: detail.approved_at,
    ...(detail.author_name
      ? { author: { "@type": "Person", name: detail.author_name } }
      : {}),
    publisher: { "@id": `${SITE}/#organization` },
    isPartOf: { "@id": `${SITE}/#website` },
  };
}
export function exploreMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
  cover: string | null,
  options: { imageAlt?: string; indexable?: boolean } = {},
) {
  const canonical = `${SITE}/en${path}`;
  // Scrapers need a fetchable URL for og:image; the inline data-URL cover the
  // pre-contract server sends would only bloat the head (~250 KB twice).
  const url = cover && /^https?:\/\//.test(cover) ? cover : null;
  const image = url && options.imageAlt ? { url, alt: options.imageAlt } : url;
  description = metaDescription(description);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { en: canonical, "x-default": canonical },
    },
    robots: { index: locale === "en" && options.indexable !== false, follow: true },
    openGraph: {
      type: "website" as const,
      url: canonical,
      title,
      description,
      siteName: "Toone",
      images: image ? [image] : [`${SITE}/assets/og/toone-og.png`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: image ? [image] : [`${SITE}/assets/og/toone-og.png`],
    },
  };
}
export function routineSchema(detail: RoutinePublicDetail) {
  const root = detail.package.members.find(
    (member) => member.key === detail.package.root_key,
  );
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: detail.title,
    description: detail.summary,
    inLanguage: "en",
    url: `${SITE}/en/explore/routines/${detail.slug || detail.workflow_id}`,
    ...recordSchemaFields(detail),
    step: (root?.payload.steps ?? []).map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: [step.description, ...(step.completionCriteria ?? [])]
        .filter(Boolean)
        .join("\n"),
      url: `${SITE}/en/explore/routines/${detail.slug || detail.workflow_id}#step-${index + 1}`,
    })),
  };
}
export function breadcrumbSchema(
  title: string,
  path: string,
  category?: { id: string; label: string } | null,
) {
  const levels = [
    { name: "Toone", item: `${SITE}/en` },
    { name: "Explore", item: `${SITE}/en/explore` },
    ...(category
      ? [{ name: category.label, item: `${SITE}${categoryHref("en", category.id)}` }]
      : []),
    { name: title, item: `${SITE}/en${path}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: levels.map((level, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...level,
    })),
  };
}
/** The hub filtered to one category (the breadcrumb's middle level). */
export function categoryHref(locale: string, categoryId: string): string {
  return catalogHref(locale, { type: "all", query: "", tag: "", page: 1, category: categoryId });
}

/* ---------- listing profile (contract §13) ---------- */

/**
 * `HowTo` for a record with a listing profile: the plain-language job, the
 * answer and the human summary of the steps, with the sites it works with as
 * tools and what you provide as supplies. The builder-level steps stay in the
 * page's collapsed definition, not in the markup.
 */
export function profileSchema(
  detail: RoutinePublicDetail | BundlePublicDetail,
  profile: ListingProfilePublic,
  path: string,
) {
  const url = `${SITE}/en${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: profile.search.display_title,
    description: profile.answer,
    inLanguage: "en",
    url,
    ...recordSchemaFields(detail),
    step: profile.how_it_works.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text,
      url: `${url}#how-it-works-${index + 1}`,
    })),
    ...(profile.third_parties.length
      ? { tool: profile.third_parties.map((site) => ({ "@type": "HowToTool", name: site.name })) }
      : {}),
    ...(profile.you_provide.length
      ? { supply: profile.you_provide.map((input) => ({ "@type": "HowToSupply", name: input.label })) }
      : {}),
  };
}

/** Title and summary a card shows: the profile's plain wording when present. */
export function cardText(entry: {
  title: string;
  summary: string;
  display_title?: string | null;
  card_summary?: string | null;
}): { title: string; summary: string } {
  return {
    title: entry.display_title || entry.title,
    summary: entry.card_summary || entry.summary,
  };
}
