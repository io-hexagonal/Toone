/**
 * Server-only fetchers for the public Journal (contract §7, §10).
 *
 * Never import this module from a client component: it reads
 * `EXPLORE_API_BASE_URL`, which is not inlined into the browser bundle.
 * `./api` re-exports it behind `server-only`; tests import it directly.
 *
 * Every response is projected onto the contract shapes by allow-list
 * normalizers. A list item that fails validation is dropped (one bad row must
 * not take the index down); a detail that fails validation is an upstream
 * error (502), never a silently broken article.
 */
import {
  JOURNAL_TAG,
  JournalApiError,
  journalApiBase,
  journalPostTag,
  journalSource,
} from "./source";
import type {
  JournalAsset,
  JournalAuthor,
  JournalCover,
  JournalExploreRef,
  JournalFeedItem,
  JournalListResult,
  JournalPostDetail,
  JournalPostEntry,
  JournalPostLookup,
  JournalPostType,
  JournalPreview,
  JournalRelease,
  JournalState,
} from "./types";

export {
  JOURNAL_REVALIDATE_SECONDS,
  JOURNAL_TAG,
  JournalApiError,
  journalApiBase,
  journalPostTag,
  resetJournalMemo,
  setJournalSource,
} from "./source";

/** Contract §2. */
export const POST_ID = /^jnp_[a-z0-9]{8,32}$/;
export const ASSET_ID = /^jna_[a-z0-9]{8,32}$/;
export const JOURNAL_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** 43-char base64url today (§4); a little slack either way, nothing else. */
export const PREVIEW_TOKEN = /^[A-Za-z0-9_-]{16,128}$/;
const ASSET_PATH = /^journal\/assets\/jna_[a-z0-9]{8,32}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const EXPLORE_SLUG_OR_ID = /^(?:wf[lb]_[a-z0-9]{8,32}|[a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** Index and hub pages show 12 posts each (§10). */
export const JOURNAL_PAGE_SIZE = 12;
/** The RSS feed carries the newest 30 published posts (§10). */
export const JOURNAL_FEED_SIZE = 30;

export const POST_TYPES: readonly JournalPostType[] = ["release", "spotlight", "launch"];

export const DEFAULT_AUTHOR: JournalAuthor = {
  name: "Toone Content",
  type: "Organization",
  url: "/en/editorial-policy",
};

/** True when `value` may be sent to `GET /posts/{id-or-slug}` at all. */
export function isPostParam(value: string): boolean {
  if (value.length > 80 && !POST_ID.test(value)) return false;
  return POST_ID.test(value) || (value.length >= 3 && JOURNAL_SLUG.test(value));
}

/** Absolute URL of an API-relative asset path, or null when the path is unsafe. */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path || !ASSET_PATH.test(path)) return null;
  return `${journalApiBase()}/${path}`;
}

/* ---------- normalizers ---------- */

type Raw = Record<string, unknown>;
const isObject = (value: unknown): value is Raw =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";
const positiveInt = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
const isDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function normalizeAuthor(raw: unknown): JournalAuthor {
  if (!isObject(raw) || !text(raw.name)) return DEFAULT_AUTHOR;
  const url = text(raw.url);
  return {
    name: text(raw.name),
    type: raw.type === "Person" ? "Person" : "Organization",
    // Only site-relative or https URLs are ever linked (§6.1 link rules).
    url: /^\/(?!\/)/.test(url) || /^https:\/\//.test(url) ? url : null,
  };
}

function normalizeRelease(raw: unknown): JournalRelease | null {
  if (!isObject(raw) || !VERSION.test(text(raw.version))) return null;
  const channels = Array.isArray(raw.channels)
    ? raw.channels.filter(
        (channel): channel is JournalRelease["channels"][number] =>
          channel === "direct" || channel === "appstore",
      )
    : [];
  return { version: text(raw.version), channels: [...new Set(channels)] };
}

function normalizeCover(raw: unknown): JournalCover | null {
  if (!isObject(raw)) return null;
  const url = text(raw.url);
  const width = positiveInt(raw.width);
  const height = positiveInt(raw.height);
  if (!ASSET_PATH.test(url) || !width || !height) return null;
  return { url, alt: text(raw.alt), width, height };
}

function normalizeExploreRefs(raw: unknown): JournalExploreRef[] {
  if (!Array.isArray(raw)) return [];
  const refs: JournalExploreRef[] = [];
  for (const item of raw) {
    if (!isObject(item)) continue;
    const type = item.type === "routine" || item.type === "bundle" ? item.type : null;
    const slug = text(item.slug);
    const id = text(item.id);
    if (!type || !EXPLORE_SLUG_OR_ID.test(slug) || slug.length > 128) continue;
    const idPattern = type === "routine" ? /^wfl_[a-z0-9]{8,32}$/ : /^wfb_[a-z0-9]{8,32}$/;
    refs.push({ type, slug, id: idPattern.test(id) ? id : "" });
  }
  return refs;
}

/** Allow-list projection of a §7 PostEntry; null when unusable. */
export function normalizePostEntry(raw: unknown): JournalPostEntry | null {
  if (!isObject(raw)) return null;
  const type = POST_TYPES.includes(raw.type as JournalPostType)
    ? (raw.type as JournalPostType)
    : null;
  const entry = {
    post_id: text(raw.post_id),
    slug: text(raw.slug),
    type,
    title: text(raw.title),
    heading: text(raw.heading),
    description: text(raw.description),
    author: normalizeAuthor(raw.author),
    // An unknown value still discloses: never claim "none" by default.
    assistance: (["none", "assisted", "drafted"] as const).find((value) => value === raw.assistance) ?? "assisted",
    release: normalizeRelease(raw.release),
    cover: normalizeCover(raw.cover),
    explore_refs: normalizeExploreRefs(raw.explore_refs),
    read_minutes: positiveInt(raw.read_minutes) ?? 1,
    published_at: isDate(raw.published_at) ? raw.published_at : "",
    updated_at: isDate(raw.updated_at) ? raw.updated_at : "",
  };
  if (!type || !POST_ID.test(entry.post_id) || !JOURNAL_SLUG.test(entry.slug)) return null;
  if (!entry.title || !entry.heading || !entry.published_at) return null;
  if (!entry.updated_at) entry.updated_at = entry.published_at;
  return { ...entry, type };
}

function normalizeAssets(raw: unknown): Record<string, JournalAsset> {
  const assets: Record<string, JournalAsset> = {};
  if (!isObject(raw)) return assets;
  for (const [id, value] of Object.entries(raw)) {
    if (!ASSET_ID.test(id) || !isObject(value)) continue;
    const url = text(value.url);
    const width = positiveInt(value.width);
    const height = positiveInt(value.height);
    if (!ASSET_PATH.test(url) || !width || !height) continue;
    assets[id] = { url, width, height, content_type: text(value.content_type) };
  }
  return assets;
}

/** Allow-list projection of a §7 PostDetail; null when unusable. */
export function normalizePostDetail(raw: unknown): JournalPostDetail | null {
  const entry = normalizePostEntry(raw);
  if (!entry || !isObject(raw)) return null;
  const body = typeof raw.body === "string" ? raw.body : "";
  if (!body.trim()) return null;
  const keywords = isObject(raw.keywords) ? raw.keywords : {};
  return {
    ...entry,
    revision_id: text(raw.revision_id),
    content_hash: text(raw.content_hash),
    body,
    keywords: {
      primary: text(keywords.primary),
      secondary: Array.isArray(keywords.secondary)
        ? keywords.secondary.map(text).filter(Boolean).slice(0, 8)
        : [],
    },
    assets: normalizeAssets(raw.assets),
  };
}

function normalizeFeedItem(raw: unknown): JournalFeedItem | null {
  if (!isObject(raw)) return null;
  const state = (["draft", "published", "retired"] as JournalState[]).find(
    (value) => value === raw.state,
  );
  const type = POST_TYPES.find((value) => value === raw.type);
  const item = {
    post_id: text(raw.post_id),
    slug: text(raw.slug),
    published_at: isDate(raw.published_at) ? raw.published_at : "",
    updated_at: isDate(raw.updated_at) ? raw.updated_at : "",
    retired_at: isDate(raw.retired_at) ? raw.retired_at : null,
  };
  if (!state || !type || !POST_ID.test(item.post_id) || !JOURNAL_SLUG.test(item.slug)) return null;
  if (!item.published_at) return null;
  return { ...item, type, state, updated_at: item.updated_at || item.published_at };
}

/* ---------- fetchers ---------- */

function envelopeData(path: string, status: number, body: unknown): unknown {
  if (!isObject(body) || !("data" in body)) {
    throw new JournalApiError(path, status, "response has no data envelope");
  }
  return body.data;
}

function errorMessage(body: unknown, fallback: string): string {
  return isObject(body) && typeof body.message === "string" ? body.message : fallback;
}

export type ListPostsQuery = {
  type?: JournalPostType;
  /** An Explore slug or id: posts whose live revision references it. */
  explore?: string;
  limit?: number;
  offset?: number;
};

/**
 * `GET /v1/journal/posts` (§7.1). A 404 means the deployed server does not
 * serve the Journal yet and reads as an empty list (`available: false`);
 * any other failure throws.
 */
export async function listPosts(
  query: ListPostsQuery = {},
): Promise<JournalListResult & { available: boolean }> {
  const response = await journalSource().get("journal/posts", {
    query: {
      type: query.type,
      explore: query.explore,
      limit: query.limit ?? JOURNAL_PAGE_SIZE,
      offset: query.offset || undefined,
    },
    tags: [JOURNAL_TAG],
    collection: true,
  });
  if (response.status === 404) return { items: [], total: 0, available: false };
  if (response.status !== 200) {
    throw new JournalApiError("journal/posts", response.status, errorMessage(response.body, "list failed"));
  }
  const data = envelopeData("journal/posts", 200, response.body);
  if (!Array.isArray(data)) throw new JournalApiError("journal/posts", 502, "expected array");
  const items = data.map(normalizePostEntry).filter((item): item is JournalPostEntry => !!item);
  return { items, total: response.total ?? items.length, available: true };
}

/**
 * `GET /v1/journal/posts/{id-or-slug}` (§7.1, §7.2). Tagged `journal` and
 * `journal:{slug}` so a publish, update or retirement expires it.
 */
export async function getPost(idOrSlug: string): Promise<JournalPostLookup> {
  if (!isPostParam(idOrSlug)) return { kind: "missing" };
  const path = `journal/posts/${encodeURIComponent(idOrSlug)}`;
  const response = await journalSource().get(path, {
    tags: [JOURNAL_TAG, journalPostTag(idOrSlug)],
  });
  if (response.status === 404) return { kind: "missing" };
  if (response.status === 410) {
    const redirect = isObject(response.body) ? text(response.body.redirect_slug) : "";
    return {
      kind: "gone",
      redirectSlug: redirect && JOURNAL_SLUG.test(redirect) && redirect !== idOrSlug ? redirect : null,
    };
  }
  if (response.status !== 200) {
    throw new JournalApiError(path, response.status, errorMessage(response.body, "detail failed"));
  }
  const post = normalizePostDetail(envelopeData(path, 200, response.body));
  if (!post) throw new JournalApiError(path, 502, "invalid post detail");
  return { kind: "post", post };
}

/** `GET /v1/journal/previews/{token}` (§7.1): never cached; null when unknown or expired. */
export async function getPreview(token: string): Promise<JournalPreview | null> {
  if (!PREVIEW_TOKEN.test(token)) return null;
  const path = `journal/previews/${encodeURIComponent(token)}`;
  const response = await journalSource().get(path, { noStore: true });
  if (response.status === 404 || response.status === 410) return null;
  if (response.status !== 200) {
    throw new JournalApiError("journal/previews", response.status, errorMessage(response.body, "preview failed"));
  }
  const raw = envelopeData("journal/previews", 200, response.body);
  // A draft has never been published, so it has no dates yet; the preview
  // still needs to render, dated "now".
  const now = new Date().toISOString();
  const dated = isObject(raw)
    ? { ...raw, published_at: isDate(raw.published_at) ? raw.published_at : now }
    : raw;
  const post = normalizePostDetail(dated);
  if (!post || !isObject(raw)) throw new JournalApiError("journal/previews", 502, "invalid preview");
  const state = (["draft", "published", "retired"] as JournalState[]).find((value) => value === raw.state);
  return { ...post, preview: true, state: state ?? "draft" };
}

/**
 * `GET /v1/journal/feed` (§7.1): every post that was ever published, retired
 * included. `null` when the route is not served yet (404); outages throw.
 */
export async function getJournalFeed(since?: string): Promise<JournalFeedItem[] | null> {
  const response = await journalSource().get("journal/feed", {
    query: { since },
    tags: [JOURNAL_TAG],
    collection: true,
  });
  if (response.status === 404) return null;
  if (response.status !== 200) {
    throw new JournalApiError("journal/feed", response.status, errorMessage(response.body, "feed failed"));
  }
  const data = envelopeData("journal/feed", 200, response.body);
  const items = Array.isArray(data) ? data : isObject(data) && Array.isArray(data.items) ? data.items : null;
  if (!items) throw new JournalApiError("journal/feed", 502, "expected feed");
  return items.map(normalizeFeedItem).filter((item): item is JournalFeedItem => !!item);
}

/**
 * Up to `limit` posts that feature an Explore record, for its detail page.
 * Best effort: any failure (including a server without the Journal) is an
 * empty list, so the Explore page never depends on the Journal being up.
 */
export async function getPostsFeaturing(
  exploreSlugOrId: string,
  limit = 3,
): Promise<JournalPostEntry[]> {
  if (!EXPLORE_SLUG_OR_ID.test(exploreSlugOrId) || exploreSlugOrId.length > 128) return [];
  try {
    const { items } = await listPosts({ explore: exploreSlugOrId, limit });
    return items.slice(0, limit);
  } catch (error) {
    console.warn(
      "[journal] featured posts unavailable",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** Newest `limit` posts for cross-links (resources page); empty on any failure. */
export async function getLatestPosts(limit = 3): Promise<JournalPostEntry[]> {
  try {
    const { items } = await listPosts({ limit });
    return items.slice(0, limit);
  } catch (error) {
    console.warn("[journal] latest posts unavailable", error instanceof Error ? error.message : error);
    return [];
  }
}
