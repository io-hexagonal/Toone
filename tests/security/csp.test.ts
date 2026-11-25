import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import proxy from "../../proxy";
import fs from "node:fs";
import { apiOriginsFromEnv, buildCsp, buildStaticCsp, createNonce, isStrictPath, originOf, STATIC_SECTIONS, STRICT_SECTIONS } from "../../lib/csp";

/* Content-Security-Policy with a per-request script nonce (lib/csp.ts, proxy.ts). */

function directives(csp: string): Map<string, string[]> {
  return new Map(csp.split(";").map((part) => part.trim().split(/\s+/)).map(([name, ...values]) => [name, values]));
}

const run = (path: string) => proxy(new NextRequest(new URL(path, "https://trytoone.com")));

test("scripts: self, this request's nonce and the three third-party scripts; never unsafe-inline or unsafe-eval", () => {
  const nonce = createNonce();
  const csp = directives(buildCsp({ nonce, frameAncestors: "'self'" }));
  assert.deepEqual(csp.get("script-src"), [
    "'self'",
    `'nonce-${nonce}'`,
    "https://accounts.google.com/gsi/client",
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/",
    "https://analytics.truleaf.org/script.js",
  ]);
  for (const [name, values] of csp) {
    if (name === "style-src") continue;
    assert.ok(!values.includes("'unsafe-inline'"), `${name} has no unsafe-inline`);
    assert.ok(!values.includes("'unsafe-eval'"), `${name} has no unsafe-eval`);
    assert.ok(!values.includes("*") && !values.includes("https:"), `${name} has no wildcard`);
  }
  assert.deepEqual(csp.get("object-src"), ["'none'"]);
  assert.deepEqual(csp.get("base-uri"), ["'none'"]);
  assert.deepEqual(csp.get("form-action"), ["'self'"]);
  assert.deepEqual(csp.get("default-src"), ["'self'"]);
  assert.deepEqual(csp.get("connect-src"), ["'self'", "https://api.trytoone.com", "https://accounts.google.com/gsi/", "https://analytics.truleaf.org"]);
  assert.deepEqual(csp.get("frame-src"), ["https://accounts.google.com/gsi/"]);
  for (const host of ["https://api.producthunt.com", "https://macigniter.com", "https://dodolaunch.com", "https://macbase.app", "https://statics.startupbase.io", "https://startupfa.me", "https://appleid.cdn-apple.com", "https://api.trytoone.com"]) {
    assert.ok(csp.get("img-src")!.includes(host), `img-src allows ${host}`);
  }
});

test("development adds unsafe-eval (React dev tooling); previews add Vercel's toolbar; production adds neither", () => {
  const nonce = createNonce();
  assert.ok(directives(buildCsp({ nonce, frameAncestors: "'self'", development: true })).get("script-src")!.includes("'unsafe-eval'"));
  assert.ok(directives(buildCsp({ nonce, frameAncestors: "'self'", preview: true })).get("script-src")!.includes("https://vercel.live"));
  const production = buildCsp({ nonce, frameAncestors: "'self'" });
  assert.doesNotMatch(production, /vercel\.live|unsafe-eval/);
});

test("a nonce is fresh, 128 bits, and an unusable one is refused", () => {
  const a = createNonce();
  assert.notEqual(a, createNonce());
  assert.equal(Buffer.from(a, "base64").length, 16);
  assert.throws(() => buildCsp({ nonce: "x' 'unsafe-inline", frameAncestors: "'self'" }));
});

test("API origins come from the configured bases, default api.trytoone.com", () => {
  assert.deepEqual(apiOriginsFromEnv({}), ["https://api.trytoone.com"]);
  assert.deepEqual(
    apiOriginsFromEnv({ NEXT_PUBLIC_API_BASE_URL: "http://localhost:8080/v1", EXPLORE_API_BASE_URL: "https://api.truleaf.org/api/v1/toone" }),
    ["http://localhost:8080", "https://api.truleaf.org"],
  );
  assert.equal(originOf("javascript:alert(1)"), null);
  assert.equal(originOf("not a url"), null);
});

test("strict sections get a new nonce per request, also handed to the renderer", () => {
  const seen = new Set<string>();
  for (const path of ["/en/journal", "/en/journal/some-post", "/pt/explore", "/en/explore?type=bundle", "/en/account", "/en/signin", "/en/signup", "/en/reset-password", "/en/pricing", "/en/success", "/en/admin/codes", "/en/r/someone", "/en/how-to"]) {
    const response = run(path);
    const csp = response.headers.get("content-security-policy");
    assert.ok(csp, path);
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, `${path}: strict policy`);
    assert.doesNotMatch(csp, /unsafe-inline'[^;]*;\s*style-src/, `${path}: no unsafe-inline for scripts`);
    assert.ok(!seen.has(nonce), "nonce reused");
    seen.add(nonce);
    assert.match(csp, /frame-ancestors 'self'$/, path);
    // Next.js forwards modified request headers to rendering through these.
    assert.equal(response.headers.get("x-middleware-request-content-security-policy"), csp, `${path}: request CSP`);
    assert.equal(response.headers.get("x-middleware-request-x-nonce"), nonce, `${path}: x-nonce`);
  }
});

test("static pages get the static policy: no nonce, inline scripts, same hosts and the same lockdown directives", () => {
  for (const path of ["/en", "/pt", "/en/about", "/en/privacy", "/en/terms", "/en/terms?version=2026-11-01", "/en/claude", "/en/governance", "/en/ai-agent-routines", "/en/no-such-page"]) {
    const response = run(path);
    const csp = response.headers.get("content-security-policy")!;
    assert.doesNotMatch(csp, /nonce-/, path);
    const policy = directives(csp);
    assert.deepEqual(policy.get("script-src"), ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/client",
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/", "https://analytics.truleaf.org/script.js"], path);
    assert.deepEqual(policy.get("object-src"), ["'none'"]);
    assert.deepEqual(policy.get("base-uri"), ["'none'"]);
    assert.deepEqual(policy.get("form-action"), ["'self'"]);
    assert.deepEqual(policy.get("frame-ancestors"), ["'self'"]);
    assert.equal(response.headers.get("x-middleware-request-content-security-policy"), null, `${path}: nothing forwarded`);
  }
  // Apart from script-src, the two policies are the same.
  const strict = directives(buildCsp({ nonce: createNonce(), frameAncestors: "'self'" }));
  const loose = directives(buildStaticCsp({ frameAncestors: "'self'" }));
  for (const [name, values] of strict) if (name !== "script-src") assert.deepEqual(loose.get(name), values, name);
});

test("every app/[locale] section is classified, and every strict section renders per request", () => {
  const strict: readonly string[] = STRICT_SECTIONS;
  const statics: readonly string[] = STATIC_SECTIONS;
  for (const entry of fs.readdirSync("app/[locale]", { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("[")) continue;
    assert.ok(strict.includes(entry.name) !== statics.includes(entry.name), `/${entry.name} must be in exactly one of STRICT_SECTIONS or STATIC_SECTIONS`);
  }
  for (const section of strict) {
    const dir = `app/[locale]/${section}`;
    if (!fs.existsSync(dir)) continue;
    const layout = fs.readFileSync(`${dir}/layout.tsx`, "utf8");
    assert.match(layout, /StrictCspLayout/, `${section}: its layout renders per request`);
  }
  assert.match(fs.readFileSync("components/StrictCspLayout.tsx", "utf8"), /await connection\(\)/);
  assert.doesNotMatch(fs.readFileSync("app/[locale]/layout.tsx", "utf8"), /connection\(\)/, "the root layout leaves static pages static");
  assert.equal(isStrictPath("/en/accounting"), false, "whole segments only");
  assert.equal(isStrictPath("/journal/feed.xml"), true);
});

test("the consent page may not be framed at all, under any prefix", () => {
  for (const path of ["/en/connect", "/en/connect?request=car_abc234"]) {
    assert.match(run(path).headers.get("content-security-policy")!, /frame-ancestors 'none'$/, path);
  }
  for (const path of ["/connect", "/pt/connect"]) {
    // Redirects to /en/connect; the policy still refuses framing.
    assert.match(run(path).headers.get("content-security-policy")!, /frame-ancestors 'none'$/, path);
  }
  assert.match(run("/en/connections").headers.get("content-security-policy")!, /frame-ancestors 'self'$/);
});

test("from a static page, a link into a strict section loads a new document; everything else navigates in place", async () => {
  const { needsFullLoad } = await import("../../lib/section-link");
  const origin = "https://trytoone.com";
  assert.equal(needsFullLoad("/en/signin", origin, false), true);
  assert.equal(needsFullLoad("https://trytoone.com/en/journal/x", origin, false), true);
  assert.equal(needsFullLoad("/en/signin", origin, true), false, "already under the strict policy");
  assert.equal(needsFullLoad("/en/about", origin, false), false, "static to static");
  assert.equal(needsFullLoad("https://claude.ai/en/signin", origin, false), false, "other sites are not ours");
  const nav = fs.readFileSync("lib/navigation.ts", "utf8");
  assert.match(nav, /createElement\(SectionLink/, "the site's Link applies the rule");
});
