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
  return value.length <= 128 && (isWorkflowId(value) || isBundleId(value) || SLUG.test(value));
}

/**
 * The slug the public URL should use. Falls back to the id: the live server
 * predates the slug backfill, and the server resolves ids on every route.
 */
export function resolveSlug(
  entry: { slug?: string | null; workflow_id: string } | { slug?: string | null; bundle_id: string },
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
    if (/^https?:\/\//.test(entry.cover_url)) return entry.cover_url;
    return `${exploreApiBase()}/${entry.cover_url.replace(/^\/+/, "")}`;
  }
  const dataUrl = entry.cover_image_data_url;
  if (dataUrl && dataUrl.startsWith("data:image/")) return dataUrl;
  return null;
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
 * Returns `null` on 404 (unknown item, or a route the deployed server does
 * not serve yet) and throws on any other failure so ISR keeps serving the
 * last good render instead of caching an empty page.
 */
async function getJson<T>(
  path: string,
  query: Record<string, string | number | undefined>,
  tags: string[],
): Promise<Fetched<T> | null> {
  const url = new URL(`${exploreApiBase()}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
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
  if (envelope === null || typeof envelope !== "object" || !("data" in envelope)) {
    throw new ExploreApiError(url.pathname, response.status, "response has no data envelope");
  }
  const totalHeader = response.headers.get("x-total-count");
  const parsedTotal = totalHeader === null ? Number.NaN : Number.parseInt(totalHeader, 10);
  const data = envelope.data as T;
  const total = Number.isFinite(parsedTotal)
    ? parsedTotal
    : Array.isArray(data)
      ? data.length
      : 0;
  return { data, total };
}

export type ListQuery = { query?: string; tag?: string; limit?: number; offset?: number };

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
  if (!result) return { items: [], total: 0 };
  return { items: Array.isArray(result.data) ? result.data : [], total: result.total };
}

/**
 * `GET /v1/bundles` (§5.4). `available` is false when the deployed server
 * does not serve the route yet (404), so the index can hide the Bundles
 * filter instead of showing an empty one.
 */
export async function listBundles(
  options: ListQuery = {},
): Promise<ListResult<BundleCatalogEntry> & { available: boolean }> {
  const result = await getJson<BundleCatalogEntry[]>(
    "bundles",
    { query: options.query, tag: options.tag, limit: options.limit ?? 100, offset: options.offset },
    [EXPLORE_TAG],
  );
  if (!result) return { items: [], total: 0, available: false };
  return {
    items: Array.isArray(result.data) ? result.data : [],
    total: result.total,
    available: true,
  };
}

/** `GET /v1/workflows/{id-or-slug}` (§5.2); null when unknown. */
export async function getRoutine(idOrSlug: string): Promise<RoutinePublicDetail | null> {
  if (!isRouteParam(idOrSlug)) return null;
  const result = await getJson<RoutinePublicDetail>(
    `workflows/${encodeURIComponent(idOrSlug)}`,
    {},
    [EXPLORE_TAG, itemTag(idOrSlug)],
  );
  return result?.data ?? null;
}

/** `GET /v1/bundles/{id-or-slug}` (§5.5); null when unknown or not public. */
export async function getBundle(idOrSlug: string): Promise<BundlePublicDetail | null> {
  if (!isRouteParam(idOrSlug)) return null;
  const result = await getJson<BundlePublicDetail>(
    `bundles/${encodeURIComponent(idOrSlug)}`,
    {},
    [EXPLORE_TAG, itemTag(idOrSlug)],
  );
  return result?.data ?? null;
}

/** `GET /v1/explore/feed` (§5.8); null when the server does not serve it yet. */
export async function getExploreFeed(since?: string): Promise<ExploreFeed | null> {
  const result = await getJson<ExploreFeed>("explore/feed", { since }, [EXPLORE_TAG]);
  return result?.data ?? null;
}

/** `GET /v1/explore/tags` (§5.9); empty when the server does not serve it yet. */
export async function getExploreTags(): Promise<ExploreTag[]> {
  const result = await getJson<ExploreTag[]>("explore/tags", {}, [EXPLORE_TAG]);
  return Array.isArray(result?.data) ? result.data : [];
}
