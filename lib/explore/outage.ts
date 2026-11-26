import { notFound } from "next/navigation";
import type { ExploreApiError } from "./data";

/**
 * Matched by name, not `instanceof`: Next can bundle `data.ts` more than once
 * in a build (one copy per route chunk), and an error from another copy must
 * still be recognised.
 */
function asExploreApiError(error: unknown): ExploreApiError | null {
  return error instanceof Error &&
    (error.name === "ExploreApiError" || error.name === "ExploreInvalidRecordError") &&
    typeof (error as ExploreApiError).status === "number"
    ? (error as ExploreApiError)
    : null;
}

/**
 * True when an Explore API failure means "this record does not exist for the
 * public site", not "the API is down" (TECH-023: unknown, removed or
 * unapproved records answer 404/410, never a shell and never a 5xx).
 *
 * - An upstream 4xx other than 408 (request timeout) and 429 (rate limit) is
 *   the API's answer about this one record (400 bad id, 403 not public,
 *   410 removed, 422 ...). Retrying will not change it, so a 5xx would only
 *   make Google re-crawl a URL that never recovers, and many of them slow the
 *   crawl of the whole site.
 * - A record the API returned with a 200 but in a shape the site cannot
 *   render (`ExploreInvalidRecordError`, "invalid routine detail") is a bad
 *   record, not an outage: the HTTP call worked, and the same bytes will come
 *   back on every retry until someone fixes the record. A 404 lets the URL
 *   drop out; it comes back by itself once the record is fixed and the
 *   approval webhook expires its cache.
 *
 * Everything else stays an outage: 5xx, 408, 429, timeouts and network
 * errors, a body that is not JSON or has no `{data}` envelope (a proxy error
 * page), and collection-level errors.
 */
export function isExploreRecordGone(error: unknown): boolean {
  const api = asExploreApiError(error);
  if (!api) return false;
  if (api.name === "ExploreInvalidRecordError") return true;
  return api.status >= 400 && api.status < 500 && api.status !== 408 && api.status !== 429;
}

/**
 * An Explore API failure on an indexable page (A8, TECH-023).
 *
 * The data layer already answers from Next's data cache and the last-good memo
 * (lib/explore/data.ts) while it can, so this only runs on a cold miss. The
 * page used to answer that with "Explore is temporarily unavailable" as a 200
 * with `noindex`: to Google, an indexable URL that had just asked to be
 * dropped. Rethrowing lets the error reach Next.js, which answers with a
 * server error instead. A 5xx tells crawlers to come back later and keeps the
 * URL's index state (https://developers.google.com/search/docs/crawling-indexing/http-network-errors).
 *
 * Next.js 16 pages cannot pick 503 (only route handlers and the proxy set an
 * arbitrary status; `app-render` answers an uncaught render error with 500),
 * and a proxy health probe would also block pages the data cache can still
 * serve, so the status is 500. Google treats 500 and 503 alike.
 *
 * `record: true` marks a single-record page (routine or bundle detail): there
 * a failure that `isExploreRecordGone` reads as "no such record" answers
 * 404 through `notFound()` instead. Collection pages (the hub and topic pages)
 * leave it off on purpose: their URL exists because of the taxonomy, not
 * because of one record, so a 4xx from a list call means the site and the API
 * disagree about the request (a contract change, a misconfigured base URL, a
 * firewall). A 404 there would ask Google to drop every such page at once;
 * a 500 keeps them indexed and is fixed by the next deploy.
 */
export function exploreOutage(
  where: string,
  error: unknown,
  options: { record?: boolean } = {},
): never {
  if (options.record && isExploreRecordGone(error)) {
    console.warn(
      `[explore] ${where} not found upstream`,
      `${asExploreApiError(error)?.name} ${asExploreApiError(error)?.status}`,
    );
    notFound();
  }
  console.error(`[explore] ${where} unavailable`, error instanceof Error ? error.name : "unknown");
  throw error instanceof Error ? error : new Error(`[explore] ${where} unavailable`);
}
