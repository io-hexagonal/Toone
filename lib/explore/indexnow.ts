import { getBundle, getRoutine, resolveSlug } from "./data";
import { isExploreIndexable, SITE } from "./presentation";
import type { RevalidateEvent } from "./types";
import { submitToIndexNow } from "../indexnow/submit";

/**
 * IndexNow on approval (CONTENT-022 v1.7.0, AUTH-013).
 *
 * After the signed webhook expires the caches, an approved or changed record
 * that is indexable has its English URL submitted to IndexNow, so Bing, Yandex
 * and the other participating engines fetch the fresh `index, follow` page.
 * Records a reviewer set to `noindex` are never submitted.
 *
 * Off unless `EXPLORE_INDEXNOW_ON_APPROVAL=true`. Since 2026-11 the site-wide
 * deploy notice (`scripts/indexnow/notify-site.ts`) sends changed Explore
 * record URLs from `/sitemap-explore.xml` once each, so turning this on as
 * well would send a record twice (AUTH-013). Leave it off while that runs.
 */
export { INDEXNOW_KEY, submitToIndexNow } from "../indexnow/submit";

const SUBMIT_EVENTS = new Set<RevalidateEvent["event"]>(["approved", "repinned", "listing_changed"]);

export function indexNowOnApprovalEnabled(): boolean {
  return process.env.EXPLORE_INDEXNOW_ON_APPROVAL === "true";
}

/** The English record URL to submit, or null when the event or record does not qualify. */
export async function indexNowUrlFor(event: RevalidateEvent): Promise<string | null> {
  if (!SUBMIT_EVENTS.has(event.event)) return null;
  const detail = event.type === "routine" ? await getRoutine(event.id) : await getBundle(event.id);
  if (!detail || !isExploreIndexable(detail)) return null;
  return `${SITE}/en/explore/${event.type}s/${resolveSlug(detail)}`;
}

/** Best effort: failures are logged, never surfaced to the webhook caller. */
export async function submitApprovedRecord(event: RevalidateEvent): Promise<void> {
  try {
    const url = await indexNowUrlFor(event);
    if (!url) return;
    const status = await submitToIndexNow([url]);
    const log = status === 200 || status === 202 ? console.info : console.warn;
    log(`[indexnow] ${event.event} ${url} -> ${status}`);
  } catch (error) {
    console.warn("[indexnow] submission failed", error instanceof Error ? error.message : error);
  }
}
