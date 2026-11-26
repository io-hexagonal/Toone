import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  LAST_GOOD_MAX_AGE_MS,
  getBundle,
  getRoutine,
  listRoutines,
  resetExploreMemo,
} from "../../lib/explore/data";
import { exploreOutage, isExploreRecordGone } from "../../lib/explore/outage";

// The memos live on globalThis and persist across tests in one process.
beforeEach(() => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  resetExploreMemo();
});

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
const ok = (data: unknown) => new Response(JSON.stringify({ data }));
const status = (code: number) =>
  new Response(JSON.stringify({ message: `upstream ${code}` }), { status: code });

/** What a detail page does with a failed read: 404 (notFound) or a rethrown error (500). */
async function pageOutcome(read: () => Promise<unknown>, record = true): Promise<"404" | "500" | "ok"> {
  try {
    await read();
    return "ok";
  } catch (error) {
    try {
      exploreOutage("test", error, { record });
    } catch (thrown) {
      const digest = (thrown as { digest?: unknown }).digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404")) return "404";
      assert.equal(thrown, error, "an outage rethrows the original error");
      return "500";
    }
  }
  throw new Error("unreachable");
}

test("a 4xx on a record (other than 408/429) is not-found; 5xx, 408, 429 stay outages", async (t) => {
  for (const [code, expected] of [
    [400, "404"], [403, "404"], [410, "404"], [422, "404"],
    [408, "500"], [429, "500"], [500, "500"], [502, "500"], [503, "500"],
  ] as const) {
    resetExploreMemo();
    t.mock.method(globalThis, "fetch", async () => status(code));
    assert.equal(await pageOutcome(() => getRoutine("some-routine")), expected, `routine ${code}`);
    assert.equal(await pageOutcome(() => getBundle("some-bundle")), expected, `bundle ${code}`);
  }
});

test("timeouts and network errors are outages, not not-found", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
  });
  assert.equal(await pageOutcome(() => getRoutine("some-routine")), "500");
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });
  assert.equal(await pageOutcome(() => getRoutine("some-routine")), "500");
});

test("a record served with a 200 but unrenderable is a 404; a broken envelope is an outage", async (t) => {
  const routine = fixture("routine-detail");
  t.mock.method(globalThis, "fetch", async () => ok({ ...routine, workflow_id: "not-an-id" }));
  assert.equal(await pageOutcome(() => getRoutine(routine.slug)), "404", "invalid routine detail");
  resetExploreMemo();
  const bundle = fixture("bundle-detail");
  t.mock.method(globalThis, "fetch", async () => ok({ ...bundle, members: "wrong" }));
  assert.equal(await pageOutcome(() => getBundle(bundle.slug)), "404", "invalid bundle detail");
  resetExploreMemo();
  // No {data} envelope, or not JSON at all: a proxy or error page, not a record.
  t.mock.method(globalThis, "fetch", async () => new Response("{}"));
  assert.equal(await pageOutcome(() => getRoutine(routine.slug)), "500");
  resetExploreMemo();
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Bad gateway</html>"));
  assert.equal(await pageOutcome(() => getRoutine(routine.slug)), "500");
});

test("collection pages never turn an API error into a 404", async (t) => {
  t.mock.method(globalThis, "fetch", async () => status(403));
  assert.equal(await pageOutcome(() => listRoutines(), false), "500");
  resetExploreMemo();
  // The catalog route itself missing is a broken deployment, not a missing record.
  t.mock.method(globalThis, "fetch", async () => status(404));
  const error = await listRoutines().catch((e: unknown) => e);
  assert.equal(isExploreRecordGone(error), false);
  assert.equal(await pageOutcome(() => Promise.reject(error), true), "500");
});

test("an outage on a URL served before renders the last good answer while it is under a day old", async (t) => {
  const routine = fixture("routine-detail");
  const entry = fixture("routine-entry");
  let now = Date.UTC(2026, 10, 26, 12);
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "fetch", async (url: URL) =>
    url.pathname.endsWith("/workflows") ? new Response(JSON.stringify({ data: [entry] }), { headers: { "X-Total-Count": "1" } }) : ok(routine),
  );
  const detail = await getRoutine(routine.slug);
  const list = await listRoutines();
  const failures: [string, () => Promise<Response>][] = [
    ["500", async () => status(500)],
    ["502", async () => status(502)],
    ["503", async () => status(503)],
    ["408", async () => status(408)],
    ["429", async () => status(429)],
    ["timeout", async () => { throw new DOMException("timed out", "TimeoutError"); }],
    ["network", async () => { throw new TypeError("fetch failed"); }],
    ["proxy page", async () => new Response("<html>Bad gateway</html>")],
  ];
  now += LAST_GOOD_MAX_AGE_MS - 60_000;
  for (const [label, failure] of failures) {
    t.mock.method(globalThis, "fetch", failure);
    assert.deepEqual(await getRoutine(routine.slug), detail, `${label}: last good detail`);
    assert.deepEqual(await listRoutines(), list, `${label}: last good catalog`);
  }
  // A URL never served before has nothing to fall back on.
  t.mock.method(globalThis, "fetch", async () => status(503));
  await assert.rejects(getRoutine("never-served"), /503/);
  // A 404 is an answer, never covered by an older copy.
  t.mock.method(globalThis, "fetch", async () => status(404));
  assert.equal(await getRoutine(routine.slug), null);
});

test("a last good answer older than a day is not served: the outage throws", async (t) => {
  const routine = fixture("routine-detail");
  let now = Date.UTC(2026, 10, 26, 12);
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "fetch", async () => ok(routine));
  await getRoutine(routine.slug);
  now += LAST_GOOD_MAX_AGE_MS;
  t.mock.method(globalThis, "fetch", async () => status(503));
  await assert.rejects(getRoutine(routine.slug), /503/);
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await assert.rejects(getRoutine(routine.slug), /fetch failed/);
  // A fresh answer restarts the clock.
  t.mock.method(globalThis, "fetch", async () => ok(routine));
  await getRoutine(routine.slug);
  now += 60_000;
  t.mock.method(globalThis, "fetch", async () => status(503));
  assert.equal((await getRoutine(routine.slug))?.workflow_id, routine.workflow_id);
});
