#!/usr/bin/env node
/**
 * Fixture-backed mock of the public Explore API (contract §3, §5).
 *
 * Serves docs/architecture/explore/fixtures/*.json from the monorepo under the
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
 * Env: PORT (default 8787), EXPLORE_FIXTURES_DIR (default: the monorepo path),
 * EXPLORE_MOCK_ENRICH=1 adds a sample skill, prerequisites and escalation to
 * the routine detail so those renderers can be exercised locally.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir =
  process.env.EXPLORE_FIXTURES_DIR ||
  path.resolve(here, "../../../docs/architecture/explore/fixtures");
const port = Number(process.env.PORT || 8787);
const enrich = process.env.EXPLORE_MOCK_ENRICH === "1";

function fixture(name) {
  const file = path.join(fixturesDir, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.error(`[explore-mock] missing fixture ${file}. Set EXPLORE_FIXTURES_DIR.`);
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
      semantic_hash: "0000000000000000000000000000000000000000000000000000000000000001",
    },
  ];
  const root = routineDetail.package.members.find((m) => m.key === routineDetail.package.root_key);
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
  ({ position, pinned_revision_id, newer_revision_available, ...entry }) => entry,
);
const routineEntries = [routineEntry, ...memberEntries];

function memberDetail(entry) {
  return {
    ...entry,
    sequence: 1,
    package_schema_version: 2,
    included_in_bundles: [
      { bundle_id: bundleDetail.bundle_id, slug: bundleDetail.slug, title: bundleDetail.title },
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
                description: "Gather the inputs this routine needs before it starts.",
                completionCriteria: ["Every required input is present."],
              },
              {
                id: "step-2",
                title: "Produce the result",
                description: "Run the work and write the declared artefacts.",
                completionCriteria: ["The artefacts exist and pass their checks."],
              },
            ],
          },
        },
      ],
      requirements: { agent_ids: [], skill_ids: [], model_ids: [], mcp_ids: [], resource_bindings: [] },
      agents: [],
      skills: [],
      resources: [],
    },
  };
}

// Smallest valid baseline JPEG (1x1, grey).
const COVER = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  "base64",
);

const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=3600";

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

function list(res, items) {
  ok(res, items, { "X-Total-Count": String(items.length) });
}

function notFound(res) {
  json(res, 404, { code: "not_found", message: "not found" });
}

function byIdOrSlug(items, idField, value) {
  return items.find((item) => item[idField] === value || item.slug === value) ?? null;
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
        item.title.toLowerCase().includes(query) || item.summary.toLowerCase().includes(query),
    );
  }
  return { total: filtered.length, page: filtered.slice(offset, offset + limit) };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const p = url.pathname.replace(/\/+$/, "");
  const log = (status) => console.log(`${status} ${req.method} ${url.pathname}${url.search}`);

  if (req.method !== "GET") {
    log(405);
    return json(res, 405, { code: "invalid_input", message: "GET only" });
  }

  let match;
  if (p === "/v1/workflows") {
    const listing = url.searchParams.get("listing") || "standalone";
    const scoped =
      listing === "all"
        ? routineEntries
        : routineEntries.filter((item) => (item.listing || "standalone") === listing);
    const { total, page } = applyListQuery(scoped, url.searchParams);
    log(200);
    return ok(res, page, { "X-Total-Count": String(total) });
  }
  if ((match = p.match(/^\/v1\/workflows\/([^/]+)\/revisions\/([^/]+)\/cover\.jpg$/))) {
    log(200);
    res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" });
    return res.end(COVER);
  }
  if ((match = p.match(/^\/v1\/workflows\/([^/]+)$/))) {
    const value = decodeURIComponent(match[1]);
    if (value === routineDetail.workflow_id || value === routineDetail.slug) {
      log(200);
      return ok(res, routineDetail, { ETag: `"${routineDetail.content_hash}"` });
    }
    const member = byIdOrSlug(memberEntries, "workflow_id", value);
    if (member) {
      log(200);
      return ok(res, memberDetail(member), { ETag: `"${member.content_hash}"` });
    }
    log(404);
    return notFound(res);
  }
  if (p === "/v1/bundles") {
    const { total, page } = applyListQuery([bundleEntry], url.searchParams);
    log(200);
    return ok(res, page, { "X-Total-Count": String(total) });
  }
  if ((match = p.match(/^\/v1\/bundles\/([^/]+)\/revisions\/([^/]+)\/cover\.jpg$/))) {
    log(200);
    res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" });
    return res.end(COVER);
  }
  if ((match = p.match(/^\/v1\/bundles\/([^/]+)$/))) {
    const value = decodeURIComponent(match[1]);
    if (value === bundleDetail.bundle_id || value === bundleDetail.slug) {
      log(200);
      return ok(res, bundleDetail, { ETag: `"${bundleDetail.content_hash}"` });
    }
    log(404);
    return notFound(res);
  }
  if (p === "/v1/explore/feed") {
    const since = url.searchParams.get("since");
    const items = since ? feed.items.filter((item) => item.updated_at > since) : feed.items;
    log(200);
    return ok(res, { ...feed, items });
  }
  if (p === "/v1/explore/tags") {
    log(200);
    return list(res, tags);
  }
  log(404);
  return notFound(res);
});

server.listen(port, () => {
  console.log(`[explore-mock] serving ${fixturesDir}`);
  console.log(`[explore-mock] http://localhost:${port}/v1  (EXPLORE_API_BASE_URL=http://localhost:${port}/v1)`);
  if (enrich) console.log("[explore-mock] enrichment on: sample skill, prerequisites, escalation");
});
