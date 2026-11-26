import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { resetExploreMemo } from "../../lib/explore/data";

// The route imports `@/lib/explore/api`, whose `server-only` guard throws
// outside the `react-server` condition that Next sets; map it to the package's
// empty entry, as Next does for route handlers.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only")
      return { url: new URL("../../node_modules/server-only/empty.js", import.meta.url).href, shortCircuit: true };
    return next(specifier, context);
  },
});

const feed = readFileSync(new URL("./fixtures/feed.json", import.meta.url), "utf8");
const taxonomy = {
  version: "2026-09-01",
  terms: [{ id: "cat_marketing-sales", kind: "category", label: "Marketing & sales", description: "Fixture", active: true }],
};
const facets = [{ term_id: "cat_marketing-sales", routines: 2, bundles: 1 }];
const ROUTINE = "https://trytoone.com/en/explore/routines/run-peer2paper-scientific-audit-2biovg4e";
const BUNDLE = "https://trytoone.com/en/explore/bundles/scientific-review-toolkit-7a1b5c8d";
const TOPIC = "https://trytoone.com/en/explore/category/marketing-sales";
const CACHED = "public, max-age=600, s-maxage=600, stale-while-revalidate=86400";

type Answer = number | string | object;
/** Serves each upstream path from `routes`; a number is a bare status. */
function upstream(routes: Record<string, Answer>) {
  return async (input: string | URL | Request) => {
    const { pathname } = new URL(input instanceof Request ? input.url : String(input));
    const answer = routes[pathname.replace(/^\/v1\//, "")] ?? 404;
    if (typeof answer === "number")
      return new Response(JSON.stringify({ code: "x", message: "fixture" }), { status: answer });
    const data = typeof answer === "string" ? JSON.parse(answer) : answer;
    return new Response(JSON.stringify({ data }), { status: 200 });
  };
}

async function sitemap() {
  const { GET } = await import("../../app/sitemap-explore.xml/route");
  return GET();
}

beforeEach(() => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  resetExploreMemo();
});

test("TECH-023: a feed outage answers 503 with Retry-After, no-store and no urlset", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", upstream({
    "explore/feed": 503,
    "explore/taxonomy": taxonomy,
    "explore/facets": facets,
  }));
  const response = await sitemap();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "600");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.text();
  assert.ok(!body.includes("<urlset"), "an outage must not look like a (partial) sitemap");
  assert.ok(!body.includes("<url>"));
});

test("a sitemap served before the outage answers 200 from the last good feed (under 24 h)", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "warn", () => {});
  const healthy = upstream({ "explore/feed": feed, "explore/taxonomy": taxonomy, "explore/facets": facets });
  const down = upstream({ "explore/feed": 503, "explore/taxonomy": 503, "explore/facets": 503 });
  let up = true;
  t.mock.method(globalThis, "fetch", (input: string | URL | Request) => (up ? healthy(input) : down(input)));
  assert.equal((await sitemap()).status, 200);
  up = false;
  const response = await sitemap();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("retry-after"), null);
  const body = await response.text();
  assert.ok(body.includes(`<loc>${ROUTINE}</loc>`), "the records come from the last good feed");
  assert.ok(body.includes(`<loc>${BUNDLE}</loc>`));
  // Never served (the memo is empty after a cold start): the 503 above.
  resetExploreMemo();
  assert.equal((await sitemap()).status, 503);
});

test("a malformed feed is an outage too, not an empty list", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", upstream({ "explore/feed": { generated_at: "x" } }));
  const response = await sitemap();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("a feed route that is not served yet (404) stays a cacheable, empty 200", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(globalThis, "fetch", upstream({}));
  const response = await sitemap();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), CACHED);
  assert.equal(response.headers.get("retry-after"), null);
  const body = await response.text();
  assert.match(body, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.ok(!body.includes("<url>"));
});

test("a taxonomy failure alone still lists the records, uncached and without topic pages", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", upstream({ "explore/feed": feed, "explore/taxonomy": 500 }));
  const response = await sitemap();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.text();
  assert.ok(body.includes(`<loc>${ROUTINE}</loc>`));
  assert.ok(body.includes(`<loc>${BUNDLE}</loc>`));
  assert.ok(!body.includes("/explore/routines/claim-audit-d4c3b2a1"), "noindex records stay out");
  assert.ok(!body.includes("/explore/category/"));
});

test("a facets failure alone also keeps the records", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", upstream({ "explore/feed": feed, "explore/taxonomy": taxonomy, "explore/facets": 502 }));
  const response = await sitemap();
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes(`<loc>${ROUTINE}</loc>`));
});

test("a healthy feed and taxonomy keep the CDN caching and list records; topic pages only when indexable", async (t) => {
  t.mock.method(globalThis, "fetch", upstream({ "explore/feed": feed, "explore/taxonomy": taxonomy, "explore/facets": facets }));
  const response = await sitemap();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), CACHED);
  assert.equal(response.headers.get("content-type"), "application/xml");
  const body = await response.text();
  assert.ok(body.includes(`<url><loc>${ROUTINE}</loc><lastmod>2026-08-31T23:33:38.652Z</lastmod></url>`));
  // TOPIC-012 (#144): no written intro (TOPIC_PAGE_INTROS is empty) and under
  // 5 routines, so the topic page is noindex and not listed.
  assert.ok(!body.includes(`<loc>${TOPIC}</loc>`));
});
