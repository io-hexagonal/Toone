#!/usr/bin/env node
/**
 * Fixture-backed mock of the public Explore API (contract §3, §5).
 *
 * Serves tests/explore/fixtures/*.json (snapshots of the shared contract) under the
 * contract routes so the site can be developed without the Go server:
 *
 *   npm run explore:mock
 *   EXPLORE_API_BASE_URL=http://localhost:8787/v1 npm run dev
 *
 * No dependencies. Routes: /v1/workflows, /v1/workflows/{id-or-slug},
 * /v1/bundles, /v1/bundles/{id-or-slug}, /v1/explore/feed, /v1/explore/tags
 * and both cover.jpg routes (a 1x1 JPEG). Lists set X-Total-Count and every
 * success is wrapped in the {data} envelope.
 *
 * Listing profiles (contract §13): the fixture routine is always served in
 * its legacy shape (no profile), so its page keeps the fallback layout.
 * Three schema-3 records are synthesized from `listing-profile.json` (or the
 * profile carried by `routine-detail.json`, when the fixture has one):
 * a profile routine, the same with `indexable: false`, and a bundle with a
 * profile. The feed lists all three with their `indexable` flag. Mode
 * `{"profiles":true}` also lists them in the catalogs (off by default so the
 * legacy two-card assertions hold); `{"malformedProfile":true}` corrupts the
 * profile routine's profile to exercise the fallback.
 *
 * Journal (docs/architecture/journal/contract.md §7): `tests/journal/fixtures/
 * journal.json` holds one post of each type (a release with a cover and an
 * inline image, a spotlight with Explore blocks including one record the mock
 * does not serve, a launch without a cover), a retired post with a redirect,
 * one without, and a draft preview token. Twelve older release posts are
 * synthesized so the index and the releases hub have a second page. Routes:
 * /v1/journal/posts (type, explore, limit, offset), /v1/journal/posts/{id-or-slug}
 * (410 for retired posts), /v1/journal/feed, /v1/journal/previews/{token},
 * /v1/journal/assets/{jna_id} (generated PNGs). Modes `{"journal404":true}`
 * (a server that predates the Journal) and `{"journalUnavailable":true}`
 * (503 on every Journal route) exercise the fallbacks; `{"journalTitle":"…"}`
 * retitles the newest post to prove caching and webhook eviction;
 * `{"journalHide":["launch"]}` unpublishes every post of the listed types.
 *
 * Env: PORT (default 8787), EXPLORE_FIXTURES_DIR (default: checked-in test fixtures),
 * EXPLORE_MOCK_ENRICH=1 adds a sample skill, prerequisites and escalation to
 * the routine detail so those renderers can be exercised locally.
 */
import fs from "node:fs";
import http from "node:http";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir =
  process.env.EXPLORE_FIXTURES_DIR ||
  path.resolve(here, "../tests/explore/fixtures");
const port = Number(process.env.PORT || 8787);
const enrich = process.env.EXPLORE_MOCK_ENRICH === "1";

function fixture(name) {
  const file = path.join(fixturesDir, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.error(
      `[explore-mock] missing fixture ${file}. Set EXPLORE_FIXTURES_DIR.`,
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const routineEntry = fixture("routine-entry");
const routineDetail = fixture("routine-detail");
const bundleEntry = fixture("bundle-entry");
const bundleDetail = fixture("bundle-detail");
const feed = fixture("feed");
const tags = fixture("tags");
const listingProfile = fixture("listing-profile");

// The main fixture routine always renders the legacy layout.
const PROFILE_KEYS = ["listing_profile", "indexable", "third_party_reviews", "related"];
const fixtureProfile = routineDetail.listing_profile ?? null;
for (const key of PROFILE_KEYS) delete routineDetail[key];
for (const key of ["display_title", "card_summary", "results_count"]) delete routineEntry[key];

if (enrich) {
  routineDetail.package.skills = [
    {
      id: "peer2paper/audit-report-style",
      markdown:
        "# Audit report style\n\nUse this skill when rendering the final audit.\n\n" +
        "## Rules\n\n- Keep numbers exact; never round in prose.\n- Cite the frozen case id.\n\n" +
        "| Section | Required |\n| --- | --- |\n| Summary | yes |\n| Limitations | yes |\n\n" +
        "<script>alert('raw html must not render')</script>",
      metadata_json: null,
      semantic_hash:
        "0000000000000000000000000000000000000000000000000000000000000001",
    },
  ];
  const root = routineDetail.package.members.find(
    (m) => m.key === routineDetail.package.root_key,
  );
  root.payload.prerequisites =
    "- A local Python 3.11 environment.\n- Read access to the case bundle directory.";
  root.payload.escalation =
    "Stop and hand back to the caller when a required file is missing or the claim cannot be pinned to one estimand.";
  routineDetail.package.requirements.mcp_ids = ["toone-scholar"];
  routineDetail.package.requirements.model_ids = ["claude-opus"];
}

// Bundle members are RoutineCatalogEntry + position/pin fields; strip those to
// list them as bundle_only routines and to synthesize a detail page for each.
const memberEntries = bundleDetail.members.map(
  ({ position, pinned_revision_id, newer_revision_available, ...entry }) =>
    entry,
);
const routineEntries = [routineEntry, ...memberEntries];

function memberDetail(entry) {
  const listed = feed.items.find((item) => item.id === entry.workflow_id);
  return {
    ...entry,
    indexable: listed?.indexable !== false,
    sequence: 1,
    package_schema_version: 2,
    included_in_bundles: [
      {
        bundle_id: bundleDetail.bundle_id,
        slug: bundleDetail.slug,
        title: bundleDetail.title,
      },
    ],
    package: {
      format_version: 2,
      routine_schema_version: 2,
      root_key: "root",
      members: [
        {
          key: "root",
          source_routine_id: `mock/${entry.slug}`,
          payload: {
            name: entry.title,
            purpose: entry.summary,
            steps: [
              {
                id: "step-1",
                title: "Collect inputs",
                description:
                  "Gather the inputs this routine needs before it starts.",
                completionCriteria: ["Every required input is present."],
              },
              {
                id: "step-2",
                title: "Produce the result",
                description: "Run the work and write the declared artefacts.",
                completionCriteria: [
                  "The artefacts exist and pass their checks.",
                ],
              },
            ],
          },
        },
      ],
      requirements: {
        agent_ids: [],
        skill_ids: [],
        model_ids: [],
        mcp_ids: [],
        resource_bindings: [],
      },
      agents: [],
      skills: [],
      resources: [],
    },
  };
}

/** §2.3 public projection: the two private fields are never published. */
function publicProfile(profile) {
  const { author_ran_it, related_hints, ...rest } = structuredClone(profile);
  return rest;
}
const profileBase = fixtureProfile ? publicProfile(fixtureProfile) : publicProfile(listingProfile);
const classification = {
  schema_version: 1,
  taxonomy_version: "2026-09-01",
  input_hash: "0".repeat(64),
  category_id: "cat_marketing-sales",
  topic_ids: ["topic_product-launch"],
  useful_for_ids: profileBase.for_whom.map((entry) => entry.useful_for_id),
  explanation: "Prepares a product launch across launch sites.",
};
const launchPackage = {
  format_version: 2,
  routine_schema_version: 2,
  minimum_app_version: "1.0.77",
  root_key: "root",
  members: [
    {
      key: "root",
      source_routine_id: "growth/launch-surface-preparation",
      payload: {
        name: "Launch Surface Preparation",
        purpose: "Research selected launch websites, prepare authorized accounts and product profiles, and create a site-specific launch strategy and unpublished draft.",
        prerequisites: "- A list of launch sites.\n- Approved product facts.",
        escalation: "Stop at CAPTCHAs, email verification and billing, and hand back to the user.",
        inputs: [
          { id: "input-sites", description: "Launch sites", requirement: "dispatch" },
          { id: "input-product-facts", description: "Approved product facts", requirement: "dispatch" },
        ],
        artefacts: [
          { id: "artefact-readiness-report", name: "Launch readiness report", format: "markdown" },
          { id: "artefact-status-register", name: "Site status register", format: "csv" },
        ],
        steps: [
          { id: "step-1", title: "Validate the site list", description: "Check every site is reachable and in scope.", completionCriteria: ["Every site is marked in scope or out of scope."], executorAgentId: "agent-launch" },
          { id: "step-2", title: "Research site rules", description: "Read each site's official rules, costs and requirements.", completionCriteria: ["Each site has dated sources."], executorAgentId: "agent-launch" },
          { id: "step-3", title: "Write the launch plans", description: "Write a plan and an unpublished draft per site.", completionCriteria: ["Each in-scope site has a plan and a draft."], outcomes: [{ id: "ready", description: "Plans written", isTerminal: true }] },
        ],
      },
    },
  ],
  requirements: { agent_ids: [], skill_ids: [], model_ids: [], mcp_ids: ["toone-browser"], resource_bindings: [] },
  agents: [
    { source_id: "agent-launch", name: "Launch Operator", description: "Researches launch sites and prepares drafts.", capabilities: ["Research", "Drafting"], skill_ids: [], mcp_ids: ["toone-browser"] },
  ],
  skills: [],
  resources: [],
};
function profileRoutine({ id, slug, revision, seoTitle, indexable, official = false }) {
  const profile = structuredClone(profileBase);
  if (seoTitle) profile.search.seo_title = seoTitle;
  const entry = {
    classification,
    workflow_id: id,
    slug,
    revision_id: revision,
    title: "Launch Surface Preparation",
    summary: "Research selected launch websites, prepare authorized accounts and product profiles, and create a site-specific launch strategy and unpublished draft.",
    tags: ["launch"],
    license: "toone-community-v1",
    listing: "standalone",
    content_hash: "1".repeat(64),
    routine_schema_version: 2,
    member_count: 1,
    sub_routine_count: 0,
    step_count: 3,
    agent_count: 1,
    cover_url: `workflows/${id}/revisions/${revision}/cover.jpg`,
    author_name: "Matheus Paranhos",
    author_official: official,
    approved_at: "2026-09-22T12:00:00Z",
    display_title: profile.search.display_title,
    card_summary: profile.search.meta_description,
    results_count: profile.results.length,
  };
  const detail = {
    ...entry,
    sequence: 2,
    package_schema_version: 2,
    included_in_bundles: [],
    package: structuredClone(launchPackage),
    listing_profile: profile,
    indexable,
    third_party_reviews: profile.third_parties.map((site) => ({
      domain: site.domain,
      status: "well_known",
      note: "",
    })),
    related: [structuredClone(routineEntry)],
  };
  return { entry, detail };
}
const profileRoutines = [
  profileRoutine({
    id: "wfl_lnchprepqk4m2x7a",
    slug: "product-launch-prep-directories-qk4m2x7a",
    revision: "wfr_lnchprep0000rev2",
    indexable: true,
    official: true,
  }),
  profileRoutine({
    id: "wfl_lnchdraftw9t3v6pe",
    slug: "product-launch-prep-draft-w9t3v6pe",
    revision: "wfr_lnchdraft000rev1",
    seoTitle: "Draft Launch Prep Routine",
    indexable: false,
  }),
];
const profileBundleId = "wfb_lnchkitr5h8c2nd";
const profileBundle = {
  classification,
  bundle_id: profileBundleId,
  slug: "launch-kit-r5h8c2nd",
  revision_id: "wbr_lnchkit00000rev1",
  sequence: 1,
  title: "Launch Kit",
  summary: "Routines that prepare a product launch.",
  tags: ["launch"],
  content_hash: "2".repeat(64),
  member_count: 2,
  cover_url: `bundles/${profileBundleId}/revisions/wbr_lnchkit00000rev1/cover.jpg`,
  author_name: "Matheus Paranhos",
  author_official: true,
  approved_at: "2026-09-22T12:00:00Z",
  display_title: "Launch kit: plan and prepare your product launch",
  card_summary: profileBase.search.meta_description,
  results_count: profileBase.results.length,
  listing_profile: {
    ...structuredClone(profileBase),
    search: {
      ...profileBase.search,
      display_title: "Launch kit: plan and prepare your product launch",
      seo_title: "Product Launch Kit: Plan and Prepare Your Launch",
    },
  },
  indexable: true,
  third_party_reviews: [],
  related: [],
  members: [profileRoutines[0].entry, routineEntry].map((entry, position) => ({
    ...structuredClone(entry),
    position,
    pinned_revision_id: entry.revision_id,
    newer_revision_available: false,
  })),
};
for (const { detail } of profileRoutines)
  detail.included_in_bundles = [
    { bundle_id: profileBundle.bundle_id, slug: profileBundle.slug, title: profileBundle.title },
  ];
const profileFeedItems = [
  ...profileRoutines.map(({ detail }) => ({
    type: "routine",
    id: detail.workflow_id,
    slug: detail.slug,
    approved_at: detail.approved_at,
    updated_at: detail.approved_at,
    indexable: detail.indexable,
  })),
  {
    type: "bundle",
    id: profileBundle.bundle_id,
    slug: profileBundle.slug,
    approved_at: profileBundle.approved_at,
    updated_at: profileBundle.approved_at,
    indexable: true,
  },
];
function withMode(detail) {
  if (!mode.malformedProfile || detail.workflow_id !== profileRoutines[0].detail.workflow_id)
    return detail;
  return { ...detail, listing_profile: { profile_schema_version: 1, answer: 42 } };
}

// Use the canonical fixture JPEG, including its complete decoder markers.
const COVER = Buffer.from(
  routineEntry.cover_image_data_url.split(",")[1],
  "base64",
);

const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

/* ---------- Journal ---------- */

const journalFixture = JSON.parse(
  fs.readFileSync(
    process.env.JOURNAL_FIXTURE ||
      path.resolve(here, "../tests/journal/fixtures/journal.json"),
    "utf8",
  ),
);

/** A two-colour diagonal gradient PNG, so covers look like covers. */
function gradientPng(width, height, from, to) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "ascii");
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([Buffer.from(type, "ascii"), data])), 0);
    return Buffer.concat([head, data, tail]);
  };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2;
      for (let c = 0; c < 3; c++)
        raw[row + 1 + x * 3 + c] = Math.round(from[c] + (to[c] - from[c]) * t);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const journalAssets = new Map();
for (const post of [...journalFixture.posts, ...journalFixture.previews]) {
  for (const [id, asset] of Object.entries(post.assets ?? {})) {
    if (journalAssets.has(id)) continue;
    const palette = id.includes("cover")
      ? [[34, 40, 92], [174, 186, 244]]
      : [[20, 20, 19], [86, 108, 207]];
    journalAssets.set(id, gradientPng(asset.width, asset.height, ...palette));
  }
}

/** Twelve older releases: page 2 of the index and of the releases hub. */
const fillerReleases = Array.from({ length: 12 }, (_, index) => {
  const patch = 78 - index;
  const day = String(20 - index).padStart(2, "0");
  const slug = `toone-1-0-${patch}-release-notes`;
  return {
    post_id: `jnp_fill${String(patch).padStart(4, "0")}abcd123`,
    slug,
    type: "release",
    title: `Toone 1.0.${patch} Release Notes`,
    heading: `What changed in Toone 1.0.${patch}`,
    description: `Toone 1.0.${patch} for macOS: fixes and refinements to routines, agents and the Explore install flow, on the direct download and the Mac App Store.`,
    author: { name: "Toone Content", type: "Organization", url: "/en/editorial-policy" },
    assistance: "assisted",
    release: { version: `1.0.${patch}`, channels: ["direct"] },
    cover: null,
    explore_refs: [],
    read_minutes: 2,
    published_at: `2026-09-${day}T09:00:00Z`,
    updated_at: `2026-09-${day}T09:00:00Z`,
    state: "published",
    revision_id: `jnr_fill${String(patch).padStart(4, "0")}rev001`,
    content_hash: "e".repeat(64),
    keywords: { primary: `toone 1.0.${patch} release notes`, secondary: [] },
    body: `Toone 1.0.${patch} is a maintenance release.\n\n## Fixes\n\n- Routine runs recover cleanly after the Mac sleeps.\n- Agent names wrap instead of clipping.\n\nSee every version on the [releases page](/journal/releases).\n`,
    assets: {},
  };
});
const journalPosts = [...journalFixture.posts, ...fillerReleases].sort(
  (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at),
);
/**
 * `{"journalHide": ["spotlight", …]}` unpublishes every post of those types
 * (lists, detail, feed): an empty hub, or a post that appears on "publish"
 * when the mode is cleared again (webhook freshness proof).
 */
const livePosts = () =>
  Array.isArray(mode.journalHide)
    ? journalPosts.filter((post) => !mode.journalHide.includes(post.type))
    : journalPosts;
const ENTRY_KEYS = [
  "post_id", "slug", "type", "title", "heading", "description", "author",
  "assistance", "release", "cover", "explore_refs", "read_minutes",
  "published_at", "updated_at",
];
const DETAIL_KEYS = [...ENTRY_KEYS, "revision_id", "content_hash", "body", "keywords", "assets"];
const pick = (post, keys) => {
  // `{"journalTitle": "…"}` retitles the newest post (cache/webhook proof).
  const source =
    mode.journalTitle && post.post_id === journalFixture.posts[0].post_id
      ? { ...post, title: mode.journalTitle }
      : post;
  return Object.fromEntries(keys.map((key) => [key, source[key] ?? null]));
};
function journalFind(value) {
  return (
    livePosts().find((post) => post.post_id === value || post.slug === value) ??
    journalFixture.retired.find((post) => post.post_id === value || post.slug === value) ??
    null
  );
}

function handleJournal(req, res, p, url, log) {
  if (mode.journal404) {
    log(404);
    return notFound(res);
  }
  if (mode.journalUnavailable) {
    log(503);
    return json(res, 503, { code: "unavailable", message: "Fixture Journal unavailable" });
  }
  let match;
  if (p === "/v1/journal/posts") {
    const type = url.searchParams.get("type");
    const explore = url.searchParams.get("explore");
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 100);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
    let items = livePosts();
    if (type) items = items.filter((post) => post.type === type);
    if (explore)
      items = items.filter((post) =>
        post.explore_refs.some((ref) => ref.slug === explore || ref.id === explore),
      );
    log(200);
    return ok(
      res,
      items.slice(offset, offset + limit).map((post) => pick(post, ENTRY_KEYS)),
      { "X-Total-Count": String(items.length) },
    );
  }
  if ((match = p.match(/^\/v1\/journal\/posts\/([^/]+)$/))) {
    const post = journalFind(decodeURIComponent(match[1]));
    if (!post) {
      log(404);
      return notFound(res);
    }
    if (post.state === "retired") {
      log(410);
      return json(res, 410, {
        code: "gone",
        message: "This post was retired.",
        redirect_slug: post.redirect_slug ?? null,
      });
    }
    log(200);
    return detail(req, res, pick(post, DETAIL_KEYS));
  }
  if (p === "/v1/journal/feed") {
    const since = url.searchParams.get("since");
    const items = [...livePosts(), ...journalFixture.retired]
      .map((post) => ({
        post_id: post.post_id,
        slug: post.slug,
        type: post.type,
        state: post.state,
        published_at: post.published_at,
        updated_at: post.updated_at,
        retired_at: post.retired_at ?? null,
      }))
      .filter((item) => !since || (item.retired_at ?? item.updated_at) >= since);
    log(200);
    return ok(res, items);
  }
  if ((match = p.match(/^\/v1\/journal\/previews\/([^/]+)$/))) {
    const preview = journalFixture.previews.find(
      (item) => item.token === decodeURIComponent(match[1]),
    );
    if (!preview) {
      log(404);
      res.writeHead(404, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      return res.end(JSON.stringify({ code: "not_found", message: "not found" }));
    }
    log(200);
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(
      JSON.stringify({
        data: {
          ...pick(preview, DETAIL_KEYS),
          published_at: preview.published_at || null,
          updated_at: preview.updated_at || null,
          preview: true,
          state: preview.state,
        },
      }),
    );
  }
  if ((match = p.match(/^\/v1\/journal\/assets\/(jna_[a-z0-9]{8,32})$/))) {
    const bytes = journalAssets.get(match[1]);
    if (!bytes) {
      log(404);
      return notFound(res);
    }
    log(200);
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(bytes);
  }
  log(404);
  return notFound(res);
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": PUBLIC_CACHE,
    "Access-Control-Allow-Origin": "*",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function ok(res, data, extra = {}) {
  json(res, 200, { data }, extra);
}

function detail(req, res, data) {
  const etag = `"${createHash("sha256").update(JSON.stringify(data)).digest("hex")}"`;
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, { ETag: etag, "Cache-Control": PUBLIC_CACHE });
    return res.end();
  }
  return ok(res, data, { ETag: etag });
}

function list(res, items) {
  ok(res, items, { "X-Total-Count": String(items.length) });
}

function notFound(res) {
  json(res, 404, { code: "not_found", message: "not found" });
}

function byIdOrSlug(items, idField, value) {
  return (
    items.find((item) => item[idField] === value || item.slug === value) ?? null
  );
}

function applyListQuery(items, params) {
  const tag = params.get("tag");
  const query = params.get("query")?.toLowerCase();
  const limit = Math.min(Math.max(Number(params.get("limit") || 20), 1), 100);
  const offset = Math.max(Number(params.get("offset") || 0), 0);
  let filtered = items;
  if (tag) filtered = filtered.filter((item) => item.tags.includes(tag));
  if (query) {
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query),
    );
  }
  return {
    total: filtered.length,
    page: filtered.slice(offset, offset + limit),
  };
}

let mode = {};
function project(data) {
  if (Array.isArray(data)) return data.map(project);
  if (!data || typeof data !== "object") return data;
  const item = structuredClone(data);
  if (item.workflow_id === routineEntry.workflow_id && mode.title)
    item.title = mode.title;
  if (mode.edge && item.title) {
    item.title =
      "Inspect a very long routine title " + "unbrokentoken".repeat(7);
    item.summary = "A long summary for layout testing. ".repeat(25);
    item.tags = [];
  }
  if (mode.edge || mode.noCovers) {
    delete item.cover_url;
    delete item.cover_image_data_url;
  }
  // Pre-contract server: only the inline data-URL cover exists.
  if (mode.dataUrlCovers) {
    delete item.cover_url;
    item.cover_image_data_url = `data:image/jpeg;base64,${COVER.toString("base64")}`;
  }
  // Reviewer-only fields the contract forbids on public shapes (§5.2); the
  // web must allow-list them away.
  if (item.package && mode.edge) {
    item.submitted_by = "usr_reviewer_leak_test";
    item.reviewed_by = "usr_reviewer_leak_test";
    item.review_reason = "review-reason-leak-test";
    item.status = "approved";
  }
  if (item.package && mode.edge) {
    item.package.members[0].payload.purpose =
      "Averylongunbrokenpublictoken".repeat(25);
    item.package.skills = [
      {
        id: "edge/safe-markdown",
        markdown:
          "# Safety fixture\n\n[Unsafe](javascript:alert(1)) [Data](data:text/html,bad) [Safe](https://example.com)\n\n<script>alert('edge-script')</script>\n\n<img src=x onerror=alert(1) />",
        semantic_hash: "0".repeat(64),
      },
    ];
  }
  if (item.members) item.members = item.members.map(project);
  return item;
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const p = url.pathname.replace(/\/+$/, "");
  const log = (status) =>
    console.log(`${status} ${req.method} ${url.pathname}${url.search}`);

  // Test-only controls are disabled unless explicitly enabled, and the mock binds loopback only.
  if (
    p === "/__test/mode" &&
    process.env.EXPLORE_MOCK_ALLOW_CONTROL === "1" &&
    req.method === "POST"
  ) {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 8192) return json(res, 413, {});
    }
    try {
      mode = JSON.parse(body);
      return json(res, 200, { data: mode });
    } catch {
      return json(res, 400, {});
    }
  }
  if (mode.delayMs)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(Number(mode.delayMs) || 0, 10000)),
    );
  if (mode.unavailable)
    return json(res, 503, {
      code: "unavailable",
      message: "Fixture API unavailable",
    });
  if (req.method !== "GET") {
    log(405);
    return json(res, 405, { code: "invalid_input", message: "GET only" });
  }

  if (p.startsWith("/v1/journal/")) return handleJournal(req, res, p, url, log);

  let match;
  if (p === "/v1/workflows") {
    const listing = url.searchParams.get("listing") || "standalone";
    const catalog = mode.profiles
      ? [...routineEntries, ...profileRoutines.map(({ entry }) => entry)]
      : routineEntries;
    const scoped =
      listing === "all"
        ? catalog
        : catalog.filter(
            (item) => (item.listing || "standalone") === listing,
          );
    const visible = mode.empty
      ? []
      : scoped.filter(
          (item) =>
            !mode.removed || item.workflow_id !== routineEntry.workflow_id,
        );
    const { total, page } = applyListQuery(project(visible), url.searchParams);
    log(200);
    return ok(res, page, { "X-Total-Count": String(total) });
  }
  if (
    (match = p.match(
      /^\/v1\/workflows\/([^/]+)\/revisions\/([^/]+)\/cover\.jpg$/,
    ))
  ) {
    log(200);
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(COVER);
  }
  if ((match = p.match(/^\/v1\/workflows\/([^/]+)$/))) {
    const value = decodeURIComponent(match[1]);
    if (value === routineDetail.workflow_id || value === routineDetail.slug) {
      if (mode.removed) return notFound(res);
      log(200);
      return detail(req, res, project(routineDetail));
    }
    const withProfile = profileRoutines.find(
      ({ detail: item }) => item.workflow_id === value || item.slug === value,
    );
    if (withProfile) {
      log(200);
      return detail(req, res, project(withMode(withProfile.detail)));
    }
    const member = byIdOrSlug(memberEntries, "workflow_id", value);
    if (member) {
      log(200);
      return detail(req, res, project(memberDetail(member)));
    }
    log(404);
    return notFound(res);
  }
  // Pre-contract server: the bundles routes do not exist yet.
  if (mode.bundles404 && p.startsWith("/v1/bundles")) {
    log(404);
    return notFound(res);
  }
  if (p === "/v1/bundles") {
    const { total, page } = applyListQuery(
      mode.empty
        ? []
        : project(mode.profiles ? [bundleEntry, profileBundle] : [bundleEntry]),
      url.searchParams,
    );
    log(200);
    return ok(res, page, { "X-Total-Count": String(total) });
  }
  if (
    (match = p.match(
      /^\/v1\/bundles\/([^/]+)\/revisions\/([^/]+)\/cover\.jpg$/,
    ))
  ) {
    log(200);
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    return res.end(COVER);
  }
  if ((match = p.match(/^\/v1\/bundles\/([^/]+)$/))) {
    const value = decodeURIComponent(match[1]);
    if (value === bundleDetail.bundle_id || value === bundleDetail.slug) {
      log(200);
      return detail(req, res, project(bundleDetail));
    }
    if (value === profileBundle.bundle_id || value === profileBundle.slug) {
      log(200);
      return detail(req, res, project(profileBundle));
    }
    log(404);
    return notFound(res);
  }
  if (p === "/v1/explore/feed") {
    const since = url.searchParams.get("since");
    const visible = mode.empty
      ? []
      : [...feed.items, ...profileFeedItems].filter(
          (item) => !mode.removed || item.id !== routineEntry.workflow_id,
        );
    const items = since
      ? visible.filter((item) => item.updated_at > since)
      : visible;
    log(200);
    return ok(res, { ...feed, items });
  }
  if (p === "/v1/explore/tags") {
    log(200);
    return list(res, mode.empty || mode.edge ? [] : tags);
  }
  log(404);
  return notFound(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[explore-mock] serving ${fixturesDir}`);
  console.log(
    `[explore-mock] http://localhost:${port}/v1  (EXPLORE_API_BASE_URL=http://localhost:${port}/v1)`,
  );
  if (enrich)
    console.log(
      "[explore-mock] enrichment on: sample skill, prerequisites, escalation",
    );
});
