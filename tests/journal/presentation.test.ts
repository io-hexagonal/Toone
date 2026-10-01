import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { normalizePostDetail, normalizePostEntry } from "../../lib/journal/data";
import {
  blogPostingSchema,
  buildJournalSitemap,
  buildRss,
  collectionPageSchema,
  disclosureText,
  escapeXml,
  hubForSegment,
  listBreadcrumbSchema,
  listMetadata,
  listPath,
  pageCount,
  parsePageParam,
  postBreadcrumbSchema,
  postImage,
  postMetadata,
  previewMetadata,
} from "../../lib/journal/presentation";
import type { JournalFeedItem, JournalPostDetail } from "../../lib/journal/types";

beforeEach(() => {
  process.env.EXPLORE_API_BASE_URL = "https://api.example.test/v1";
});

const fixture = JSON.parse(readFileSync(new URL("./fixtures/journal.json", import.meta.url), "utf8"));
const detail = (index: number) => normalizePostDetail(fixture.posts[index]) as JournalPostDetail;

test("post metadata: absolute canonical, og:url, en + x-default, article times, RSS alternate (§10)", () => {
  const post = detail(0);
  const meta = postMetadata(post);
  const canonical = "https://trytoone.com/en/journal/toone-1-0-79-release-notes";
  assert.equal(meta.alternates?.canonical, canonical);
  assert.deepEqual(meta.alternates?.languages, { en: canonical, "x-default": canonical });
  assert.deepEqual(meta.alternates?.types, {
    "application/rss+xml": [{ url: "https://trytoone.com/journal/feed.xml", title: "Toone Journal" }],
  });
  assert.deepEqual(meta.robots, { index: true, follow: true });
  const og = meta.openGraph as Record<string, unknown>;
  assert.equal(og.type, "article");
  assert.equal(og.url, canonical);
  assert.equal(og.publishedTime, post.published_at);
  assert.equal(og.modifiedTime, post.updated_at);
  assert.equal((meta.twitter as { card: string }).card, "summary_large_image");
  assert.deepEqual((og.images as unknown[])[0], {
    url: "https://api.example.test/v1/journal/assets/jna_cover0release01",
    width: 1600,
    height: 900,
    alt: post.cover?.alt,
  });
});

test("posts without a cover share the generated 1200×630 card", () => {
  const image = postImage(detail(2));
  assert.deepEqual(image, {
    url: "https://trytoone.com/journal/og/toone-pro-is-here.png",
    width: 1200,
    height: 630,
    alt: detail(2).heading,
    generated: true,
  });
});

test("BlogPosting carries the contract fields and mentions Explore records", () => {
  const post = detail(1);
  const schema = blogPostingSchema(post);
  assert.equal(schema["@type"], "BlogPosting");
  assert.equal(schema.headline, post.heading);
  assert.equal(schema.datePublished, post.published_at);
  assert.equal(schema.dateModified, post.updated_at);
  assert.deepEqual(schema.publisher, { "@id": "https://trytoone.com/#organization" });
  assert.deepEqual(schema.about, { "@id": "https://trytoone.com/#software" });
  assert.equal(schema.inLanguage, "en");
  assert.equal(schema.keywords, "ai agents for launch content, product launch content workflow");
  assert.deepEqual(schema.mainEntityOfPage, {
    "@type": "WebPage",
    "@id": "https://trytoone.com/en/journal/automating-launch-content-with-ai-agents",
  });
  assert.deepEqual(schema.author, {
    "@type": "Organization",
    name: "Toone Content",
    url: "https://trytoone.com/en/editorial-policy",
  });
  assert.deepEqual(
    schema.mentions?.map((item) => item.url),
    [
      "https://trytoone.com/en/explore/bundles/launch-kit-r5h8c2nd",
      "https://trytoone.com/en/explore/routines/product-launch-prep-directories-qk4m2x7a",
      "https://trytoone.com/en/explore/routines/retired-launch-checklist-zz9zz9zz",
    ],
  );
  assert.deepEqual(blogPostingSchema(detail(2)).author, { "@type": "Person", name: "Matheus Paranhos" });
  assert.equal("mentions" in blogPostingSchema(detail(2)), false);
});

test("breadcrumbs: Home › Journal › hub › post, and list pages", () => {
  const crumbs = postBreadcrumbSchema(detail(1)).itemListElement.map((item) => item.item);
  assert.deepEqual(crumbs, [
    "https://trytoone.com/en",
    "https://trytoone.com/en/journal",
    "https://trytoone.com/en/journal/routines",
    "https://trytoone.com/en/journal/automating-launch-content-with-ai-agents",
  ]);
  const hub = hubForSegment("releases");
  assert.equal(listBreadcrumbSchema(hub, 2).itemListElement.at(-1)?.item, "https://trytoone.com/en/journal/releases/page/2");
  const collection = collectionPageSchema(null, 1, [detail(0)]);
  assert.equal(collection["@type"], "CollectionPage");
  assert.equal(collection.mainEntity.itemListElement[0].url, "https://trytoone.com/en/journal/toone-1-0-79-release-notes");
});

test("list metadata is self-canonical and indexable on every page", () => {
  const hub = hubForSegment("launches");
  const meta = listMetadata(hub, 3);
  assert.equal(meta.alternates?.canonical, "https://trytoone.com/en/journal/launches/page/3");
  assert.deepEqual(meta.robots, { index: true, follow: true });
  assert.deepEqual(listMetadata(hub, 1, { empty: false }).robots, { index: true, follow: true });
  assert.equal(listPath(null), "/en/journal");
  assert.equal(listPath(hub, 1), "/en/journal/launches");
});

test("an empty hub or index is noindex, follow but keeps its canonical", () => {
  for (const hub of [hubForSegment("routines"), null]) {
    const meta = listMetadata(hub, 1, { empty: true });
    assert.deepEqual(meta.robots, { index: false, follow: true });
    assert.equal(meta.alternates?.canonical, `https://trytoone.com${listPath(hub)}`);
  }
});

test("previews are noindex, nofollow and have no canonical", () => {
  const meta = previewMetadata(detail(0));
  assert.deepEqual(meta.robots, { index: false, follow: false, nocache: true });
  assert.equal(meta.alternates?.canonical, null);
});

test("pagination parameters and page counts", () => {
  assert.equal(parsePageParam("2"), 2);
  for (const bad of ["0", "01", "+2", "2.0", "x", "", "999999"]) assert.equal(parsePageParam(bad), null, bad);
  assert.equal(pageCount(0, 12), 1);
  assert.equal(pageCount(12, 12), 1);
  assert.equal(pageCount(13, 12), 2);
});

test("disclosure copy for every assistance level", () => {
  assert.equal(disclosureText("none"), null);
  assert.match(disclosureText("assisted") ?? "", /AI assistance/);
  assert.match(disclosureText("drafted") ?? "", /AI agents/);
});

test("RSS 2.0: channel, self link, escaped items in order", () => {
  const entries = fixture.posts.map((post: unknown) => normalizePostEntry(post)!);
  entries[2] = { ...entries[2], title: "Tom & Jerry <script>" };
  const xml = buildRss(entries, new Date("2026-10-01T00:00:00Z"));
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0"/);
  assert.match(xml, /<atom:link href="https:\/\/trytoone.com\/journal\/feed.xml" rel="self" type="application\/rss\+xml"\/>/);
  assert.equal((xml.match(/<item>/g) ?? []).length, 3);
  assert.ok(xml.includes("<title>Tom &amp; Jerry &lt;script&gt;</title>"));
  assert.ok(!xml.includes("<script>"));
  assert.ok(xml.indexOf("toone-1-0-79-release-notes") < xml.indexOf("toone-pro-is-here"));
  assert.match(xml, /<pubDate>Mon, 28 Sep 2026 09:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<lastBuildDate>Wed, 30 Sep 2026 15:30:00 GMT<\/lastBuildDate>/);
  assert.equal(escapeXml("a\u0001b"), "ab");
});

test("RSS lastBuildDate is the newest instant, not the greatest string", () => {
  const [first, second] = fixture.posts.map((post: unknown) => normalizePostEntry(post)!);
  const xml = buildRss(
    [
      // Sorts after the second as a string, but is 08:00Z.
      { ...first, updated_at: "2026-09-30T10:00:00+02:00" },
      { ...second, updated_at: "2026-09-30T09:00:00Z" },
    ],
    new Date("2026-10-01T00:00:00Z"),
  );
  assert.match(xml, /<lastBuildDate>Wed, 30 Sep 2026 09:00:00 GMT<\/lastBuildDate>/);
  assert.match(buildRss([], new Date("2026-10-01T00:00:00Z")), /<lastBuildDate>Thu, 01 Oct 2026 00:00:00 GMT<\/lastBuildDate>/);
});

test("sitemap: published posts with updated_at, index and non-empty hubs by their own newest post; empty on outage", () => {
  const feed: JournalFeedItem[] = [
    { post_id: "jnp_aaaaaaaa", slug: "a-post", type: "release", state: "published", published_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-05T00:00:00Z", retired_at: null },
    { post_id: "jnp_bbbbbbbb", slug: "b-post", type: "launch", state: "published", published_at: "2026-09-02T00:00:00Z", updated_at: "2026-09-03T00:00:00Z", retired_at: null },
    { post_id: "jnp_cccccccc", slug: "c-post", type: "launch", state: "retired", published_at: "2026-08-01T00:00:00Z", updated_at: "2026-09-09T00:00:00Z", retired_at: "2026-09-09T00:00:00Z" },
  ];
  const xml = buildJournalSitemap(feed);
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(entries, [
    ["https://trytoone.com/en/journal", "2026-09-05T00:00:00.000Z"],
    ["https://trytoone.com/en/journal/releases", "2026-09-05T00:00:00.000Z"],
    // No published spotlight: the routines hub is omitted (it is noindex).
    // The retired launch's later date does not move the launches hub.
    ["https://trytoone.com/en/journal/launches", "2026-09-03T00:00:00.000Z"],
    ["https://trytoone.com/en/journal/a-post", "2026-09-05T00:00:00.000Z"],
    ["https://trytoone.com/en/journal/b-post", "2026-09-03T00:00:00.000Z"],
  ]);
  assert.ok(!xml.includes("c-post"), "retired posts are not listed");
  assert.match(xml, /hreflang="x-default" href="https:\/\/trytoone.com\/en\/journal\/a-post"/);
  assert.ok(!xml.includes("/en/journal/routines<"), "an empty hub is not listed");
  const onlyRetired = buildJournalSitemap([feed[2]]);
  assert.ok(!onlyRetired.includes("<url>"), "no published post: not even the index is listed");
  const empty = buildJournalSitemap(null);
  assert.ok(empty.includes("<urlset") && empty.includes("</urlset>") && !empty.includes("<url>"));
});
