import type {
  RoutineCatalogEntry,
  BundleCatalogEntry,
  RoutinePublicDetail,
} from "./types";

export type CatalogQuery = {
  type: "all" | "routines" | "bundles";
  query: string;
  tag: string;
  page: number;
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
  return {
    type: type === "routines" || type === "bundles" ? type : "all",
    query: one("q").trim().slice(0, 128),
    tag: /^[a-z0-9-]{1,32}$/.test(tag) ? tag : "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}
export function catalogHref(locale: string, query: CatalogQuery): string {
  const params = new URLSearchParams();
  if (query.type !== "all") params.set("type", query.type);
  if (query.query) params.set("q", query.query);
  if (query.tag) params.set("tag", query.tag);
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
export function safeMarkdownUrl(value: string): string {
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (/^(#[^\s]*|\/(?!\/)[^\\]*)$/.test(value)) return value;
  return "";
}
export function exploreMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
  cover: string | null,
) {
  const canonical = `${SITE}/en${path}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { en: canonical, "x-default": canonical },
    },
    robots: { index: locale === "en", follow: true },
    openGraph: {
      type: "website" as const,
      url: canonical,
      title,
      description,
      siteName: "Toone",
      images: cover ? [cover] : [`${SITE}/assets/og/toone-og.png`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: cover ? [cover] : [`${SITE}/assets/og/toone-og.png`],
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
export function breadcrumbSchema(title: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Toone", item: `${SITE}/en` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Explore",
        item: `${SITE}/en/explore`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${SITE}/en${path}`,
      },
    ],
  };
}
