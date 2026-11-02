import assert from "node:assert/strict";
import test from "node:test";
import { BASELINE_SENT_AT, BASELINE_URLS } from "../../lib/indexnow/baseline";
import {
  baselineState,
  checkLive,
  markSent,
  parseSitemap,
  parseState,
  renderRun,
  selectChanged,
  sentByJournalWebhook,
} from "../../lib/indexnow/site-notice";
import { indexNowPayload } from "../../lib/indexnow/submit";

const SITE = "https://trytoone.com";

test("the baseline is the 49 URLs sent by hand on 2026-11-02 at 14:31:44 UTC", () => {
  assert.equal(BASELINE_URLS.length, 49);
  assert.equal(new Set(BASELINE_URLS).size, 49);
  assert.equal(BASELINE_SENT_AT, "2026-11-02T14:31:44Z");
  for (const url of BASELINE_URLS) {
    assert.ok(url.startsWith(`${SITE}/en`), url);
    assert.equal(sentByJournalWebhook(url), false, url);
  }
});

test("Journal posts and /en/journal are left to the webhook; hubs are not", () => {
  assert.equal(sentByJournalWebhook(`${SITE}/en/journal`), true);
  assert.equal(sentByJournalWebhook(`${SITE}/en/journal/toone-1-0-81-auto-fix-ai-workflows-routines`), true);
  assert.equal(sentByJournalWebhook(`${SITE}/en/journal/releases`), false);
  assert.equal(sentByJournalWebhook(`${SITE}/en/journal/launches`), false);
  assert.equal(sentByJournalWebhook(`${SITE}/en/journal/routines`), false);
  assert.equal(sentByJournalWebhook(`${SITE}/en/journalism`), false);
  assert.equal(sentByJournalWebhook(`${SITE}/en/how-to`), false);
});

test("parseSitemap reads loc and lastmod, and keeps entries with no lastmod", () => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `<url><loc>${SITE}/en</loc><lastmod>2026-11-02</lastmod></url>`,
    `<url><loc>${SITE}/en/about</loc></url>`,
    `<url>\n  <loc> ${SITE}/en/explore?a=1&amp;b=2 </loc>\n  <lastmod>2026-09-21T23:10:17.381Z</lastmod>\n</url>`,
    "</urlset>",
  ].join("\n");
  assert.deepEqual(parseSitemap(xml), [
    { url: `${SITE}/en`, lastmod: "2026-11-02" },
    { url: `${SITE}/en/about`, lastmod: null },
    { url: `${SITE}/en/explore?a=1&b=2`, lastmod: "2026-09-21T23:10:17.381Z" },
  ]);
});

test("first run: baseline URLs are not re-sent unless their lastmod is later than the manual send", () => {
  const state = baselineState();
  const selection = selectChanged(
    [
      // The live sitemap on 2026-11-02: date-only lastmods on the manual-send day.
      { url: `${SITE}/en`, lastmod: "2026-11-02" },
      { url: `${SITE}/en/how-to`, lastmod: "2026-10-30" },
      { url: `${SITE}/en/explore/routines/launch-content-production-gni2lxu6`, lastmod: "2026-09-21T23:10:17.381Z" },
      { url: `${SITE}/en/journal/releases`, lastmod: "2026-10-14T13:50:44.932Z" },
      // Changed after the manual send.
      { url: `${SITE}/en/business`, lastmod: "2026-11-03" },
      { url: `${SITE}/en/journal/launches`, lastmod: "2026-11-02T15:00:00.000Z" },
    ],
    state,
  );
  assert.deepEqual(
    selection.send.map((item) => item.url),
    [`${SITE}/en/business`, `${SITE}/en/journal/launches`],
  );
  assert.equal(selection.unchanged.length, 4);
});

test("a new URL is sent; missing lastmod, Journal posts, duplicates and other hosts are not", () => {
  const selection = selectChanged(
    [
      { url: `${SITE}/en/explore/routines/new-one-abc123`, lastmod: "2026-11-05T10:00:00.000Z" },
      { url: `${SITE}/en/explore/routines/new-one-abc123`, lastmod: "2026-11-05T10:00:00.000Z" },
      { url: `${SITE}/en/privacy`, lastmod: null },
      { url: `${SITE}/en/terms`, lastmod: "not a date" },
      { url: `${SITE}/en/journal`, lastmod: "2026-11-05T10:00:00.000Z" },
      { url: `${SITE}/en/journal/some-post`, lastmod: "2026-11-05T10:00:00.000Z" },
      { url: "https://toone-landing-abc.vercel.app/en", lastmod: "2026-11-05" },
      { url: "http://trytoone.com/en/contact", lastmod: "2026-11-05" },
    ],
    { version: 1, sent: {} },
  );
  assert.deepEqual(selection.send.map((item) => item.url), [`${SITE}/en/explore/routines/new-one-abc123`]);
  assert.deepEqual(selection.noLastmod, [`${SITE}/en/privacy`, `${SITE}/en/terms`]);
  assert.deepEqual(selection.journalWebhook, [`${SITE}/en/journal`, `${SITE}/en/journal/some-post`]);
  assert.equal(selection.offSite.length, 2);
});

test("once sent, a URL is sent again only when its lastmod moves later", () => {
  const url = `${SITE}/en/how-to/features`;
  let state = markSent({ version: 1, sent: {} }, [{ url, lastmod: "2026-11-05" }], "2026-11-05T12:00:00Z");
  assert.deepEqual(state.sent[url], { lastmod: "2026-11-05", sentAt: "2026-11-05T12:00:00Z" });
  assert.equal(selectChanged([{ url, lastmod: "2026-11-05" }], state).send.length, 0);
  assert.equal(selectChanged([{ url, lastmod: "2026-11-04" }], state).send.length, 0);
  const later = selectChanged([{ url, lastmod: "2026-11-06" }], state);
  assert.equal(later.send.length, 1);
  assert.deepEqual(later.send[0].previous, { lastmod: "2026-11-05", sentAt: "2026-11-05T12:00:00Z" });
  state = markSent(state, later.send, "2026-11-06T09:00:00Z");
  assert.equal(state.sent[url].lastmod, "2026-11-06");
});

test("the record round-trips and a malformed record is refused", () => {
  const state = baselineState();
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.throws(() => parseState(JSON.stringify({ version: 2, sent: {} })));
  assert.throws(() => parseState(JSON.stringify({ version: 1, sent: { x: { lastmod: "nope", sentAt: "nope" } } })));
  assert.throws(() => parseState("not json"));
});

const page = (head: string, init: ResponseInit = {}) =>
  (async () => new Response(`<!doctype html><html><head>${head}</head><body></body></html>`, init)) as typeof fetch;

test("the live check passes a 200, indexable, self-canonical page", async () => {
  const url = `${SITE}/en/how-to`;
  const result = await checkLive(
    url,
    page(`<meta name="robots" content="index, follow"/><link rel="canonical" href="${url}"/>`),
  );
  assert.equal(result.ok, true, result.reason);
});

test("the live check drops redirects, errors, noindex and wrong or missing canonicals", async () => {
  const url = `${SITE}/en/how-to`;
  const self = `<link rel="canonical" href="${url}"/>`;
  const cases: [typeof fetch, RegExp][] = [
    [async () => new Response(null, { status: 308, headers: { location: `${SITE}/en/how-to/` } }), /HTTP 308 -> /],
    [async () => new Response("gone", { status: 404 }), /HTTP 404/],
    [page(self, { headers: { "x-robots-tag": "noindex" } }), /X-Robots-Tag/],
    [page(`<meta name="robots" content="noindex, follow">${self}`), /meta robots/],
    [page(`<meta content="none" name="bingbot">${self}`), /meta bingbot/],
    [page(""), /no canonical/],
    [page(`<link rel="canonical" href="${SITE}/en">`), /canonical is/],
    [page(`${self}${self}`), /2 canonicals/],
    [async () => { throw new Error("socket hang up"); }, /fetch failed/],
  ];
  for (const [fetchImpl, reason] of cases) {
    const result = await checkLive(url, fetchImpl);
    assert.equal(result.ok, false);
    assert.match(result.reason, reason);
  }
});

test("the payload keeps the shape every Toone IndexNow sender uses", () => {
  assert.deepEqual(indexNowPayload([`${SITE}/en`]), {
    host: "trytoone.com",
    key: "kpdkez871rpzxfa3q11m2d2fvpqq4cyg",
    keyLocation: "https://trytoone.com/kpdkez871rpzxfa3q11m2d2fvpqq4cyg.txt",
    urlList: [`${SITE}/en`],
  });
});

test("the run record names the time, the URLs and the HTTP status", () => {
  const text = renderRun({
    startedAt: "2026-11-05T12:00:00Z",
    trigger: "production deploy abc1234",
    dryRun: false,
    selection: { send: [], unchanged: ["a", "b"], noLastmod: [`${SITE}/en/privacy`], journalWebhook: ["c"], offSite: [] },
    dropped: [{ url: `${SITE}/en/x`, ok: false, reason: "HTTP 404" }],
    submitted: [`${SITE}/en/business`],
    status: 200,
    error: null,
  });
  assert.match(text, /## 2026-11-05T12:00:00Z \(production deploy abc1234\)/);
  assert.match(text, /1 URL\(s\) sent, IndexNow answered HTTP 200/);
  assert.match(text, /- https:\/\/trytoone.com\/en\/business/);
  assert.match(text, /https:\/\/trytoone.com\/en\/x: HTTP 404/);
  assert.match(text, /2 unchanged, 1 left to the Journal webhook, 1 with no lastmod/);
});
