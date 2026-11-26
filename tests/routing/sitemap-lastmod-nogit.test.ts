import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { ROUTE_SOURCES } from "../../lib/route-sources";

/**
 * TECH-013 / A2: the build host has no usable git history (Vercel builds from
 * a shallow clone, where every old file looks changed by the oldest commit
 * present). The sitemap must not depend on it: its dates come from the
 * committed lib/content-dates.json. GIT_DIR points git at nothing, so any git
 * lookup would fail; every URL still gets its manifest date and nothing warns.
 * A route built from components is dated by the latest of its sources.
 */
process.env.GIT_DIR = "/nonexistent-toone-git-dir";

const SOURCES: Record<string, readonly string[]> = {
  "https://trytoone.com/en": ROUTE_SOURCES[""],
  "https://trytoone.com/en/privacy": ROUTE_SOURCES["/privacy"],
  "https://trytoone.com/en/pricing": ROUTE_SOURCES["/pricing"],
  "https://trytoone.com/en/explore": ROUTE_SOURCES["/explore"],
  // /business, /contact and /governance are `noindex` and out of the sitemap
  // since 2026-11-26 (indexing plan A3, A4).
};

test("without git, every URL still carries its content date from the manifest", async () => {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => void warnings.push(args.join(" "));
  let xml: string;
  try {
    const { GET } = await import("../../app/sitemap.xml/route");
    xml = await (await GET()).text();
  } finally {
    console.warn = original;
  }

  const manifest = JSON.parse(fs.readFileSync("lib/content-dates.json", "utf8")) as Record<string, string>;
  const urls = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)];
  assert.ok(urls.length > 10, "sitemap lists URLs");
  assert.ok(!xml.includes("<lastmod></lastmod>") && !xml.includes("null"), "no empty or null lastmod");
  assert.deepEqual(urls.filter((m) => !m[2]).map((m) => m[1]), [], "no URL without a lastmod");
  assert.equal(warnings.find((w) => w.startsWith("[sitemap] WARNING")), undefined, "no omitted-date warning");

  const lastmod = new Map(urls.map((m) => [m[1], m[2]]));
  for (const [loc, sources] of Object.entries(SOURCES)) {
    const latest = sources.map((file) => manifest[file]).sort().at(-1);
    assert.ok(latest, `${loc}: its sources are in the manifest`);
    assert.equal(lastmod.get(loc), latest, `${loc} is dated by the latest of ${sources.join(", ")}`);
  }
  // The homepage is dated by its sections, not by page.tsx alone.
  const landing = ROUTE_SOURCES[""].map((file) => manifest[file]).sort().at(-1)!;
  assert.ok(landing >= manifest["app/[locale]/page.tsx"]);
});
