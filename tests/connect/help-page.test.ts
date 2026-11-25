import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { NextRequest } from "next/server";
import proxy from "../../proxy";
import { ENGLISH_ONLY_PATHS } from "../../i18n/routing";
import { GET as siteSitemap } from "../../app/sitemap.xml/route";

/* /claude: the public help page for the Toone connector in Claude (the Connectors Directory links it). */

const PAGE = "app/[locale]/claude/page.tsx";
const run = (path: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(new URL(path, "https://trytoone.com"), { headers }));

test("every other address of the help page reaches /en/claude in one hop, query kept", () => {
  assert.ok((ENGLISH_ONLY_PATHS as readonly string[]).includes("/claude"));
  for (const [path, headers] of [
    ["/claude", {}],
    ["/claude", { "accept-language": "pt-BR,pt;q=0.9" }],
    ["/claude", { cookie: "toone_locale=de" }],
    ["/fr/claude", {}],
  ] as const) {
    const response = run(`${path}?utm_source=x`, headers);
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("location"), "https://trytoone.com/en/claude?utm_source=x", path);
  }
  assert.equal(run("/en/claude").headers.get("location"), null, "the English page is served");
  assert.match(fs.readFileSync(PAGE, "utf8"), /redirectToEnglish\("\/en\/claude"/);
});

test("the help page is in the sitemap and indexable", async () => {
  const xml = await (await siteSitemap()).text();
  assert.match(xml, /<loc>https:\/\/trytoone\.com\/en\/claude<\/loc>/);
  const page = fs.readFileSync(PAGE, "utf8");
  assert.match(page, /robots: localeRobots\(locale\)/);
  assert.match(page, /canonical: CANONICAL/);
});

test("the help page names no internals and links a privacy section that exists", () => {
  const page = fs.readFileSync(PAGE, "utf8");
  assert.doesNotMatch(page, /—/, "no em dashes");
  assert.equal(page.match(/Toone for Mac 1\.9 or later/g)?.length, 2, "the requirement and the update answer name the same release");
  assert.doesNotMatch(page, /\b(?:desktop|toone|org|app|agent|ledger)_[a-z_]+\b/i, "no tool names");
  assert.doesNotMatch(page, /\bledger|\brelay\b|\bprompt\b/i, "no engine terms");
  const addresses = [...page.matchAll(/https:\/\/api\.trytoone\.com[^"\s]*/g)].map((match) => match[0]);
  assert.deepEqual([...new Set(addresses)], ["https://api.trytoone.com/mcp"], "only the public connector address");
  const anchor = page.match(/href="\/en\/privacy#([a-z-]+)"/)?.[1];
  assert.ok(anchor, "links the privacy policy");
  assert.match(fs.readFileSync("app/[locale]/privacy/PrivacyContent.tsx", "utf8"), new RegExp(`id="${anchor}"`));
});
