import { normalizeClassification, validateCatalogTaxonomy, hasTaxonomyFilters, type ExploreTaxonomy, type ExploreFacet } from "./taxonomy";
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
import { resolveCoverPath } from "./cover";
import { normalizeListingProfile, normalizeThirdPartyReviews } from "./profile";
import type {
  BundleCatalogEntry,
  BundlePublicDetail,
  ExploreFeed,
  ExploreTag,
  ListResult,
  RoutineCatalogEntry,
  RoutineListing,
  RoutinePublicDetail,
  ProfileFields,
  CardPresentation,
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
  if (entry.cover_url) return resolveCoverPath(exploreApiBase(), entry.cover_url);
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

/**
 * Card covers never inline the legacy data URL: the live entry carries a
 * ~100 KB data URL, so a page of covered cards would weigh megabytes (twice,
 * counting the RSC payload). Cards render the placeholder tile until
 * `cover_url` ships; only the detail hero inlines the fallback.
 */
export function resolveCardCoverUrl(entry: {
  cover_url?: string | null;
  cover_image_data_url?: string | null;
}): string | null {
  const url = resolveCoverUrl(entry);
  return url && /^https?:\/\//.test(url) ? url : null;
}

type Fetched<T> = { data: T; total: number };

/**
 * Next's data cache only stores 200s, and the index is a dynamic route, so
 * without this every request against today's server would re-fetch the 404
 * routes (`/v1/bundles`, `/v1/explore/tags`) and burn the contract's shared
 * 60 req/min/IP bucket. Two small in-module memos, both cleared by the
 * revalidation webhook and bounded in size:
 *
 * - `notServed`: upstream path -> expiry. A 404 costs one upstream call per
 *   window instead of one per request.
 * - `lastGood`: full URL -> last 200 payload. When upstream answers 429 the
 *   last good catalog renders instead of the outage page.
 *
 * Per warm instance only (Vercel functions do not share memory); the TTL
 * bounds staleness where the webhook cannot reach.
 */
const NEGATIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_LIMIT = 500;
const LAST_GOOD_LIMIT = 200;

/**
 * Next compiles each route into its own chunk with its own copy of this
 * module, so a plain module-level Map in the webhook handler would not be the
 * Map the pages read. A Symbol-keyed slot on `globalThis` is shared by every
 * chunk in the process (the same trick used for database-client singletons).
 */
type ExploreMemo = {
  notServed: Map<string, number>;
  lastGood: Map<string, Fetched<unknown>>;
};
const MEMO_KEY = Symbol.for("toone.explore.memo");
const memo: ExploreMemo = ((globalThis as Record<symbol, unknown>)[MEMO_KEY] ??= {
  notServed: new Map<string, number>(),
  lastGood: new Map<string, Fetched<unknown>>(),
}) as ExploreMemo;
const { notServed, lastGood } = memo;

function remember<K, V>(map: Map<K, V>, key: K, value: V, limit: number) {
  map.delete(key);
  map.set(key, value);
  while (map.size > limit) {
    const oldest = map.keys().next().value as K;
    map.delete(oldest);
  }
}

/** Clears the negative and last-good memos (called by the webhook handler). */
export function resetExploreMemo(): void {
  notServed.clear();
  lastGood.clear();
}

/** True when `path` answered 404 within the negative window (test hook). */
export function isMemoizedNotServed(path: string): boolean {
  const until = notServed.get(`${exploreApiBase()}/${path}`);
  return until !== undefined && until > Date.now();
}

/**
 * GET `${base}/${path}`, unwrap the `{data}` envelope, read `X-Total-Count`.
 * Returns `null` on 404; detail fetchers preserve it as not-found, while catalog
 * and feed fetchers treat a missing collection route as "not served yet".
 * Other failures are never converted to successful empty responses.
 */
async function getJson<T>(
  path: string,
  query: Record<string, string | string[] | number | undefined>,
  tags: string[],
): Promise<Fetched<T> | null> {
  const url = new URL(`${exploreApiBase()}/${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) { for (const item of value) url.searchParams.append(key, item); }
    else if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const routeKey = `${url.origin}${url.pathname}`;
  const negativeUntil = notServed.get(routeKey);
  if (negativeUntil !== undefined) {
    if (negativeUntil > Date.now()) return null;
    notServed.delete(routeKey);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: EXPLORE_REVALIDATE_SECONDS, tags },
  });

  if (response.status === 404) {
    remember(notServed, routeKey, Date.now() + NEGATIVE_TTL_MS, NEGATIVE_LIMIT);
    return null;
  }
  if (response.status === 429) {
    const previous = lastGood.get(url.href);
    if (previous) {
      console.warn(`[explore] upstream 429 on ${url.pathname}; serving last good response`);
      return previous as Fetched<T>;
    }
  }
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
  const result = { data, total };
  remember(lastGood, url.href, result, LAST_GOOD_LIMIT);
  return result;
}

export type ListQuery = {
  category?: string;
  topic?: string[];
  useful_for?: string[];
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
      category: options.category, topic: options.topic, useful_for: options.useful_for,
      limit: options.limit ?? 100,
      offset: options.offset,
    },
    [EXPLORE_TAG],
  );
  if (!result)
    throw new ExploreApiError("workflows", 404, "catalog unavailable");
  if (!Array.isArray(result.data))
    throw new ExploreApiError("workflows", 502, "expected array");
  return { items: result.data.map(withCardPresentation), total: result.total };
}

/**
 * `GET /v1/bundles` (§5.4). `available` is false when the deployed server
 * does not serve the route at all (404): the live server predates bundles,
 * and the index must still render routines and hide the Bundles filter.
 * Any other failure is an outage and throws.
 */
export async function listBundles(
  options: ListQuery = {},
): Promise<ListResult<BundleCatalogEntry> & { available: boolean }> {
  const result = await getJson<BundleCatalogEntry[]>(
    "bundles",
    {
      query: options.query,
      tag: options.tag,
      category: options.category, topic: options.topic, useful_for: options.useful_for,
      limit: options.limit ?? 100,
      offset: options.offset,
    },
    [EXPLORE_TAG],
  );
  if (!result) return { items: [], total: 0, available: false };
  if (!Array.isArray(result.data))
    throw new ExploreApiError("bundles", 502, "expected array");
  return { items: result.data.map(withCardPresentation), total: result.total, available: true };
}

/**
 * The deployed server still answers the detail route with the pre-contract
 * `WorkflowRevision` shape (`id` for the revision, `reviewed_at` instead of
 * `approved_at`, no counts, no author, and reviewer-only fields). Project it
 * onto `RoutinePublicDetail` by allow-listing contract fields, so nothing the
 * contract excludes (`submitted_by`, `reviewed_by`, `review_reason`,
 * `status`) can reach the page, and derive the counts from the package.
 */
function normalizeRoutineDetail(raw: Record<string, unknown>): RoutinePublicDetail {
  const pkg = raw.package as RoutinePublicDetail["package"];
  const members = Array.isArray(pkg?.members) ? pkg.members : [];
  const str = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;
  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const steps = members.reduce(
    (sum, member) => sum + (member.payload?.steps?.length ?? 0),
    0,
  );
  return {
    classification: normalizeClassification(raw.classification),
    workflow_id: str(raw.workflow_id),
    slug: typeof raw.slug === "string" ? raw.slug : null,
    revision_id: str(raw.revision_id, str(raw.id)),
    sequence: num(raw.sequence, 1),
    title: str(raw.title),
    summary: str(raw.summary),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t) => typeof t === "string") : [],
    license: str(raw.license),
    listing: raw.listing === "bundle_only" ? "bundle_only" : "standalone",
    cover_url: typeof raw.cover_url === "string" ? raw.cover_url : null,
    cover_image_data_url:
      typeof raw.cover_image_data_url === "string" ? raw.cover_image_data_url : null,
    author_name: str(raw.author_name),
    approved_at: str(raw.approved_at, str(raw.reviewed_at)),
    content_hash: str(raw.content_hash),
    package_schema_version: num(raw.package_schema_version, num(pkg?.format_version, 0)),
    routine_schema_version: num(raw.routine_schema_version, num(pkg?.routine_schema_version, 0)),
    member_count: num(raw.member_count, members.length),
    sub_routine_count: num(raw.sub_routine_count, Math.max(members.length - 1, 0)),
    step_count: num(raw.step_count, steps),
    agent_count: num(raw.agent_count, pkg?.agents?.length ?? 0),
    included_in_bundles: (Array.isArray(raw.included_in_bundles)
      ? (raw.included_in_bundles as Record<string, unknown>[])
      : []
    )
      .filter(
        (ref) =>
          ref &&
          typeof ref === "object" &&
          typeof ref.bundle_id === "string" &&
          isBundleId(ref.bundle_id) &&
          typeof ref.title === "string",
      )
      .map((ref) => ({
        bundle_id: ref.bundle_id as string,
        slug: typeof ref.slug === "string" ? ref.slug : null,
        title: ref.title as string,
      })),
    package: pkg,
    ...normalizeProfileFields(raw, `routine ${str(raw.workflow_id)}`, str(raw.workflow_id)),
  };
}

/**
 * Contract §13 fields shared by both details. Every one is optional: a
 * legacy record has no profile, is indexable, and has no related items.
 */
function normalizeProfileFields(
  raw: Record<string, unknown>,
  record: string,
  selfId: string,
): Required<ProfileFields> {
  const related: RoutineCatalogEntry[] = [];
  for (const entry of Array.isArray(raw.related) ? raw.related : []) {
    const normalized = normalizeCatalogEntry(entry);
    if (!normalized || normalized.workflow_id === selfId) continue;
    if (related.some((item) => item.workflow_id === normalized.workflow_id)) continue;
    related.push(normalized);
    if (related.length === 4) break;
  }
  return {
    listing_profile: normalizeListingProfile(raw.listing_profile, record),
    indexable: raw.indexable !== false,
    third_party_reviews: normalizeThirdPartyReviews(raw.third_party_reviews),
    related,
  };
}

/** List items keep their shape; only the §13 card fields are type-checked. */
function withCardPresentation<T>(item: T): T {
  return item && typeof item === "object"
    ? { ...item, ...normalizeCardPresentation(item as Record<string, unknown>) }
    : item;
}

/** Card fields on catalog entries (§13); anything unusable reads as legacy. */
export function normalizeCardPresentation(r: Record<string, unknown>): CardPresentation {
  const text = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : null;
  return {
    display_title: text(r.display_title),
    card_summary: text(r.card_summary),
    results_count:
      typeof r.results_count === "number" && Number.isSafeInteger(r.results_count) && r.results_count > 0
        ? r.results_count
        : null,
  };
}

/**
 * Allow-list projection of a catalog entry (§5.1) as it appears in bundle
 * members. Returns null when the shape is unusable, so a malformed member
 * fails soft to the retry page instead of a 500 mid-render.
 */
function normalizeCatalogEntry(raw: unknown): RoutineCatalogEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;
  const num = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
  const entry: RoutineCatalogEntry = {
    classification: normalizeClassification(r.classification),
    workflow_id: str(r.workflow_id),
    slug: typeof r.slug === "string" ? r.slug : null,
    revision_id: str(r.revision_id),
    title: str(r.title),
    summary: str(r.summary),
    tags: Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === "string") : [],
    license: str(r.license),
    listing: r.listing === "bundle_only" ? "bundle_only" : "standalone",
    content_hash: str(r.content_hash),
    routine_schema_version: num(r.routine_schema_version),
    member_count: num(r.member_count),
    sub_routine_count: num(r.sub_routine_count),
    step_count: num(r.step_count),
    agent_count: num(r.agent_count),
    cover_url: typeof r.cover_url === "string" ? r.cover_url : null,
    cover_image_data_url:
      typeof r.cover_image_data_url === "string" ? r.cover_image_data_url : null,
    author_name: str(r.author_name),
    approved_at: str(r.approved_at),
    ...normalizeCardPresentation(r),
  };
  if (!isWorkflowId(entry.workflow_id) || !entry.title) return null;
  if (!Number.isFinite(Date.parse(entry.approved_at))) return null;
  return entry;
}

/** Allow-list projection of `BundlePublicDetail` (§5.5); null when unusable. */
function normalizeBundleDetail(raw: unknown): BundlePublicDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const str = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;
  if (!Array.isArray(r.members)) return null;
  const members: BundlePublicDetail["members"] = [];
  for (const [index, member] of r.members.entries()) {
    const entry = normalizeCatalogEntry(member);
    if (!entry) return null;
    const m = member as Record<string, unknown>;
    members.push({
      ...entry,
      position:
        typeof m.position === "number" && Number.isFinite(m.position)
          ? m.position
          : index,
      pinned_revision_id: str(m.pinned_revision_id, entry.revision_id),
      newer_revision_available: m.newer_revision_available === true,
    });
  }
  const detail: BundlePublicDetail = {
    classification: normalizeClassification(r.classification),
    bundle_id: str(r.bundle_id),
    slug: typeof r.slug === "string" ? r.slug : null,
    revision_id: str(r.revision_id),
    sequence:
      typeof r.sequence === "number" && Number.isFinite(r.sequence) ? r.sequence : 1,
    title: str(r.title),
    summary: str(r.summary),
    tags: Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === "string") : [],
    content_hash: str(r.content_hash),
    member_count:
      typeof r.member_count === "number" && Number.isFinite(r.member_count)
        ? r.member_count
        : members.length,
    cover_url: typeof r.cover_url === "string" ? r.cover_url : null,
    cover_image_data_url:
      typeof r.cover_image_data_url === "string" ? r.cover_image_data_url : null,
    author_name: str(r.author_name),
    approved_at: str(r.approved_at),
    members,
    ...normalizeProfileFields(r, `bundle ${str(r.bundle_id)}`, ""),
  };
  if (!isBundleId(detail.bundle_id) || !detail.title) return null;
  if (!Number.isFinite(Date.parse(detail.approved_at))) return null;
  return detail;
}

/** `GET /v1/workflows/{id-or-slug}` (§5.2); null when unknown. */
export async function getRoutine(
  idOrSlug: string,
): Promise<RoutinePublicDetail | null> {
  if (!isRouteParam(idOrSlug)) return null;
  const result = await getJson<Record<string, unknown>>(
    `workflows/${encodeURIComponent(idOrSlug)}`,
    {},
    [EXPLORE_TAG, itemTag(idOrSlug)],
  );
  if (!result) return null;
  if (!result.data || typeof result.data !== "object") {
    throw new ExploreApiError("workflows/detail", 502, "invalid routine detail");
  }
  const detail = normalizeRoutineDetail(result.data);
  if (
    !isWorkflowId(detail.workflow_id) ||
    !Array.isArray(detail.package?.members) ||
    !Number.isFinite(Date.parse(detail.approved_at))
  ) {
    throw new ExploreApiError("workflows/detail", 502, "invalid routine detail");
  }
  return detail;
}

/** `GET /v1/bundles/{id-or-slug}` (§5.5); null when unknown or not public. */
export async function getBundle(
  idOrSlug: string,
): Promise<BundlePublicDetail | null> {
  if (!isRouteParam(idOrSlug)) return null;
  const result = await getJson<unknown>(
    `bundles/${encodeURIComponent(idOrSlug)}`,
    {},
    [EXPLORE_TAG, itemTag(idOrSlug)],
  );
  if (!result) return null;
  const detail = normalizeBundleDetail(result.data);
  if (!detail) {
    throw new ExploreApiError("bundles/detail", 502, "invalid bundle detail");
  }
  return detail;
}

/**
 * `GET /v1/explore/feed` (§5.8). `null` when the deployed server does not
 * serve the route yet (404); an outage throws so the caller can decide
 * whether to keep the last good render.
 */
export async function getExploreFeed(since?: string): Promise<ExploreFeed | null> {
  const result = await getJson<ExploreFeed>("explore/feed", { since }, [
    EXPLORE_TAG,
  ]);
  if (!result) return null;
  if (!Array.isArray(result.data?.items))
    throw new ExploreApiError("explore/feed", 502, "expected feed");
  return result.data;
}

/**
 * Public slugs end in the last 8 characters of the record id
 * (`launch-surface-preparation-xzmzpbkf` → `wfl_…xzmzpbkf`). When a title
 * change moves the slug, an old URL still carries that tail, so look the
 * record up by it and let the page 308 to the current slug. Scans the first
 * 100 catalog entries (all of them today; data-cached like every list call).
 */
const ID_TAIL = /-([a-z0-9]{8})$/;
export async function findRoutineByIdTail(
  slug: string,
): Promise<RoutineCatalogEntry | null> {
  const tail = ID_TAIL.exec(slug)?.[1];
  if (!tail) return null;
  const { items } = await listRoutines({ listing: "all", limit: 100 });
  return items.find((item) => item.workflow_id.endsWith(tail)) ?? null;
}
export async function findBundleByIdTail(
  slug: string,
): Promise<BundleCatalogEntry | null> {
  const tail = ID_TAIL.exec(slug)?.[1];
  if (!tail) return null;
  const { items } = await listBundles({ limit: 100 });
  return items.find((item) => item.bundle_id.endsWith(tail)) ?? null;
}

/** `GET /v1/explore/tags` (§5.9); empty when the route is not served yet (404). */
export async function getExploreTags(): Promise<ExploreTag[]> {
  const result = await getJson<ExploreTag[]>("explore/tags", {}, [EXPLORE_TAG]);
  if (!result) return [];
  if (!Array.isArray(result.data))
    throw new ExploreApiError("explore/tags", 502, "expected array");
  return result.data;
}

export const PAGE_SIZE = 20;
/**
 * Deepest page the index serves. Beyond it a `?page=` chain would extend the
 * merged prefixes one 100-item upstream batch at a time; at 25 pages that is
 * at most five serial calls per source, all of them data-cached.
 */
export const MAX_PAGE = 25;

/** Merge source prefixes, not independently offset pages (which drop interleaved results). */
export async function loadCatalog(query: CatalogQuery): Promise<{
  items: CatalogItem[];
  total: number;
  page: number;
  /** False when the server has no bundles route yet; the index hides the filter. */
  bundlesAvailable: boolean;
}> {
  const filters = { query: query.query, tag: query.tag, category: query.category, topic: query.topics, useful_for: query.usefulFor, limit: 100 };
  // Both sources are always fetched with the same URL the "All" view uses,
  // so a type filter shares the cached responses instead of adding a probe;
  // the excluded source's items are simply dropped.
  const [allRoutines, allBundles] = await Promise.all([
    listRoutines({ ...filters, listing: "standalone" }),
    listBundles(filters),
  ]);
  const routines =
    query.type === "bundles"
      ? { items: [] as RoutineCatalogEntry[], total: 0 }
      : allRoutines;
  const bundles =
    query.type === "routines"
      ? { items: [] as BundleCatalogEntry[], total: 0, available: allBundles.available }
      : allBundles;
  const total = routines.total + bundles.total;
  const page = Math.min(
    query.page,
    MAX_PAGE,
    Math.max(1, Math.ceil(total / PAGE_SIZE)),
  );
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
    bundlesAvailable: bundles.available,
  };
}


export async function getExploreTaxonomy(): Promise<ExploreTaxonomy | null> {
  const result = await getJson<ExploreTaxonomy>("explore/taxonomy", {}, [EXPLORE_TAG]);
  if (!result) return null;
  if (typeof result.data?.version !== "string" || !Array.isArray(result.data.terms) || result.data.terms.some((term) => typeof term.id !== "string" || typeof term.label !== "string" || typeof term.description !== "string" || !["category", "topic", "useful_for"].includes(term.kind) || typeof term.active !== "boolean"))
    throw new ExploreApiError("explore/taxonomy", 502, "invalid taxonomy");
  return result.data;
}

export async function getExploreFacets(query: CatalogQuery): Promise<ExploreFacet[]> {
  const result = await getJson<ExploreFacet[]>("explore/facets", {query: query.query, tag: query.tag, category: query.category, topic: query.topics, useful_for: query.usefulFor, type: query.type, listing: "standalone"}, [EXPLORE_TAG]);
  if (!result) return [];
  if (!Array.isArray(result.data) || result.data.some((f) => typeof f.term_id !== "string" || !Number.isSafeInteger(f.routines) || !Number.isSafeInteger(f.bundles) || f.routines < 0 || f.bundles < 0))
    throw new ExploreApiError("explore/facets", 502, "invalid facets");
  return result.data;
}

export async function loadCatalogWithTaxonomy(query: CatalogQuery) {
  const taxonomy = await getExploreTaxonomy();
  let invalidFilters = taxonomy ? validateCatalogTaxonomy(query, taxonomy) : hasTaxonomyFilters(query) ? [query.category, ...(query.topics ?? []), ...(query.usefulFor ?? [])].filter((id): id is string => !!id) : [];
  if ((query.topics?.length ?? 0) > 20 || (query.usefulFor?.length ?? 0) > 20) invalidFilters = [...(query.topics ?? []), ...(query.usefulFor ?? [])];
  if (invalidFilters.length) return { items: [] as CatalogItem[], total: 0, page: 1, bundlesAvailable: true, taxonomy, facets: [] as ExploreFacet[], invalidFilters };
  const [catalog, facets] = await Promise.all([loadCatalog(query), taxonomy ? getExploreFacets(query) : Promise.resolve([])]);
  return {...catalog, taxonomy, facets, invalidFilters};
}
