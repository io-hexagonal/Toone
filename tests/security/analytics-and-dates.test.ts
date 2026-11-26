import assert from "node:assert/strict";
import { test } from "node:test";
import { isAnalyticsFreePath } from "../../lib/privacy-choices";
import fs from "node:fs";
import { collectSourceDates, contentDate } from "../../lib/source-date";

test("Journal draft previews load no analytics (the token is in the path)", () => {
  for (const path of ["/en/journal/preview/abc", "/journal/preview/abc", "/pt/journal/preview/x/"]) {
    assert.equal(isAnalyticsFreePath(path), true, path);
  }
  for (const path of ["/en/journal", "/en/journal/some-post", "/en/journal/previews-of-2026"]) {
    assert.equal(isAnalyticsFreePath(path), false, path);
  }
});

test("content dates come from the committed manifest, never from git at build time", () => {
  const manifest = JSON.parse(fs.readFileSync("lib/content-dates.json", "utf8")) as Record<string, string>;
  const [file, date] = Object.entries(manifest).find(([name]) => name.startsWith("content/guides/")) ?? [];
  assert.ok(file && /^\d{4}-\d{2}-\d{2}$/.test(date!), "the manifest dates content/");
  assert.equal(contentDate(file), date, "contentDate reads the manifest");
  assert.equal(contentDate("content/not-a-file.md"), null, "unknown path: null, not today");
  assert.equal(contentDate(null), null);
  assert.deepEqual(collectSourceDates("content", "/"), {}, "no git repository: empty, no throw");
  const config = fs.readFileSync("next.config.ts", "utf8");
  assert.doesNotMatch(config, /collectSourceDates|TOONE_SOURCE_DATES/, "the build does not ask git");
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
