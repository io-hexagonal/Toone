import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../../next.config";
import proxy from "../../proxy";
import { ENGLISH_ONLY_PATHS } from "../../i18n/routing";
import { isAnalyticsFreePath } from "../../lib/privacy-choices";

/* /connect: one English URL that keeps the request through redirects, is never framed, stored or indexed, and runs no analytics. */

type Rule = { source: string; has?: unknown[]; headers: { key: string; value: string }[] };

/** The headers next.config.ts gives `pathname` (same rule order as Next; see tests/routing/security-headers.test.ts). */
async function headersFor(pathname: string): Promise<Record<string, string>> {
  const rules = (await nextConfig.headers!()) as Rule[];
  const out: Record<string, string> = {};
  for (const rule of rules) {
    if (rule.has) continue;
    const params = getPathMatch(rule.source)(pathname);
    if (!params) continue;
    for (const { key, value } of rule.headers) out[key.toLowerCase()] = value.replace(/:(\w+)/g, (_, name: string) => String(params[name] ?? `:${name}`));
  }
  return out;
}

const run = (path: string, headers: Record<string, string> = {}) =>
  proxy(new NextRequest(new URL(path, "https://trytoone.com"), { headers }));

test("the consent page can be framed by no one, its own site included, and sends no Referer", async () => {
  for (const path of ["/en/connect", "/connect", "/pt/connect"]) {
    const headers = await headersFor(path);
    assert.equal(headers["x-frame-options"], "DENY", path);
    assert.equal(headers["content-security-policy"], "frame-ancestors 'none'", path);
    assert.equal(headers["referrer-policy"], "no-referrer", path);
    assert.equal(headers["x-content-type-options"], "nosniff", path);
  }
  const other = await headersFor("/en/connections");
  assert.equal(other["x-frame-options"], "SAMEORIGIN", "only the consent page");
});

test("the server's default address (/connect) and every other locale reach /en/connect in one hop, request kept", () => {
  for (const [path, headers] of [
    ["/connect?request=car_abc234", {}],
    ["/connect?request=car_abc234", { "accept-language": "pt-BR,pt;q=0.9" }],
    ["/connect?request=car_abc234", { cookie: "toone_locale=de" }],
    ["/pt/connect?request=car_abc234", {}],
  ] as const) {
    const response = run(path, headers);
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("location"), "https://trytoone.com/en/connect?request=car_abc234", path);
  }
  assert.ok((ENGLISH_ONLY_PATHS as readonly string[]).includes("/connect"));
});

test("the English page is served, never stored, never indexed", () => {
  const response = run("/en/connect?request=car_abc234");
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const page = fs.readFileSync("app/[locale]/connect/page.tsx", "utf8");
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /redirectToEnglish\("\/en\/connect"/);
});

test("no analytics and no privacy panel on the consent page (its address carries the request id)", () => {
  for (const path of ["/en/connect", "/connect", "/pt/connect", "/en/connect/"]) assert.equal(isAnalyticsFreePath(path), true, path);
  for (const path of ["/en", "/en/connections", "/en/account", "/en/privacy", null]) assert.equal(isAnalyticsFreePath(path), false, String(path));
  const choices = fs.readFileSync("components/PrivacyChoices.tsx", "utf8");
  assert.match(choices, /if \(analyticsFree \|\| choice !== "allow"/, "the analytics script is never added there");
  assert.match(fs.readFileSync("components/announcements/AnnouncementModal.tsx", "utf8"), /signin\|signup\|connect/, "no announcement over it");
});
