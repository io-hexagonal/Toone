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
 */
export function exploreOutage(where: string, error: unknown): never {
  console.error(`[explore] ${where} unavailable`, error instanceof Error ? error.name : "unknown");
  throw error instanceof Error ? error : new Error(`[explore] ${where} unavailable`);
}
