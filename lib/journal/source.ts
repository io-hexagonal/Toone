/**
 * Transport for the public Journal API (contract §3, §7.1, §10).
 *
 * `JournalSource` isolates HTTP from the normalizers in `./data`, so the
 * fetchers can be exercised against an in-memory source and the transport can
 * change (another base URL, a different cache) without touching a page.
 *
 * The HTTP source follows the Explore fetcher (`lib/explore/data.ts`):
 * versioned base from `EXPLORE_API_BASE_URL`, `{data}` envelope, `X-Total-Count`,
 * an 8-second timeout, and Next's data cache (`revalidate: 600`, tags
 * `journal` / `journal:{slug}`) so the signed webhook can expire responses on
 * publish. Two in-process memos sit beside the data cache, as in Explore:
 *
 * - `notServed`: a collection route that answered 404 (the deployed server
 *   predates the Journal) is not asked again for five minutes. Detail routes
 *   are never memoized this way: a 404 there means "unknown post", and a post
 *   published a minute later must render as soon as the webhook lands.
 * - `lastGood`: the last 200 per URL. When upstream answers 429, 5xx or does
 *   not answer at all, the last good response is served instead of failing.
 *
 * Both are per warm instance (Vercel functions do not share memory) and are
 * cleared by the webhook through `resetJournalMemo`.
 */

export const JOURNAL_REVALIDATE_SECONDS = 600;
export const JOURNAL_TAG = "journal";

const DEFAULT_API_BASE = "https://api.trytoone.com/v1";

/** Versioned API base without a trailing slash (shared with Explore, §3). */
export function journalApiBase(): string {
  const raw = process.env.EXPLORE_API_BASE_URL?.trim() || DEFAULT_API_BASE;
  return raw.replace(/\/+$/, "");
}

export function journalPostTag(slug: string): string {
  return `${JOURNAL_TAG}:${slug}`;
}

export type JournalRequest = {
  query?: Record<string, string | number | undefined>;
  /** Next data-cache tags; ignored when `noStore` is set. */
  tags?: string[];
  /** Previews are never cached anywhere (§3: `no-store`). */
  noStore?: boolean;
  /** Collection routes memoize a 404 as "route not served yet". */
  collection?: boolean;
};

/**
 * One API answer. `status` is the HTTP status (404 and 410 are answers, not
 * failures); `body` is the parsed JSON (the whole envelope, or the error
 * object); `total` is `X-Total-Count` when present.
 */
export type JournalResponse = { status: number; body: unknown; total: number | null };

export interface JournalSource {
  get(path: string, request?: JournalRequest): Promise<JournalResponse>;
}

export class JournalApiError extends Error {
  status: number;
  path: string;

  constructor(path: string, status: number, message: string) {
    super(`Journal API ${status} on ${path}: ${message}`);
    this.name = "JournalApiError";
    this.status = status;
    this.path = path;
  }
}

const NEGATIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_LIMIT = 200;
const LAST_GOOD_LIMIT = 300;

type JournalMemo = {
  notServed: Map<string, number>;
  lastGood: Map<string, JournalResponse>;
};
/** Shared across route chunks in one process (see `lib/explore/data.ts`). */
const MEMO_KEY = Symbol.for("toone.journal.memo");
const memo: JournalMemo = ((globalThis as Record<symbol, unknown>)[MEMO_KEY] ??= {
  notServed: new Map<string, number>(),
  lastGood: new Map<string, JournalResponse>(),
}) as JournalMemo;

function remember<K, V>(map: Map<K, V>, key: K, value: V, limit: number) {
  map.delete(key);
  map.set(key, value);
  while (map.size > limit) {
    const oldest = map.keys().next().value as K;
    map.delete(oldest);
  }
}

/** Clears both memos (called by the webhook handler and between tests). */
export function resetJournalMemo(): void {
  memo.notServed.clear();
  memo.lastGood.clear();
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const httpJournalSource: JournalSource = {
  async get(path, request = {}) {
    const url = new URL(`${journalApiBase()}/${path}`);
    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    const routeKey = `${url.origin}${url.pathname}`;
    if (request.collection) {
      const until = memo.notServed.get(routeKey);
      if (until !== undefined) {
        if (until > Date.now()) return { status: 404, body: null, total: null };
        memo.notServed.delete(routeKey);
      }
    }

    const fallback = (reason: string): JournalResponse | null => {
      if (request.noStore) return null;
      const previous = memo.lastGood.get(url.href);
      if (previous) console.warn(`[journal] ${reason} on ${url.pathname}; serving last good response`);
      return previous ?? null;
    };

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        ...(request.noStore
          ? { cache: "no-store" as const }
          : { next: { revalidate: JOURNAL_REVALIDATE_SECONDS, tags: request.tags ?? [JOURNAL_TAG] } }),
      });
    } catch (error) {
      const previous = fallback("network failure");
      if (previous) return previous;
      throw new JournalApiError(
        url.pathname,
        0,
        error instanceof Error ? error.message : "network failure",
      );
    }

    if (response.status === 404 && request.collection) {
      remember(memo.notServed, routeKey, Date.now() + NEGATIVE_TTL_MS, NEGATIVE_LIMIT);
    }
    if (response.status === 429 || response.status >= 500) {
      const previous = fallback(`upstream ${response.status}`);
      if (previous) return previous;
    }

    const body = await readJson(response);
    const totalHeader = response.headers.get("x-total-count");
    const parsedTotal = totalHeader === null ? Number.NaN : Number.parseInt(totalHeader, 10);
    const result: JournalResponse = {
      status: response.status,
      body,
      total: Number.isFinite(parsedTotal) && parsedTotal >= 0 ? parsedTotal : null,
    };
    if (response.status === 200 && !request.noStore) {
      remember(memo.lastGood, url.href, result, LAST_GOOD_LIMIT);
    }
    return result;
  },
};

let activeSource: JournalSource = httpJournalSource;

/** The transport the fetchers use. */
export function journalSource(): JournalSource {
  return activeSource;
}

/** Swap the transport (tests); `null` restores HTTP. */
export function setJournalSource(source: JournalSource | null): void {
  activeSource = source ?? httpJournalSource;
}
