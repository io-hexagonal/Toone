import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import proxy from "../../proxy";
import { apiOriginsFromEnv, buildCsp, createNonce, originOf } from "../../lib/csp";

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

test("every page answer carries the policy, with a new nonce per request, also handed to the renderer", () => {
  const seen = new Set<string>();
  for (const path of ["/en", "/en/journal", "/pt/explore", "/en/account", "/en/signin", "/en/explore?type=bundle", "/en/terms?version=2026-11-01"]) {
    const response = run(path);
    const csp = response.headers.get("content-security-policy");
    assert.ok(csp, path);
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, path);
    assert.ok(!seen.has(nonce), "nonce reused");
    seen.add(nonce);
    assert.match(csp, /frame-ancestors 'self'$/, path);
    // Next.js forwards modified request headers to rendering through these.
    assert.equal(response.headers.get("x-middleware-request-content-security-policy"), csp, `${path}: request CSP`);
    assert.equal(response.headers.get("x-middleware-request-x-nonce"), nonce, `${path}: x-nonce`);
  }
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
