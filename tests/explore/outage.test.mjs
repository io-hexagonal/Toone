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
    // Every URL checked below as "served before" is fetched once while the
    // API is up (the bundle page and the sitemap too), so each has a
    // last-good copy; its title and robots tag are the reference.
    const bundlePath = "/en/explore/bundles/" + "launch-kit-r5h8c2nd";
    const head = (html) => [
      /<title>[^<]*<\/title>/.exec(html)?.[0],
      /<meta name="robots"[^>]*>/.exec(html)?.[0],
    ];
    const warm = {};
    for (const path of ["/en/explore", detailPath, bundlePath]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      warm[path] = head(await response.text());
    }
    assert.ok((await (await fetch(base + "/sitemap-explore.xml")).text()).includes("/en/explore/routines/" + routine.slug));
    await mode({ unavailable: true });
    // The webhook expires Next's data cache but keeps the last-good memo, so
    // every read below is a cold read against a failing API.
    await invalidate();
    // A8: an indexable Explore URL answers an outage with a server error
    // that crawlers retry, never "200 + noindex" (which reads as "drop me").
    // A URL this server has never served has nothing to fall back on.
    const cold = "cold-outage-" + Date.now().toString(36);
    for (const path of ["/en/explore/routines/" + cold, "/en/explore/bundles/" + cold]) {
      // Next.js answers an uncaught render error with 500 (pages cannot pick
      // 503). Its error shell carries its own `noindex`, which Google never
      // reads on a 5xx: the status is the signal.
      const response = await fetch(base + path);
      assert.equal(response.status, 500, path);
      const html = await response.text();
      assert.ok(!html.includes("Explore is temporarily unavailable"), path);
    }
    // A URL served before the outage renders its last good copy (under a
    // day old), even right after a webhook: a 200 with the real content.
    for (const path of ["/en/explore", detailPath, bundlePath]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.deepEqual(head(html), warm[path], path + ": same title and robots as before");
      assert.ok(!html.includes("Explore is temporarily unavailable"), path);
      assert.ok(!html.includes("No items match"), path);
      if (path !== bundlePath) assert.ok(html.includes(probe), path + " renders the last good copy");
    }
    // Filter and search views are noindex anyway: people get the retry page.
    const search = await fetch(base + "/en/explore?q=" + cold);
    assert.equal(search.status, 200);
    const searchHtml = await search.text();
    assert.match(searchHtml, /Explore is temporarily unavailable/);
    assert.match(searchHtml, /<meta name="robots" content="noindex, follow"/);
    // The Explore sitemap is never a 5xx: it lists its last good feed here
    // (a cold outage yields a valid, uncached, empty urlset instead); the
    // static /sitemap.xml is unaffected.
    const sitemap = await fetch(base + "/sitemap-explore.xml");
    assert.equal(sitemap.status, 200);
    assert.ok((await sitemap.text()).includes("/en/explore/routines/" + routine.slug));
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
