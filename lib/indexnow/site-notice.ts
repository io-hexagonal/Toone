import { JOURNAL_HUBS, JOURNAL_URL, listPath } from "../journal/presentation";
import { BASELINE_SENT_AT, BASELINE_URLS } from "./baseline";
import { INDEXNOW_SITE } from "./submit";

/**
 * IndexNow notice after each production deploy (AUTH-013, owner decision
 * 2026-11-02: "the whole site, every deploy").
 *
 * After trytoone.com goes live, the live sitemaps are read and every URL whose
 * `<lastmod>` is new or later than the `lastmod` it was last sent with is
 * checked on the live site and sent once. The record of what was sent is
 * carried from run to run, so an unchanged URL is never sent again.
 *
 * Left out on purpose:
 * - `/en/journal` and Journal posts: the Journal webhook already sends them
 *   on every publish (`lib/journal/indexnow.ts`). The hub pages
 *   (`/en/journal/releases` …) are not sent by the webhook, so they stay in.
 * - Any URL with no `lastmod` (for example a CLI deploy with no git history,
 *   PR #74): no date means no proof of change, so nothing is sent for it.
 */

export const NOTICE_SITEMAPS = [
  `${INDEXNOW_SITE}/sitemap.xml`,
  `${INDEXNOW_SITE}/sitemap-explore.xml`,
  `${INDEXNOW_SITE}/sitemap-journal.xml`,
] as const;

export type SitemapEntry = { url: string; lastmod: string | null };

export type SentRecord = { lastmod: string; sentAt: string };

export type NoticeState = {
  version: 1;
  /** URL -> the `lastmod` it was last sent with, and when. */
  sent: Record<string, SentRecord>;
};

export type Selection = {
  send: { url: string; lastmod: string; previous: SentRecord | null }[];
  unchanged: string[];
  noLastmod: string[];
  journalWebhook: string[];
  offSite: string[];
};

const decode = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** `<url>` entries of a sitemap `urlset`, in file order. */
export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const [, body] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = body.match(/<loc>\s*([^<]+?)\s*<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = body.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1] ?? null;
    entries.push({ url: decode(loc), lastmod: lastmod ? decode(lastmod) : null });
  }
  return entries;
}

const JOURNAL_HUB_URLS = new Set(JOURNAL_HUBS.map((hub) => `${INDEXNOW_SITE}${listPath(hub)}`));

/** `/en/journal` and post URLs, which the Journal webhook sends itself. */
export function sentByJournalWebhook(url: string): boolean {
  if (url === JOURNAL_URL) return true;
  return url.startsWith(`${JOURNAL_URL}/`) && !JOURNAL_HUB_URLS.has(url);
}

/** The record used when no earlier deploy notice exists: the 2026-11-02 manual send. */
export function baselineState(): NoticeState {
  const sent: Record<string, SentRecord> = {};
  for (const url of BASELINE_URLS) sent[url] = { lastmod: BASELINE_SENT_AT, sentAt: BASELINE_SENT_AT };
  return { version: 1, sent };
}

export function parseState(raw: string): NoticeState {
  const value = JSON.parse(raw) as NoticeState;
  if (value?.version !== 1 || typeof value.sent !== "object" || value.sent === null) {
    throw new Error("IndexNow notice record has an unknown shape");
  }
  for (const [url, record] of Object.entries(value.sent)) {
    if (!Number.isFinite(Date.parse(record?.lastmod)) || !Number.isFinite(Date.parse(record?.sentAt))) {
      throw new Error(`IndexNow notice record entry is invalid: ${url}`);
    }
  }
  return value;
}

/**
 * Which sitemap URLs to send. A URL qualifies when it is on trytoone.com, is
 * not sent by the Journal webhook, has a valid `lastmod`, and either was never
 * sent or now has a `lastmod` later than the one it was last sent with.
 * Duplicate `<loc>`s count once.
 */
export function selectChanged(entries: SitemapEntry[], state: NoticeState): Selection {
  const selection: Selection = { send: [], unchanged: [], noLastmod: [], journalWebhook: [], offSite: [] };
  const seen = new Set<string>();
  for (const { url, lastmod } of entries) {
    if (seen.has(url)) continue;
    seen.add(url);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      selection.offSite.push(url);
      continue;
    }
    if (parsed.origin !== INDEXNOW_SITE) {
      selection.offSite.push(url);
      continue;
    }
    if (sentByJournalWebhook(url)) {
      selection.journalWebhook.push(url);
      continue;
    }
    if (!lastmod || !Number.isFinite(Date.parse(lastmod))) {
      selection.noLastmod.push(url);
      continue;
    }
    const previous = state.sent[url] ?? null;
    if (previous && Date.parse(lastmod) <= Date.parse(previous.lastmod)) {
      selection.unchanged.push(url);
      continue;
    }
    selection.send.push({ url, lastmod, previous });
  }
  return selection;
}

/** A copy of the record with the accepted URLs marked as sent. */
export function markSent(
  state: NoticeState,
  sent: { url: string; lastmod: string }[],
  sentAt: string,
): NoticeState {
  const next: NoticeState = { version: 1, sent: { ...state.sent } };
  for (const { url, lastmod } of sent) next.sent[url] = { lastmod, sentAt };
  return next;
}

/* ---------- live check ---------- */

export type LiveCheck = { url: string; ok: boolean; reason: string };

const NOINDEX = /(^|[\s,])(noindex|none)([\s,]|$)/i;

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!match) return null;
  return decode(match[2] ?? match[3] ?? match[4] ?? "");
}

/**
 * Pass/fail for one URL on the live site: 200 with no redirect, no `noindex`
 * in `X-Robots-Tag` or a robots meta tag, and exactly one canonical equal to
 * the URL itself (TECH-010, TECH-013). Anything else is dropped and logged.
 */
export async function checkLive(url: string, fetchImpl: typeof fetch = fetch): Promise<LiveCheck> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": "TooneIndexNowCheck/1.0 (+https://trytoone.com)", Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    return { url, ok: false, reason: `fetch failed: ${error instanceof Error ? error.message : error}` };
  }
  if (response.status !== 200) {
    const location = response.headers.get("location");
    return { url, ok: false, reason: `HTTP ${response.status}${location ? ` -> ${location}` : ""}` };
  }
  const robotsHeader = response.headers.get("x-robots-tag") ?? "";
  if (NOINDEX.test(robotsHeader)) return { url, ok: false, reason: `X-Robots-Tag: ${robotsHeader}` };

  const html = await response.text();
  const head = html.slice(0, html.search(/<\/head>/i) >= 0 ? html.search(/<\/head>/i) : html.length);
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = attribute(tag, "name")?.toLowerCase();
    if (name !== "robots" && name !== "bingbot") continue;
    const content = attribute(tag, "content") ?? "";
    if (NOINDEX.test(content)) return { url, ok: false, reason: `meta ${name}: ${content}` };
  }
  const canonicals = (head.match(/<link\b[^>]*>/gi) ?? [])
    .filter((tag) => (attribute(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((tag) => attribute(tag, "href"));
  if (canonicals.length === 0) return { url, ok: false, reason: "no canonical" };
  if (canonicals.length > 1) return { url, ok: false, reason: `${canonicals.length} canonicals` };
  if (canonicals[0] !== url) return { url, ok: false, reason: `canonical is ${canonicals[0]}` };
  return { url, ok: true, reason: "200, indexable, self-canonical" };
}

/* ---------- readable record ---------- */

export type RunRecord = {
  startedAt: string;
  trigger: string;
  dryRun: boolean;
  selection: Selection;
  dropped: LiveCheck[];
  submitted: string[];
  status: number | null;
  error: string | null;
};

/** One Markdown section per run: time, URLs, HTTP status, and what was left out and why. */
export function renderRun(run: RunRecord): string {
  const lines = [`## ${run.startedAt} (${run.trigger}${run.dryRun ? ", dry run: nothing sent" : ""})`, ""];
  if (run.submitted.length > 0) {
    const verdict = run.dryRun
      ? "would be sent"
      : run.status === 200 || run.status === 202
        ? `sent, IndexNow answered HTTP ${run.status}`
        : `send failed (${run.error ?? `HTTP ${run.status}`}); these stay unsent and are retried next run`;
    lines.push(`**${run.submitted.length} URL(s) ${verdict}:**`, "");
    for (const url of run.submitted) lines.push(`- ${url}`);
  } else {
    lines.push(run.error ? `**Nothing sent: ${run.error}**` : "**Nothing sent: no URL changed since its last notice.**");
  }
  lines.push("");
  if (run.dropped.length > 0) {
    lines.push(`Dropped by the live check (${run.dropped.length}, retried next run):`, "");
    for (const check of run.dropped) lines.push(`- ${check.url}: ${check.reason}`);
    lines.push("");
  }
  const { unchanged, noLastmod, journalWebhook, offSite } = run.selection;
  lines.push(
    `Not sent: ${unchanged.length} unchanged, ${journalWebhook.length} left to the Journal webhook, ` +
      `${noLastmod.length} with no lastmod, ${offSite.length} off-site.`,
  );
  for (const url of noLastmod) lines.push(`- no lastmod: ${url}`);
  for (const url of offSite) lines.push(`- off-site: ${url}`);
  lines.push("");
  return lines.join("\n");
}
