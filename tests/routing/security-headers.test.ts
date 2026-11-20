import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import nextConfig from "../../next.config";
import { config as proxyConfig } from "../../proxy";

/* Baseline security headers (next.config.ts) and /.well-known/security.txt. */

type Rule = { source: string; headers: { key: string; value: string }[] };

/**
 * The headers next.config.ts gives `pathname`, applied the way Next does: every
 * matching rule in order, a later rule overriding an earlier one for the same
 * key (docs: next-config-js/headers, "Header Overriding Behavior").
 */
async function headersFor(pathname: string): Promise<Record<string, string>> {
  const rules = (await nextConfig.headers!()) as Rule[];
  const out: Record<string, string> = {};
  for (const rule of rules) {
    const params = getPathMatch(rule.source)(pathname);
    if (!params) continue;
    for (const { key, value } of rule.headers) {
      out[key.toLowerCase()] = value.replace(/:(\w+)/g, (_, name: string) => String(params[name] ?? `:${name}`));
    }
  }
  return out;
}

const PATHS = ["/", "/en", "/en/pricing", "/pt/explore/some-workflow", "/api/contact", "/journal/feed.xml", "/.well-known/security.txt"];

test("every route forbids cross-site framing and MIME sniffing, with a referrer default", async () => {
  for (const path of PATHS) {
    const headers = await headersFor(path);
    assert.equal(headers["x-frame-options"], "SAMEORIGIN", path);
    assert.equal(headers["content-security-policy"], "frame-ancestors 'self'", `${path}: frame-ancestors only`);
    assert.equal(headers["x-content-type-options"], "nosniff", path);
    assert.equal(headers["referrer-policy"], "strict-origin-when-cross-origin", path);
  }
});

test("the per-route no-referrer rules still win over the referrer default", async () => {
  for (const path of ["/en/success", "/pt/account", "/en/redeem/x", "/de/cancel-contract", "/en/unsubscribe", "/en/admin/codes", "/success", "/cancel"]) {
    const headers = await headersFor(path);
    assert.equal(headers["referrer-policy"], "no-referrer", path);
    assert.equal(headers["x-frame-options"], "SAMEORIGIN", `${path} keeps the baseline`);
  }
  // Existing per-route headers are untouched.
  assert.equal((await headersFor("/pt/pricing"))["content-language"], "pt");
  assert.equal((await headersFor("/pt/pricing"))["x-robots-tag"], "noindex, follow");
  assert.equal((await headersFor("/en/pricing"))["x-robots-tag"], undefined);
});

test("security.txt is served as a static file: RFC 9116 fields, not expired, never sent through the locale proxy", () => {
  const body = fs.readFileSync("public/.well-known/security.txt", "utf8");
  assert.match(body, /^Contact: mailto:hello@trytoone\.com$/m);
  assert.match(body, /^Preferred-Languages: en, pt$/m);
  assert.match(body, /^Canonical: https:\/\/trytoone\.com\/\.well-known\/security\.txt$/m);
  const expires = body.match(/^Expires: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)$/m);
  assert.ok(expires, "Expires is ISO 8601 UTC");
  const left = Date.parse(expires[1]) - Date.now();
  assert.ok(left > 0, "security.txt has expired: move Expires forward (at most a year)");
  assert.ok(left <= 366 * 24 * 60 * 60 * 1000, "RFC 9116 recommends Expires less than a year ahead");
  assert.doesNotMatch(body, /^Policy:/m, "no policy page exists yet");

  assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: "/.well-known/security.txt" }), false);
  assert.equal(unstable_doesMiddlewareMatch({ config: proxyConfig, url: "/pricing" }), true, "the matcher check itself works");
});
