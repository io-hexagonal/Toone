import assert from "node:assert/strict";
import { test } from "node:test";
import { isAnalyticsFreePath } from "../../lib/privacy-choices";
import { collectSourceDates, gitLastCommitDate } from "../../lib/source-date";

test("Journal draft previews load no analytics (the token is in the path)", () => {
  for (const path of ["/en/journal/preview/abc", "/journal/preview/abc", "/pt/journal/preview/x/"]) {
    assert.equal(isAnalyticsFreePath(path), true, path);
  }
  for (const path of ["/en/journal", "/en/journal/some-post", "/en/journal/previews-of-2026"]) {
    assert.equal(isAnalyticsFreePath(path), false, path);
  }
});

test("content dates are taken once at build time and preferred at request time", () => {
  const dates = collectSourceDates("content");
  const [file, date] = Object.entries(dates).find(([name]) => name.startsWith("content/guides/")) ?? [];
  assert.ok(file && /^\d{4}-\d{2}-\d{2}$/.test(date!), "git dates collected for content/");
  assert.equal(gitLastCommitDate(file), date, "same date as git log -1");

  process.env.TOONE_SOURCE_DATES = JSON.stringify({ "content/inlined-only.md": "2026-01-02" });
  try {
    assert.equal(gitLastCommitDate("content/inlined-only.md"), "2026-01-02", "the inlined map answers without git");
  } finally {
    delete process.env.TOONE_SOURCE_DATES;
  }
  assert.deepEqual(collectSourceDates("content", "/"), {}, "no git repository: empty, no throw");
});

test("a catalog answer too big for the data cache is reused for a minute, not fetched on every request", async () => {
  const { listRoutines, resetExploreMemo } = await import("../../lib/explore/data");
  const realFetch = globalThis.fetch;
  let calls = 0;
  const big = { data: [{ workflow_id: "wfl_x", cover_image_data_url: `data:image/jpeg;base64,${"A".repeat(2_200_000)}` }] };
  globalThis.fetch = (async () => {
    calls++;
    return new Response(JSON.stringify(big), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    resetExploreMemo();
    await listRoutines({ listing: "all", limit: 100 });
    await listRoutines({ listing: "all", limit: 100 });
    assert.equal(calls, 1, "second call served from the per-instance memo");
    resetExploreMemo();
    await listRoutines({ listing: "all", limit: 100 });
    assert.equal(calls, 2, "the webhook reset clears it");
  } finally {
    globalThis.fetch = realFetch;
    resetExploreMemo();
  }
});
