import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  getJournalFeed,
  getPost,
  getPostsFeaturing,
  getPreview,
  isPostParam,
  listPosts,
  normalizePostDetail,
  normalizePostEntry,
  resetJournalMemo,
  resolveAssetUrl,
} from "../../lib/journal/data";

// The negative/last-good memos persist across tests in one process.
beforeEach(() => {
  resetJournalMemo();
  process.env.EXPLORE_API_BASE_URL = "https://example.test/api/v1/toone/";
});

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/journal.json", import.meta.url), "utf8"),
);
const [release, spotlight, launch] = fixture.posts;
const entryOf = (post: Record<string, unknown>) => {
  const { body, keywords, assets, revision_id, content_hash, state, ...entry } = post;
  void body; void keywords; void assets; void revision_id; void content_hash; void state;
  return entry;
};
type Init = RequestInit & { next?: { tags: string[]; revalidate: number } };
const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

test("listPosts joins the versioned base, sends filters, tags the data cache and reads X-Total-Count", async (t) => {
  let requested: URL | undefined;
  let init: Init | undefined;
  t.mock.method(globalThis, "fetch", async (url: URL, options: Init) => {
    requested = url;
    init = options;
    return json(200, { data: [entryOf(release), entryOf(launch)] }, { "X-Total-Count": "15" });
  });
  const result = await listPosts({ type: "release", limit: 12, offset: 12 });
  assert.equal(requested?.pathname, "/api/v1/toone/journal/posts");
  assert.equal(requested?.searchParams.get("type"), "release");
  assert.equal(requested?.searchParams.get("limit"), "12");
  assert.equal(requested?.searchParams.get("offset"), "12");
  assert.deepEqual(init?.next, { revalidate: 600, tags: ["journal"] });
  assert.equal(result.total, 15);
  assert.equal(result.available, true);
  assert.deepEqual(result.items.map((item) => item.slug), [release.slug, launch.slug]);
});

test("a server without the Journal reads as an empty list, and the 404 is memoized", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return json(404, { code: "not_found", message: "not found" });
  });
  assert.deepEqual(await listPosts(), { items: [], total: 0, available: false });
  assert.deepEqual(await listPosts({ type: "launch" }), { items: [], total: 0, available: false });
  assert.equal(calls, 1, "second read is answered by the not-served memo");
  assert.equal(await getJournalFeed(), null);
});

test("an outage throws, unless a last good response exists for the same URL", async (t) => {
  let status = 200;
  t.mock.method(globalThis, "fetch", async () =>
    status === 200 ? json(200, { data: [entryOf(release)] }, { "X-Total-Count": "1" }) : json(status, { message: "down" }),
  );
  await assert.rejects(() => (status = 503, listPosts()), /Journal API 503/);
  status = 200;
  assert.equal((await listPosts()).items.length, 1);
  status = 503;
  assert.equal((await listPosts()).items.length, 1, "last good served on 503");
  status = 429;
  assert.equal((await listPosts()).items.length, 1, "last good served on 429");
  await assert.rejects(() => listPosts({ type: "launch" }), /Journal API 429/);
});

test("getPost: detail with per-slug tag, 404 missing, 410 gone with and without a successor", async (t) => {
  let init: Init | undefined;
  t.mock.method(globalThis, "fetch", async (url: URL, options: Init) => {
    init = options;
    const slug = url.pathname.split("/").pop();
    if (slug === release.slug) return json(200, { data: release });
    if (slug === "old-post") return json(410, { code: "gone", message: "retired", redirect_slug: release.slug });
    if (slug === "gone-post") return json(410, { code: "gone", message: "retired", redirect_slug: null });
    return json(404, { code: "not_found", message: "not found" });
  });
  const found = await getPost(release.slug);
  assert.equal(found.kind, "post");
  assert.deepEqual(init?.next, { revalidate: 600, tags: ["journal", `journal:${release.slug}`] });
  if (found.kind === "post") {
    assert.equal(found.post.body, release.body);
    assert.equal(found.post.release?.version, "1.0.79");
    assert.deepEqual(Object.keys(found.post.assets).sort(), ["jna_cover0release01", "jna_shot0release001"]);
  }
  assert.deepEqual(await getPost("old-post"), { kind: "gone", redirectSlug: release.slug });
  assert.deepEqual(await getPost("gone-post"), { kind: "gone", redirectSlug: null });
  assert.deepEqual(await getPost("unknown-post"), { kind: "missing" });
  assert.deepEqual(await getPost("Bad Slug!"), { kind: "missing" }, "malformed params never reach the API");
});

test("an invalid detail is an upstream error, not a broken article", async (t) => {
  t.mock.method(globalThis, "fetch", async () => json(200, { data: { ...release, body: "" } }));
  await assert.rejects(() => getPost(release.slug), /invalid post detail/);
});

test("previews are never cached and fill missing draft dates", async (t) => {
  const [preview] = fixture.previews;
  let init: Init | undefined;
  t.mock.method(globalThis, "fetch", async (_url: URL, options: Init) => {
    init = options;
    return json(200, { data: { ...preview, published_at: null, updated_at: null, preview: true } });
  });
  const result = await getPreview(preview.token);
  assert.equal(init?.cache, "no-store");
  assert.equal(init?.next, undefined);
  assert.equal(result?.state, "draft");
  assert.ok(result && Number.isFinite(Date.parse(result.published_at)));
  assert.equal(await getPreview("short"), null, "malformed tokens are not sent");
});

test("feed items keep retired posts and drop malformed rows", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    json(200, {
      data: [
        { post_id: release.post_id, slug: release.slug, type: "release", state: "published", published_at: release.published_at, updated_at: release.updated_at, retired_at: null },
        { ...fixture.retired[0] },
        { post_id: "nope", slug: "x", type: "release", state: "published", published_at: "2026-01-01T00:00:00Z" },
      ],
    }),
  );
  const feed = await getJournalFeed();
  assert.deepEqual(feed?.map((item) => item.state), ["published", "retired"]);
});

test("featured and latest helpers never throw", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("network down");
  });
  t.mock.method(console, "warn", () => {});
  assert.deepEqual(await getPostsFeaturing("launch-kit-r5h8c2nd"), []);
  assert.deepEqual(await getPostsFeaturing("<script>"), []);
});

test("normalizers allow-list fields and reject unsafe asset paths", () => {
  const entry = normalizePostEntry({ ...entryOf(spotlight), extra: "leak", assistance: "bogus" });
  assert.ok(entry);
  assert.equal("extra" in (entry as object), false);
  assert.equal(entry?.assistance, "assisted", "unknown assistance still discloses");
  assert.equal(normalizePostEntry({ ...entryOf(spotlight), post_id: "wfl_abcdefgh" }), null);
  assert.equal(normalizePostEntry({ ...entryOf(spotlight), type: "essay" }), null);
  const unsafe = normalizePostDetail({
    ...release,
    cover: { ...release.cover, url: "../../etc/passwd" },
    assets: { jna_cover0release01: { url: "https://evil.test/x.png", width: 1, height: 1 } },
  });
  assert.equal(unsafe?.cover, null);
  assert.deepEqual(unsafe?.assets, {});
  assert.equal(normalizePostEntry({ ...entryOf(launch), author: { name: "X", url: "javascript:alert(1)" } })?.author.url, null);
  assert.equal(resolveAssetUrl("journal/assets/jna_cover0release01"), "https://example.test/api/v1/toone/journal/assets/jna_cover0release01");
  assert.equal(resolveAssetUrl("journal/assets/../../secret"), null);
  assert.equal(isPostParam("jnp_rel0001abcd1234"), true);
  assert.equal(isPostParam("ab"), false);
});
