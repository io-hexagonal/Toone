import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
const base = process.env.EXPLORE_WEB_URL || "http://127.0.0.1:13013";
const api = process.env.EXPLORE_MOCK_URL || "http://127.0.0.1:18787";
const secret = process.env.EXPLORE_REVALIDATE_SECRET || "explore-local-test-secret";
/** Replace the mock mode (needs EXPLORE_MOCK_ALLOW_CONTROL=1 on the mock). */
async function mode(data) {
  const response = await fetch(api + "/__test/mode", {
    method: "POST",
    body: JSON.stringify(data),
  });
  assert.equal(response.status, 200, "mock control must be explicitly enabled");
}
/** Signed webhook call: expires the data cache and the in-memory memos. */
async function invalidate(slug, id, type = "routine") {
  const raw = JSON.stringify({
    event: "approved",
    type,
    id,
    slug,
    occurred_at: new Date().toISOString(),
  });
  const signature = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
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
  await invalidate("reset-marker", "wfl_00000000");
});
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"),
  );
const routine = fixture("routine-detail");
const bundle = fixture("bundle-detail");
const get = async (path) => {
  const response = await fetch(base + path);
  return { response, html: await response.text() };
};
const schemas = (html) =>
  [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1]));
const count = (html, type) =>
  [...html.matchAll(new RegExp(`data-explore-type="${type}"`, "g"))].length;
test("server-rendered catalog has exactly one standalone routine and one bundle", async () => {
  const { response, html } = await get("/en/explore");
  assert.equal(response.status, 200);
  assert.equal(count(html, "routine"), 1);
  assert.equal(count(html, "bundle"), 1);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/trytoone.com\/en\/explore"/,
  );
  assert.equal(
    schemas(html).find((s) => s["@type"] === "CollectionPage").mainEntity
      .itemListElement.length,
    2,
  );
});
test("type, search, and tags filter the actual server-rendered catalog", async () => {
  const routines = await get("/en/explore?type=routines");
  assert.equal(count(routines.html, "routine"), 1);
  assert.equal(count(routines.html, "bundle"), 0);
  const bundles = await get("/en/explore?type=bundles");
  assert.equal(count(bundles.html, "routine"), 0);
  assert.equal(count(bundles.html, "bundle"), 1);
  const empty = await get("/en/explore?q=zzzz-no-match");
  assert.equal(count(empty.html, "routine") + count(empty.html, "bundle"), 0);
  assert.match(empty.html, /No items match/);
  const tag = fixture("tags")[0].tag;
  const tagged = await get(`/en/explore?tag=${tag}`);
  assert.match(tagged.html, /aria-current="true"/);
  const combined = await get(
    `/en/explore?type=bundles&tag=${tag}&q=audit&page=2`,
  );
  const clearTopic = combined.html.match(
    /<a\b[^>]*class="explore-topic-clear"[^>]*href="([^"]+)"/,
  );
  assert.ok(clearTopic, "an active topic offers a clear action");
  const cleared = new URL(clearTopic[1].replaceAll("&amp;", "&"), base);
  assert.equal(cleared.searchParams.get("type"), "bundles");
  assert.equal(cleared.searchParams.get("q"), "audit");
  assert.equal(cleared.searchParams.has("tag"), false);
  assert.equal(cleared.searchParams.has("page"), false);
});
test("routine HTML contains root and child steps, agents, safe Markdown, source, canonical and escaped schema", async () => {
  const { response, html } = await get("/en/explore/routines/" + routine.slug);
  assert.equal(response.status, 200);
  for (const member of routine.package.members)
    for (const step of member.payload.steps ?? [])
      assert.ok(html.includes(step.title), step.title);
  for (const agent of routine.package.agents)
    assert.ok(html.includes(agent.name));
  assert.match(html, /Completion criteria/);
  // Revision number is shown; ids, hashes and the raw package JSON are not
  // published (they are for the app and the API, and add page weight).
  // Ids may only appear inside attributes (deep link, cover URLs), never as text.
  const visibleText = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ");
  assert.ok(!visibleText.includes(routine.content_hash));
  assert.ok(!visibleText.includes(routine.revision_id));
  assert.ok(!html.includes('"format_version"'));
  assert.match(html, /Audit report style/);
  assert.ok(!html.includes("<script>alert('raw html must not render')"));
  assert.ok(!html.includes("explore-local-test-secret"));
  const schema = schemas(html).find((s) => s["@type"] === "HowTo");
  assert.equal(
    schema.step.length,
    routine.package.members.find((m) => m.key === routine.package.root_key)
      .payload.steps.length,
  );
  assert.match(html, /href="\/en\/request-access\?from=explore&amp;item=routine%3Awfl_[a-z0-9]+"/);
});
test("bundle preserves pin metadata, renders member pages and distinguishes missing items", async () => {
  const { response, html } = await get("/en/explore/bundles/" + bundle.slug);
  assert.equal(response.status, 200);
  for (const member of bundle.members) {
    const memberText = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ");
    assert.ok(!memberText.includes(member.pinned_revision_id));
    const page = await get("/en/explore/routines/" + member.slug);
    assert.equal(page.response.status, 200);
    assert.ok(page.html.includes(bundle.title));
  }
  assert.match(html, /Newer revision available/);
  const missing = await get("/en/explore/routines/does-not-exist");
  assert.equal(missing.response.status, 404);
});
test("id URLs issue permanent redirects to the slug URL, including translated requests", async () => {
  // The page calls permanentRedirect, which is a 308 (contract §11 says
  // "301s"; both are permanent and 308 matches the site's other redirects).
  for (const path of [
    `/en/explore/routines/${routine.workflow_id}`,
    `/pt/explore/routines/${routine.workflow_id}`,
  ]) {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.ok([301, 308].includes(response.status), `${path}: ${response.status}`);
    assert.ok(
      response.headers.get("location").endsWith("/routines/" + routine.slug),
    );
  }
  const response = await fetch(
    `${base}/en/explore/bundles/${bundle.bundle_id}`,
    { redirect: "manual" },
  );
  assert.ok([301, 308].includes(response.status));
  assert.ok(
    response.headers.get("location").endsWith("/bundles/" + bundle.slug),
  );
  // An unprefixed link goes through locale negotiation first, then the page.
  const followed = await fetch(`${base}/explore/routines/${routine.workflow_id}`);
  assert.equal(followed.status, 200);
  assert.ok(followed.url.endsWith(`/en/explore/routines/${routine.slug}`));
});
test("all translated routes have localized chrome with noindex and English canonicals", async () => {
  for (const locale of ["pt", "es", "fr", "de", "it", "nl", "ru"]) {
    const { response, html } = await get(`/${locale}/explore`);
    assert.equal(response.status, 200);
    assert.match(html, /<meta name="robots" content="noindex, follow"/);
    assert.match(
      html,
      /<link rel="canonical" href="https:\/\/trytoone.com\/en\/explore"/,
    );
    const messages = JSON.parse(
      readFileSync(
        new URL(`../../messages/${locale}.json`, import.meta.url),
        "utf8",
      ),
    );
    assert.ok(html.includes(messages.explore.title));
  }
});
test("static sitemap lists /en/explore once; the Explore sitemap lists every feed item", async () => {
  const site = await get("/sitemap.xml");
  assert.equal(site.response.status, 200);
  assert.match(site.html, /<loc>https:\/\/trytoone.com\/en\/explore<\/loc>/);
  assert.ok(!site.html.includes("/pt/explore"));
  assert.ok(!site.html.includes("/en/explore/routines/"));

  const { response, html } = await get("/sitemap-explore.xml");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/xml/);
  for (const item of fixture("feed").items)
    assert.ok(html.includes(`/en/explore/${item.type}s/${item.slug}`));
  assert.ok(!html.includes("/pt/explore"));
  assert.match(html, /<lastmod>2026-/);

  const robots = await get("/robots.txt");
  assert.match(robots.html, /Sitemap: https:\/\/trytoone.com\/sitemap.xml/);
  assert.match(robots.html, /Sitemap: https:\/\/trytoone.com\/sitemap-explore.xml/);
});
test("HMAC webhook refuses unsigned, modified, malformed and oversized requests and accepts exact body", async () => {
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
  const send = (body, signature) =>
    fetch(base + "/api/revalidate", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        ...(signature ? { "X-Explore-Signature": signature } : {}),
      },
    });
  assert.equal((await send(raw)).status, 401);
  assert.equal((await send(raw + " ", signature)).status, 401);
  assert.equal((await send("x".repeat(9000), signature)).status, 413);
  const valid = await send(raw, signature);
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { revalidated: true });
});

test("a server without the bundles route hides the Bundles filter and still lists routines", async () => {
  await mode({ bundles404: true });
  await invalidate(routine.slug, routine.workflow_id);
  const { response, html } = await get("/en/explore");
  assert.equal(response.status, 200);
  assert.equal(count(html, "routine"), 1);
  assert.equal(count(html, "bundle"), 0);
  const chips = [...html.matchAll(/class="explore-type-option"[^>]*>([^<]*)</g)].map((m) => m[1]);
  assert.deepEqual(chips, ["All", "Routines"]);
  assert.ok(!html.includes("Explore is temporarily unavailable"));
  const filtered = await get("/en/explore?type=routines");
  assert.equal(count(filtered.html, "routine"), 1);
  assert.ok(!filtered.html.includes(">Bundles<"));
  const bundlePage = await get("/en/explore/bundles/" + bundle.slug);
  assert.equal(bundlePage.response.status, 404);
  // The webhook clears the negative memo: bundles come back without waiting for the TTL.
  await mode({});
  await invalidate(routine.slug, routine.workflow_id);
  const restored = await get("/en/explore");
  assert.equal(count(restored.html, "bundle"), 1);
});
test("data-URL-only covers render the placeholder on cards but inline in the detail hero", async () => {
  await mode({ dataUrlCovers: true });
  await invalidate(routine.slug, routine.workflow_id);
  const index = await get("/en/explore");
  assert.equal(count(index.html, "routine"), 1);
  assert.ok(!index.html.includes("src=\"data:image"), "cards must not inline data URLs");
  assert.match(index.html, /explore-cover-empty/);
  const detail = await get("/en/explore/routines/" + routine.slug);
  assert.equal(detail.response.status, 200);
  assert.match(detail.html, /class="explore-cover " src="data:image\/jpeg;base64,/);
  assert.ok(!detail.html.includes("og:image\" content=\"data:"), "og:image never uses a data URL");
});
