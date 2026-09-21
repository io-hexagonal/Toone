import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
const base = process.env.EXPLORE_WEB_URL || "http://127.0.0.1:13013";
const api = process.env.EXPLORE_MOCK_URL || "http://127.0.0.1:18787";
const routine = JSON.parse(
  readFileSync(
    new URL("./fixtures/routine-detail.json", import.meta.url),
    "utf8",
  ),
);
async function mode(data) {
  const response = await fetch(api + "/__test/mode", {
    method: "POST",
    body: JSON.stringify(data),
  });
  assert.equal(response.status, 200, "mock control must be explicitly enabled");
}
async function invalidate() {
  const raw = JSON.stringify({
    event: "approved",
    type: "routine",
    id: routine.workflow_id,
    slug: routine.slug,
    occurred_at: new Date().toISOString(),
  });
  const signature =
    "sha256=" +
    createHmac(
      "sha256",
      process.env.EXPLORE_REVALIDATE_SECRET || "explore-local-test-secret",
    )
      .update(raw)
      .digest("hex");
  const response = await fetch(base + "/api/revalidate", {
    method: "POST",
    body: raw,
    headers: { "X-Explore-Signature": signature },
  });
  assert.equal(response.status, 200);
}
// A leaked mode from another file or an aborted run must not shape this one.
beforeEach(async () => {
  await mode({});
  await invalidate();
});
test("webhook expires rendered detail, catalog and sitemap; outages stay distinct from not-found", async () => {
  const detailPath = "/en/explore/routines/" + routine.slug;
  const probe = "Explore revalidation proof " + Date.now();
  try {
    await mode({});
    await invalidate();
    await fetch(base + detailPath);
    await mode({ title: probe });
    if (process.env.EXPLORE_EXPECT_CACHE === "1") {
      const stale = await (await fetch(base + detailPath)).text();
      assert.ok(
        !stale.includes(probe),
        "public page must still be cached before webhook",
      );
    }
    await invalidate();
    const fresh = await (await fetch(base + detailPath)).text();
    assert.ok(fresh.includes(probe), "webhook must evict cached detail");
    const catalog = await (await fetch(base + "/en/explore")).text();
    assert.ok(catalog.includes(probe), "webhook must evict cached catalog");
    await mode({ unavailable: true });
    await invalidate();
    for (const path of ["/en/explore", detailPath]) {
      const response = await fetch(base + path);
      assert.notEqual(response.status, 404);
      const html = await response.text();
      assert.match(html, /Explore is temporarily unavailable/);
      assert.match(html, /<meta name="robots" content="noindex, follow"/);
      assert.ok(!html.includes("No items match"));
      if (path === detailPath)
        assert.ok(
          html.includes(`href="${detailPath}"`),
          "detail retry preserves the item URL",
        );
    }
    // An outage yields a valid, uncached, empty Explore sitemap rather than a
    // 5xx; the static /sitemap.xml is unaffected.
    const sitemap = await fetch(base + "/sitemap-explore.xml");
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get("cache-control"), /no-store/);
    assert.ok(!(await sitemap.text()).includes("/en/explore/routines/"));
    assert.equal((await fetch(base + "/sitemap.xml")).status, 200);
    await mode({ edge: true });
    await invalidate();
    const edge = await (await fetch(base + detailPath)).text();
    assert.match(edge, /Averylongunbrokenpublictoken/);
    assert.match(edge, /Safety fixture/);
    assert.ok(!edge.includes('href="javascript:'));
    assert.ok(!edge.includes('href="data:'));
    assert.ok(!edge.includes("<script>alert('edge-script')"));
    assert.ok(!edge.includes('<img src="x"'));
    assert.match(edge, /explore-cover-empty/);
    // Reviewer-only fields injected upstream never reach the HTML (§5.2 allow-list).
    assert.ok(!edge.includes("usr_reviewer_leak_test"));
    assert.ok(!edge.includes("review-reason-leak-test"));
    assert.ok(!edge.includes("submitted_by"));
    assert.ok(!edge.includes('aria-label="Tags"><li>'));
    await mode({ empty: true });
    await invalidate();
    const empty = await (await fetch(base + "/en/explore")).text();
    assert.match(empty, /No routines or bundles have been published yet/);
    assert.ok(!empty.includes('data-explore-type="'));
    await mode({ removed: true });
    await invalidate();
    const removed = await fetch(base + detailPath);
    assert.equal(removed.status, 404);
    const afterRemoval = await (await fetch(base + "/sitemap-explore.xml")).text();
    assert.ok(!afterRemoval.includes("/en/explore/routines/" + routine.slug));
  } finally {
    await mode({});
    await invalidate();
  }
});
