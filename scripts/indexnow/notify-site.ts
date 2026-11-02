/**
 * IndexNow notice for trytoone.com after a production deploy.
 * Run by `.github/workflows/indexnow-site.yml`; see `lib/indexnow/site-notice.ts`.
 *
 *   node --import tsx scripts/indexnow/notify-site.ts \
 *     --state-in <record.json | baseline> --out <dir> [--log-in <log.md>] \
 *     [--trigger "<text>"] [--dry-run]
 *
 * Writes `<dir>/state.json` (what has been sent) and `<dir>/log.md` (every run,
 * newest first). Exit 1 when the record cannot be read, a sitemap cannot be
 * read, or IndexNow rejects the send. Nothing is written in the first two
 * cases, so the previous record stays the latest one.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  NOTICE_SITEMAPS,
  baselineState,
  checkLive,
  markSent,
  parseSitemap,
  parseState,
  renderRun,
  selectChanged,
  type LiveCheck,
  type NoticeState,
  type RunRecord,
  type SitemapEntry,
} from "../../lib/indexnow/site-notice";
import { submitToIndexNow } from "../../lib/indexnow/submit";

const LOG_HEADER =
  "# IndexNow deploy notices for trytoone.com\n\n" +
  "Newest first. Each run reads the live sitemaps after a production deploy and sends only URLs " +
  "whose lastmod is new or later than the last notice (AUTH-013).\n\n";

async function readSitemap(url: string): Promise<SitemapEntry[]> {
  const response = await fetch(url, {
    redirect: "manual",
    cache: "no-store",
    headers: { "User-Agent": "TooneIndexNowCheck/1.0 (+https://trytoone.com)" },
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.text();
  if (response.status !== 200 || !body.includes("<urlset")) {
    throw new Error(`sitemap ${url} answered HTTP ${response.status} without a urlset`);
  }
  return parseSitemap(body);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      "state-in": { type: "string" },
      "log-in": { type: "string" },
      out: { type: "string" },
      trigger: { type: "string", default: "manual" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  if (process.env.SITE_INDEXNOW?.trim().toLowerCase() === "false") {
    console.log("SITE_INDEXNOW=false: the deploy notice is switched off. Nothing read, nothing sent.");
    return 0;
  }
  const stateIn = values["state-in"];
  const out = values.out;
  if (!stateIn || !out) throw new Error("--state-in and --out are required");
  const dryRun = values["dry-run"];
  const startedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const state: NoticeState =
    stateIn === "baseline" ? baselineState() : parseState(readFileSync(stateIn, "utf8"));
  console.log(
    stateIn === "baseline"
      ? "No earlier notice record: starting from the 2026-11-02 14:31:44Z manual send (49 URLs)."
      : `Loaded the notice record: ${Object.keys(state.sent).length} URL(s) sent before.`,
  );

  const entries: SitemapEntry[] = [];
  for (const sitemap of NOTICE_SITEMAPS) {
    const found = await readSitemap(sitemap);
    console.log(`${sitemap}: ${found.length} URL(s)`);
    entries.push(...found);
  }

  const selection = selectChanged(entries, state);
  console.log(`${selection.send.length} URL(s) new or changed since their last notice.`);

  const passed: { url: string; lastmod: string }[] = [];
  const dropped: LiveCheck[] = [];
  for (const [index, candidate] of selection.send.entries()) {
    if (index > 0) await sleep(400);
    const check = await checkLive(candidate.url);
    console.log(`${check.ok ? "pass" : "DROP"} ${candidate.url} (lastmod ${candidate.lastmod}): ${check.reason}`);
    if (check.ok) passed.push(candidate);
    else dropped.push(check);
  }

  let status: number | null = null;
  let error: string | null = null;
  let next = state;
  if (passed.length > 0 && !dryRun) {
    try {
      status = await submitToIndexNow(passed.map((item) => item.url));
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
    }
    if (status === 200 || status === 202) next = markSent(state, passed, startedAt);
    console.log(`IndexNow answered ${status ?? error} for ${passed.length} URL(s).`);
  }

  const run: RunRecord = {
    startedAt,
    trigger: values.trigger ?? "manual",
    dryRun,
    selection,
    dropped,
    submitted: passed.map((item) => item.url),
    status,
    error,
  };
  const section = renderRun(run);
  const previousLog = values["log-in"] && existsSync(values["log-in"]) ? readFileSync(values["log-in"], "utf8") : "";
  const olderRuns = previousLog.startsWith(LOG_HEADER) ? previousLog.slice(LOG_HEADER.length) : previousLog;

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "state.json"), `${JSON.stringify(next, null, 2)}\n`);
  writeFileSync(join(out, "log.md"), `${LOG_HEADER}${section}\n${olderRuns}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${section}\n`);
  console.log(`\n${section}`);

  const sendFailed = passed.length > 0 && !dryRun && status !== 200 && status !== 202;
  return sendFailed ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (failure) => {
    console.error(`IndexNow deploy notice stopped, nothing sent: ${failure instanceof Error ? failure.message : failure}`);
    process.exit(1);
  },
);
