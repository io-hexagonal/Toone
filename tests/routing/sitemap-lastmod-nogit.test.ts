import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * TECH-013: a build host without git history (Vercel Git or CLI deploys) must
 * not stamp the build date on every URL. Unknown dates are omitted and the
 * build warns. GIT_DIR points git at nothing, so every git lookup fails.
 */
process.env.GIT_DIR = "/nonexistent-toone-git-dir";

test("without git, lastmod is omitted, never the build date, and the build warns", async () => {
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

  const today = new Date().toISOString().slice(0, 10);
  const urls = [...xml.matchAll(/<url>.*?<\/url>/g)].map((m) => m[0]);
  assert.ok(urls.length > 0, "sitemap lists URLs");
  assert.ok(!xml.includes("<lastmod></lastmod>") && !xml.includes("null"), "no empty or null lastmod");

  const bare = urls.filter((u) => !u.includes("<lastmod>"));
  for (const loc of [
    "https://trytoone.com/en",
    "https://trytoone.com/en/how-to",
    "https://trytoone.com/en/how-to/features/explore",
  ]) {
    assert.ok(bare.includes(`<url><loc>${loc}</loc></url>`), `${loc} has no lastmod`);
  }
  for (const u of urls) {
    if (u.includes(`<lastmod>${today}</lastmod>`)) {
      // Only a declared editorial date may equal today; git-backed routes may not.
      assert.ok(!bare.includes(u), u);
    }
  }

  const warning = warnings.find((w) => w.startsWith("[sitemap] WARNING: lastmod omitted"));
  assert.ok(warning, "build warns about omitted lastmod");
  assert.ok(warning.includes(`for ${bare.length} URL(s)`), "warning counts every bare URL");
});
