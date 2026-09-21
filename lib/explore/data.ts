/**
 * Server-only fetchers for the public Explore catalog (contract §3, §5, §11).
 *
 * This is the first server-side use of the Toone API in this repo. It is
 * deliberately separate from `lib/api.ts`, which is a browser client keyed on
 * `NEXT_PUBLIC_*`. Never import this module from a client component: it reads
 * `EXPLORE_API_BASE_URL`, which is not inlined into the browser bundle.
 *
 * Every GET goes through Next's data cache with `revalidate: 600` and the
 * `explore` tag (plus `explore:<slug>` for one item), so the webhook handler
 * at `app/api/revalidate` can expire them on demand.
 */
import type { CatalogQuery, CatalogItem } from "./presentation";
import type {
  BundleCatalogEntry,
  BundlePublicDetail,
  ExploreFeed,
  ExploreTag,
  ListResult,
  RoutineCatalogEntry,
  RoutineListing,
  RoutinePublicDetail,
} from "./types";

export const EXPLORE_REVALIDATE_SECONDS = 600;
export const EXPLORE_TAG = "explore";

const DEFAULT_API_BASE = "https://api.trytoone.com/v1";

/** Versioned API base without a trailing slash. */
export function exploreApiBase(): string {
  const raw = process.env.EXPLORE_API_BASE_URL?.trim() || DEFAULT_API_BASE;
  return raw.replace(/\/+$/, "");
}

export function itemTag(slugOrId: string): string {
  return `${EXPLORE_TAG}:${slugOrId}`;
}

/** Contract §2: deep-link and route ids are validated by prefix and length. */
export const WORKFLOW_ID = /^wfl_[a-z0-9]{8,32}$/;
export const BUNDLE_ID = /^wfb_[a-z0-9]{8,32}$/;
/** Contract §4: `workflows_slug_format`. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isWorkflowId(value: string): boolean {
  return WORKFLOW_ID.test(value);
}

export function isBundleId(value: string): boolean {
  return BUNDLE_ID.test(value);
}

/** True when `value` can be sent to a `{id-or-slug}` route at all. */
export function isRouteParam(value: string): boolean {
  return (
    value.length <= 128 &&
    (isWorkflowId(value) || isBundleId(value) || SLUG.test(value))
  );
}

/**
 * The slug the public URL should use. Falls back to the id: the live server
 * predates the slug backfill, and the server resolves ids on every route.
 */
export function resolveSlug(
  entry:
    | { slug?: string | null; workflow_id: string }
    | { slug?: string | null; bundle_id: string },
): string {
  if (entry.slug && SLUG.test(entry.slug)) return entry.slug;
  return "workflow_id" in entry ? entry.workflow_id : entry.bundle_id;
}

/**
 * Absolute cover URL, or null when the item has no cover.
 * `cover_url` is a path relative to the API base (contract §3); the inline
 * data URL is the pre-contract fallback the shipping desktop build still
 * receives.
 */
export function resolveCoverUrl(entry: {
  cover_url?: string | null;
  cover_image_data_url?: string | null;
}): string | null {
  if (entry.cover_url) {
    if (
      !/^(workflows|bundles)\/[a-z0-9_]+\/revisions\/[a-z0-9_]+\/cover\.jpg$/.test(
        entry.cover_url,
      )
    )
      return null;
    return `${exploreApiBase()}/${entry.cover_url}`;
  }
  const dataUrl = entry.cover_image_data_url;
  return dataUrl && /^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(dataUrl)
    ? dataUrl
    : null;
}

export class ExploreApiError extends Error {
  status: number;
  path: string;

  constructor(path: string, status: number, message: string) {
    super(`Explore API ${status} on ${path}: ${message}`);
    this.name = "ExploreApiError";
    this.status = status;
    this.path = path;
  }
}

type Fetched<T> = { data: T; total: number };

/**
 * GET `${base}/${path}`, unwrap the `{data}` envelope, read `X-Total-Count`.
 * Returns `null` on 404; detail fetchers preserve it as not-found, while catalog
 * and feed fetchers treat a missing collection route as unavailability. Other
 * failures are never converted to successful empty responses.
 */
async function getJson<T>(
  path: string,
  query: Record<string, string | number | undefined>,
  tags: string[],
): Promise<Fetched<T> | null> {
  const url = new URL(`${exploreApiBase()}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "")
      url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: EXPLORE_REVALIDATE_SECONDS, tags },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // Non-JSON error body; keep the status text.
    }
    throw new ExploreApiError(url.pathname, response.status, message);
  }

  const envelope = (await response.json()) as { data?: T };
  if (
    envelope === null ||
    typeof envelope !== "object" ||
    !("data" in envelope)
  ) {
    throw new ExploreApiError(
      url.pathname,
      response.status,
      "response has no data envelope",
    );
  }
  const totalHeader = response.headers.get("x-total-count");
  const parsedTotal =
    totalHeader === null ? Number.NaN : Number.parseInt(totalHeader, 10);
  const data = envelope.data as T;
  const total =
    Number.isFinite(parsedTotal) && parsedTotal >= 0
      ? parsedTotal
      : Array.isArray(data)
        ? data.length
        : 0;
  return { data, total };
}

export type ListQuery = {
  query?: string;
  tag?: string;
  limit?: number;
  offset?: number;
};

/** `GET /v1/workflows` (§5.1). `listing` defaults to `standalone` server-side. */
export async function listRoutines(
  options: ListQuery & { listing?: RoutineListing | "all" } = {},
): Promise<ListResult<RoutineCatalogEntry>> {
  const result = await getJson<RoutineCatalogEntry[]>(
    "workflows",
    {
      listing: options.listing,
      query: options.query,
      tag: options.tag,
      limit: options.limit ?? 100,
      offset: options.offset,
    },
    [EXPLORE_TAG],
  );
  if (!result)
    throw new ExploreApiError("workflows", 404, "catalog unavailable");
  if (!Array.isArray(result.data))
    throw new ExploreApiError("workflows", 502, "expected array");
  return { items: result.data, total: result.total };
}

/**
 * `GET /v1/bundles` (§5.4). Missing collection endpoints are an outage,
 * not an empty catalog.
 */
export async function listBundles(
  options: ListQuery = {},
): Promise<ListResult<BundleCatalogEntry>> {
  const result = await getJson<BundleCatalogEntry[]>(
    "bundles",
    {
      query: options.query,
      tag: options.tag,
      limit: options.limit ?? 100,
      offset: options.offset,
    },
    [EXPLORE_TAG],
  );
  if (!result) throw new ExploreApiError("bundles", 404, "catalog unavailable");
  if (!Array.isArray(result.data))
    throw new ExploreApiError("bundles", 502, "expected array");
  return {
    items: Array.isArray(result.data) ? result.data : [],
    total: result.total,
  };
}

/** `GET /v1/workflows/{id-or-slug}` (§5.2); null when unknown. */
export async function getRoutine(
  idOrSlug: string,
): Promise<RoutinePublicDetail | null> {
  if (!isRouteParam(idOrSlug)) return null;
  const result = await getJson<RoutinePublicDetail>(
    `workflows/${encodeURIComponent(idOrSlug)}`,
    {},
    [EXPLORE_TAG, itemTag(idOrSlug)],
  );
  if (!result) return null;
  if (
    !result.data ||
    !isWorkflowId(result.data.workflow_id) ||
    !Array.isArray(result.data.package?.members) ||
    !Array.isArray(result.data.tags) ||
    !Number.isFinite(Date.parse(result.data.approved_at))
  ) {
    throw new ExploreApiError(
      "workflows/detail",
      502,
      "invalid routine detail",
    );
  }
  return result.data;
}

/** `GET /v1/bundles/{id-or-slug}` (§5.5); null when unknown or not public. */
export async function getBundle(
  idOrSlug: string,
): Promise<BundlePublicDetail | null> {
  if (!isRouteParam(idOrSlug)) return null;
  const result = await getJson<BundlePublicDetail>(
    `bundles/${encodeURIComponent(idOrSlug)}`,
    {},
    [EXPLORE_TAG, itemTag(idOrSlug)],
  );
  if (!result) return null;
  if (
    !result.data ||
    !isBundleId(result.data.bundle_id) ||
    !Array.isArray(result.data.members) ||
    !Array.isArray(result.data.tags) ||
    !Number.isFinite(Date.parse(result.data.approved_at))
  ) {
    throw new ExploreApiError("bundles/detail", 502, "invalid bundle detail");
  }
  return result.data;
}

/** `GET /v1/explore/feed` (§5.8); an unavailable feed must not erase sitemap entries. */
export async function getExploreFeed(since?: string): Promise<ExploreFeed> {
  const result = await getJson<ExploreFeed>("explore/feed", { since }, [
    EXPLORE_TAG,
  ]);
  if (!result)
    throw new ExploreApiError("explore/feed", 404, "feed unavailable");
  if (!Array.isArray(result.data?.items))
    throw new ExploreApiError("explore/feed", 502, "expected feed");
  return result.data;
}

/** `GET /v1/explore/tags` (§5.9); absent routes are unavailable, not empty. */
export async function getExploreTags(): Promise<ExploreTag[]> {
  const result = await getJson<ExploreTag[]>("explore/tags", {}, [EXPLORE_TAG]);
  if (!result)
    throw new ExploreApiError("explore/tags", 404, "tags unavailable");
  if (!Array.isArray(result.data))
    throw new ExploreApiError("explore/tags", 502, "expected array");
  return result.data;
}

export const PAGE_SIZE = 20;

/** Merge source prefixes, not independently offset pages (which drop interleaved results). */
export async function loadCatalog(
  query: CatalogQuery,
): Promise<{ items: CatalogItem[]; total: number; page: number }> {
  const filters = { query: query.query, tag: query.tag, limit: 100 };
  const [routines, bundles] = await Promise.all([
    query.type === "bundles"
      ? Promise.resolve({ items: [] as RoutineCatalogEntry[], total: 0 })
      : listRoutines({ ...filters, listing: "standalone" }),
    query.type === "routines"
      ? Promise.resolve({ items: [] as BundleCatalogEntry[], total: 0 })
      : listBundles(filters),
  ]);
  const total = routines.total + bundles.total;
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const needed = page * PAGE_SIZE;
  async function extend<T>(
    result: ListResult<T>,
    fetchPage: (offset: number) => Promise<ListResult<T>>,
  ) {
    while (result.items.length < Math.min(needed, result.total)) {
      const batch = await fetchPage(result.items.length);
      if (!batch.items.length)
        throw new ExploreApiError("catalog", 502, "inconsistent pagination");
      result.items.push(...batch.items);
    }
  }
  await Promise.all([
    extend(routines, (offset) =>
      listRoutines({ ...filters, listing: "standalone", offset }),
    ),
    extend(bundles, (offset) => listBundles({ ...filters, offset })),
  ]);
  const items: CatalogItem[] = [
    ...routines.items.map((entry) => ({ type: "routine" as const, entry })),
    ...bundles.items.map((entry) => ({ type: "bundle" as const, entry })),
  ];
  items.sort(
    (a, b) =>
      Date.parse(b.entry.approved_at) - Date.parse(a.entry.approved_at) ||
      ("workflow_id" in a.entry
        ? a.entry.workflow_id
        : a.entry.bundle_id
      ).localeCompare(
        "workflow_id" in b.entry ? b.entry.workflow_id : b.entry.bundle_id,
      ),
  );
  return {
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
  };
}
