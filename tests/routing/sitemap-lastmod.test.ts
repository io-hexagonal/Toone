import assert from "node:assert/strict";
import { test } from "node:test";
import { GET as siteSitemap } from "../../app/sitemap.xml/route";

/**
 * TECH-013: `lastmod` is the content's git date. With git history present
 * (local builds, this test), routes backed by a tracked file get a real date.
 * The no-git case lives in sitemap-lastmod-nogit.test.ts (separate process,
 * because git dates are cached per process).
 */

function entries(xml: string): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const match of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
    map.set(match[1], match[2] ?? null);
  }
  return map;
}

test("with git history, routes carry their commit date as lastmod", async () => {
  const xml = await (await siteSitemap()).text();
  const map = entries(xml);
  for (const loc of [
    "https://trytoone.com/en",
    "https://trytoone.com/en/how-to",
    "https://trytoone.com/en/how-to/features/explore",
    "https://trytoone.com/en/about",
    "https://trytoone.com/en/explore",
  ]) {
    assert.ok(map.has(loc), `${loc} is listed`);
    assert.match(map.get(loc) ?? "", /^\d{4}-\d{2}-\d{2}$/, `${loc} has a git lastmod`);
  }
});
