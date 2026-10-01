import { submitToIndexNow } from "../explore/indexnow";
import { JOURNAL_URL, postUrl } from "./presentation";
import type { JournalRevalidateEvent } from "./types";

/**
 * IndexNow for the Journal (contract §9). After the webhook expires the
 * caches, the post URL and the Journal index are submitted, reusing the
 * Explore key and endpoint. Retirements are submitted too: IndexNow accepts
 * removed URLs, and the engines then see the 404 or the 308.
 *
 * On unless `JOURNAL_INDEXNOW=false` (unlike Explore, which is opt-in): a
 * Journal post is written to be found.
 */
export function journalIndexNowEnabled(): boolean {
  return process.env.JOURNAL_INDEXNOW?.trim().toLowerCase() !== "false";
}

export function journalIndexNowUrls(event: Pick<JournalRevalidateEvent, "slug">): string[] {
  return [postUrl(event.slug), JOURNAL_URL];
}

/** Best effort: failures are logged, never surfaced to the webhook caller. */
export async function submitJournalEvent(event: JournalRevalidateEvent): Promise<void> {
  try {
    const urls = journalIndexNowUrls(event);
    const status = await submitToIndexNow(urls);
    const log = status === 200 || status === 202 ? console.info : console.warn;
    log(`[indexnow] journal ${event.event} ${urls.join(" ")} -> ${status}`);
  } catch (error) {
    console.warn("[indexnow] journal submission failed", error instanceof Error ? error.message : error);
  }
}
