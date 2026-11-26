import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

/**
 * TECH-013 / A2: the build host has no usable git history (Vercel builds from
 * a shallow clone, where every old file looks changed by the oldest commit
 * present). The sitemap must not depend on it: its dates come from the
 * committed lib/content-dates.json. GIT_DIR points git at nothing, so any git
 * lookup would fail; every URL still gets its manifest date and nothing warns.
 */
process.env.GIT_DIR = "/nonexistent-toone-git-dir";

const SOURCES: Record<string, string> = {
  "https://trytoone.com/en": "app/[locale]/page.tsx",
  "https://trytoone.com/en/privacy": "app/[locale]/privacy/page.tsx",
  "https://trytoone.com/en/contact": "app/[locale]/contact/page.tsx",
  "https://trytoone.com/en/pricing": "app/[locale]/pricing/page.tsx",
  "https://trytoone.com/en/explore": "app/[locale]/explore/page.tsx",
  "https://trytoone.com/en/governance": "content/guides/ai-agent-governance.md",
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
  assert.ok(urls.length > 20, "sitemap lists URLs");
  assert.ok(!xml.includes("<lastmod></lastmod>") && !xml.includes("null"), "no empty or null lastmod");
  assert.deepEqual(urls.filter((m) => !m[2]).map((m) => m[1]), [], "no URL without a lastmod");
  assert.equal(warnings.find((w) => w.startsWith("[sitemap] WARNING")), undefined, "no omitted-date warning");

  const lastmod = new Map(urls.map((m) => [m[1], m[2]]));
  for (const [loc, source] of Object.entries(SOURCES)) {
    assert.equal(lastmod.get(loc), manifest[source], `${loc} is dated by ${source}`);
  }
});
