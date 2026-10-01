import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { resetExploreMemo } from "@/lib/explore/api";
import {
  indexNowOnApprovalEnabled,
  submitApprovedRecord,
} from "@/lib/explore/indexnow";
import {
  parseRevalidateEvent,
  verifySignature,
} from "@/lib/explore/revalidation";
import { resetJournalMemo } from "@/lib/journal/source";
import { isJournalPayload, parseJournalEvent } from "@/lib/journal/revalidation";
import { journalIndexNowEnabled, submitJournalEvent } from "@/lib/journal/indexnow";

/**
 * Server -> web revalidation webhook (Explore contract §9, Journal contract §9).
 * 401 on a missing or wrong signature, 400 on a signed but malformed body,
 * 413 on an oversized body, 503 when the secret is not configured.
 *
 * Both products share the URL, secret and signature. A signed body with
 * `"type": "journal"` is routed to the Journal branch; every other body takes
 * the Explore path exactly as before.
 */

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.EXPLORE_REVALIDATE_SECRET;
  if (!secret) return Response.json({ revalidated: false }, { status: 503 });
  // Bound even chunked request bodies before buffering them in memory.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ revalidated: false }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 8192) {
      await reader.cancel();
      return Response.json({ revalidated: false }, { status: 413 });
    }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!verifySignature(raw, request.headers.get("x-explore-signature"), secret))
    return Response.json({ revalidated: false }, { status: 401 });
  if (isJournalPayload(raw)) {
    const journal = parseJournalEvent(raw);
    if (!journal) return Response.json({ revalidated: false }, { status: 400 });
    resetJournalMemo();
    // The post itself is expired outright: its next request blocks on a
    // fresh read, so an update or retirement is never served stale.
    revalidateTag(`journal:${journal.slug}`, { expire: 0 });
    revalidateTag(`journal:${journal.id}`, { expire: 0 });
    // The broad tag is only marked stale ("max": stale-while-revalidate).
    // Besides the Journal it tags every Explore detail page's "Featured in
    // the Journal" read; those may show the old list once while they
    // re-render in the background rather than all block on the API.
    revalidateTag("journal", "max");
    // The surfaces that must show a new post on their very next request are
    // expired by path instead. `revalidatePath` takes no profile and expires
    // immediately, both the cached render and, through the route's implicit
    // tags, every data-cache entry read while rendering it: the Journal
    // segment (index, hubs, their pages, posts), the RSS feed, the Journal
    // sitemap and `/resources` (latest posts).
    //
    // This is also what refreshes a list rendered while the server did not
    // serve the Journal yet. Next 16 collects a fetch's `next.tags` onto the
    // render before the request, whatever the status (see patch-fetch), but
    // `lib/journal/source.ts` answers a memoized collection 404 ("route not
    // served yet", five minutes) without calling `fetch` at all, so such a
    // render carries no `journal` tag for `revalidateTag` to find.
    revalidatePath("/[locale]/journal", "layout");
    revalidatePath("/[locale]/resources", "page");
    revalidatePath("/journal/feed.xml");
    revalidatePath("/sitemap-journal.xml");
    if (journalIndexNowEnabled()) after(() => submitJournalEvent(journal));
    return Response.json({ revalidated: true });
  }
  const event = parseRevalidateEvent(raw);
  if (!event) return Response.json({ revalidated: false }, { status: 400 });
  // The in-memory memos (negative "route not served" + last-good fallback)
  // live outside Next's cache, so the webhook clears them explicitly too.
  resetExploreMemo();
  revalidateTag("explore", { expire: 0 });
  revalidateTag(`explore:${event.slug}`, { expire: 0 });
  revalidateTag(`explore:${event.id}`, { expire: 0 });
  // Runs after the response, against the freshly expired caches.
  if (indexNowOnApprovalEnabled()) after(() => submitApprovedRecord(event));
  return Response.json({ revalidated: true });
}
