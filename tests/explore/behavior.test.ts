import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  getRoutine,
  listRoutines,
  listBundles,
  loadCatalog,
  resolveCoverUrl,
} from "../../lib/explore/data";
import {
  parseCatalogQuery,
  catalogHref,
  deepLink,
  createOpenAttempt,
  routineSchema,
  exploreMetadata,
  safeMarkdownUrl,
} from "../../lib/explore/presentation";
import { verifyRevalidation } from "../../lib/explore/revalidation";

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
const response = (data: unknown, total?: number) =>
  new Response(JSON.stringify({ data }), {
    headers: total === undefined ? {} : { "X-Total-Count": String(total) },
  });

test("API joins versioned prefix, encodes filters, caches tags, and distinguishes missing from unavailable", async (t) => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/api/v1/toone/";
  let requested: URL | undefined;
  let options:
    | (RequestInit & { next?: { tags: string[]; revalidate: number } })
    | undefined;
  t.mock.method(globalThis, "fetch", async (url: URL, init: typeof options) => {
    requested = url;
    options = init;
    return response(fixture("routine-detail"));
  });
  await getRoutine("run-peer2paper-scientific-audit-e2biovg4e");
  assert.equal(
    requested?.pathname,
    "/api/v1/toone/workflows/run-peer2paper-scientific-audit-e2biovg4e",
  );
  assert.deepEqual(options?.next, {
    revalidate: 600,
    tags: ["explore", "explore:run-peer2paper-scientific-audit-e2biovg4e"],
  });
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("{}", { status: 404 }),
  );
  assert.equal(await getRoutine("valid-slug"), null);
  await assert.rejects(listRoutines(), /404/);
  // A server without the bundles route is "no bundles yet", not an outage.
  assert.deepEqual(await listBundles(), { items: [], total: 0, available: false });
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("{}", { status: 503 }),
  );
  await assert.rejects(getRoutine("valid-slug"), /503/);
  t.mock.method(globalThis, "fetch", async () =>
    response({ unexpected: true }),
  );
  await assert.rejects(listRoutines(), /array/);
});

test("mixed pagination sorts globally, excludes bundle-only routines, and reaches beyond 100", async (t) => {
  const routine = fixture("routine-entry");
  const bundle = fixture("bundle-entry");
  const routines = Array.from({ length: 125 }, (_, i) => ({
    ...routine,
    workflow_id: `wfl_${String(i).padStart(8, "0")}`,
    approved_at: new Date(Date.UTC(2026, 0, 1, 0, 250 - i * 2)).toISOString(),
  }));
  const bundles = Array.from({ length: 125 }, (_, i) => ({
    ...bundle,
    bundle_id: `wfb_${String(i).padStart(8, "0")}`,
    approved_at: new Date(Date.UTC(2026, 0, 1, 0, 249 - i * 2)).toISOString(),
  }));
  const calls: URL[] = [];
  t.mock.method(globalThis, "fetch", async (url: URL) => {
    calls.push(url);
    if (url.pathname.endsWith("/tags")) return response([]);
    const data = url.pathname.endsWith("/workflows") ? routines : bundles;
    if (url.pathname.endsWith("/workflows"))
      assert.equal(url.searchParams.get("listing"), "standalone");
    assert.equal(url.searchParams.get("query"), "evidence");
    assert.equal(url.searchParams.get("tag"), "research");
    const offset = Number(url.searchParams.get("offset") || 0);
    const limit = Number(url.searchParams.get("limit"));
    assert.ok(limit <= 100);
    return response(data.slice(offset, offset + limit), data.length);
  });
  const page = await loadCatalog({
    type: "all",
    query: "evidence",
    tag: "research",
    page: 11,
  });
  assert.equal(page.total, 250);
  assert.equal(page.items.length, 20);
  assert.deepEqual(
    page.items.slice(0, 2).map((x) => x.type),
    ["routine", "bundle"],
  );
  assert.equal(page.items[0].entry.title, routine.title);
  assert.equal(
    "workflow_id" in page.items[0].entry && page.items[0].entry.workflow_id,
    "wfl_00000100",
  );
  assert.ok(calls.some((url) => url.searchParams.get("offset") === "100"));
});

test("cover URLs cannot escape the API prefix or accept executable data", () => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/api/v1/toone";
  assert.equal(
    resolveCoverUrl({
      cover_url: "workflows/wfl_abcdefgh/revisions/wfr_abcdefgh/cover.jpg",
    }),
    "https://example.test/api/v1/toone/workflows/wfl_abcdefgh/revisions/wfr_abcdefgh/cover.jpg",
  );
  for (const value of [
    "https://evil.test/a.jpg",
    "//evil.test/a.jpg",
    "../secret",
    "%2e%2e/secret",
    "javascript:alert(1)",
    "/root.jpg",
  ])
    assert.equal(resolveCoverUrl({ cover_url: value }), null, value);
  assert.equal(
    resolveCoverUrl({
      cover_image_data_url: 'data:image/svg+xml,<svg onload="alert(1)"/>',
    }),
    null,
  );
});

test("queries preserve filters through pagination, validate type and clamp negative pages", () => {
  assert.deepEqual(
    parseCatalogQuery({
      type: "forged",
      page: "-4",
      q: "  science ",
      tag: "science",
    }),
    { type: "all", page: 1, query: "science", tag: "science" },
  );
  assert.equal(
    catalogHref("pt", {
      type: "bundles",
      page: 2,
      query: "a&b",
      tag: "research",
    }),
    "/pt/explore?type=bundles&q=a%26b&tag=research&page=2",
  );
});

test("deep links reject forged ids and revision mismatches", () => {
  assert.equal(
    deepLink("routine", "wfl_abcdefgh", "wfr_abcdefgh"),
    "toone://explore/routines/wfl_abcdefgh?revision=wfr_abcdefgh",
  );
  for (const [type, id, rev] of [
    ["routine", "wfb_abcdefgh", "wfr_abcdefgh"],
    ["bundle", "wfb_abcdefgh", "wfr_abcdefgh"],
    ["routine", "wfl_ab", "wfr_abcdefgh"],
  ])
    assert.equal(deepLink(type as "routine" | "bundle", id, rev), null);
});

for (const event of ["visibilitychange", "pagehide", "blur", "cleanup"])
  test(`Open in Toone cancels fallback on ${event} permanently`, () => {
    const listeners = new Map<string, () => void>();
    let callback = () => {};
    let visible = true;
    const navigations: string[] = [];
    const cancel = createOpenAttempt(
      {
        listen: (name, fn) => {
          listeners.set(name, fn);
          return () => listeners.delete(name);
        },
        later: (fn) => {
          callback = fn;
          return () => {
            callback = () => {};
          };
        },
        visible: () => visible,
        navigate: (url) => {
          navigations.push(url);
        },
      },
      "toone://explore/routines/wfl_abcdefgh",
      "/en/download?from=explore",
    );
    if (event === "cleanup") cancel();
    else {
      if (event === "visibilitychange") visible = false;
      listeners.get(event)?.();
    }
    visible = true;
    callback();
    assert.deepEqual(navigations, ["toone://explore/routines/wfl_abcdefgh"]);
    assert.equal(listeners.size, 0);
  });
test("Open in Toone falls back after 1.5s while visible", () => {
  let callback = () => {};
  const navigations: string[] = [];
  createOpenAttempt(
    {
      listen: () => () => {},
      later: (fn, ms) => {
        assert.equal(ms, 1500);
        callback = fn;
        return () => {};
      },
      visible: () => true,
      navigate: (url) => {
        navigations.push(url);
      },
    },
    "toone://explore/bundles/wfb_abcdefgh",
    "/en/download?from=explore",
  );
  callback();
  assert.deepEqual(navigations, [
    "toone://explore/bundles/wfb_abcdefgh",
    "/en/download?from=explore",
  ]);
});

test("revalidation authenticates exact bytes, rejects bad event ids and missing secrets", () => {
  const event = {
    event: "approved",
    type: "routine",
    id: "wfl_abcdefgh",
    slug: "test-abcdefgh",
    occurred_at: "2026-09-21T12:00:00Z",
  };
  const raw = JSON.stringify(event);
  const signature =
    "sha256=" + createHmac("sha256", "secret").update(raw).digest("hex");
  assert.deepEqual(verifyRevalidation(raw, signature, "secret"), event);
  for (const sig of [
    null,
    "sha256=00",
    "sha256=" + "0".repeat(64),
    signature + "x",
  ])
    assert.equal(verifyRevalidation(raw, sig, "secret"), null);
  assert.equal(verifyRevalidation(raw + " ", signature, "secret"), null);
  assert.equal(verifyRevalidation(raw, signature, ""), null);
  const invalid = JSON.stringify({ ...event, id: "wfb_abcdefgh" });
  assert.equal(
    verifyRevalidation(
      invalid,
      "sha256=" + createHmac("sha256", "secret").update(invalid).digest("hex"),
      "secret",
    ),
    null,
  );
});

test("SEO uses English canonical, noindex translations, and one HowTo step per visible root step", () => {
  const detail = fixture("routine-detail");
  const metadata = exploreMetadata(
    "pt",
    `/explore/routines/${detail.slug}`,
    detail.title,
    detail.summary,
    null,
  );
  assert.equal(
    metadata.alternates.canonical,
    `https://trytoone.com/en/explore/routines/${detail.slug}`,
  );
  assert.equal(metadata.robots.index, false);
  assert.equal(
    metadata.alternates.languages["x-default"],
    metadata.alternates.canonical,
  );
  const schema = routineSchema(detail);
  assert.equal(
    schema.step.length,
    detail.package.members.find(
      (m: { key: string }) => m.key === detail.package.root_key,
    ).payload.steps.length,
  );
  assert.equal(
    schema.step[0].name,
    detail.package.members[0].payload.steps[0].title,
  );
  assert.equal(safeMarkdownUrl("javascript:alert(1)"), "");
  assert.equal(safeMarkdownUrl("data:text/html,x"), "");
  assert.equal(
    safeMarkdownUrl("https://example.test/path"),
    "https://example.test/path",
  );
});

test("malformed public detail cannot become a successful empty render", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    response({ title: "incomplete" }),
  );
  await assert.rejects(getRoutine("valid-slug"), /detail/);
});

test("a repeated Open action cancels the first fallback and unmount removes the second", () => {
  const callbacks = new Set<() => void>();
  const navigations: string[] = [];
  const listeners = new Set<() => void>();
  const env = {
    listen: (_name: string, fn: () => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    later: (fn: () => void) => {
      callbacks.add(fn);
      return () => {
        callbacks.delete(fn);
      };
    },
    visible: () => true,
    navigate: (url: string) => {
      navigations.push(url);
    },
  };
  const first = createOpenAttempt(
    env,
    "toone://explore/routines/wfl_abcdefgh",
    "/en/download?from=explore",
  );
  first();
  const second = createOpenAttempt(
    env,
    "toone://explore/routines/wfl_abcdefgh",
    "/en/download?from=explore",
  );
  assert.equal(callbacks.size, 1);
  second();
  for (const callback of callbacks) callback();
  assert.equal(listeners.size, 0);
  assert.equal(callbacks.size, 0);
  assert.equal(navigations.length, 2);
});

test("mixed sort compares instants when RFC3339 fractional precision differs", async (t) => {
  const routine = {
    ...fixture("routine-entry"),
    approved_at: "2026-09-21T12:00:00Z",
  };
  const bundle = {
    ...fixture("bundle-entry"),
    approved_at: "2026-09-21T12:00:00.500Z",
  };
  t.mock.method(globalThis, "fetch", async (url: URL) =>
    response(url.pathname.endsWith("/workflows") ? [routine] : [bundle], 1),
  );
  const page = await loadCatalog({ type: "all", page: 1, query: "", tag: "" });
  assert.equal(page.items[0].type, "bundle");
});

test("even a queued fallback callback cannot navigate after cancellation", () => {
  let queued = () => {};
  const navigations: string[] = [];
  const cancel = createOpenAttempt(
    {
      listen: () => () => {},
      later: (callback) => {
        queued = callback;
        return () => {};
      },
      visible: () => true,
      navigate: (url) => {
        navigations.push(url);
      },
    },
    "toone://explore/routines/wfl_abcdefgh",
    "/en/download?from=explore",
  );
  cancel();
  queued();
  assert.deepEqual(navigations, ["toone://explore/routines/wfl_abcdefgh"]);
});
