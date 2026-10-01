import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import proxy from "../../proxy";

function run(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(new URL(path, "https://trytoone.com"), { headers }));
}

test("unprefixed How-to paths are one 308 to English, whatever the language", () => {
  for (const [path, location] of [
    ["/how-to", "https://trytoone.com/en/how-to"],
    ["/how-to/features/routines", "https://trytoone.com/en/how-to/features/routines"],
    ["/how-to/getting-started?ref=x", "https://trytoone.com/en/how-to/getting-started?ref=x"],
  ]) {
    for (const language of ["", "pt-BR"]) {
      const response = run(path, language ? { "accept-language": language } : {});
      assert.equal(response.status, 308, `${path} (${language || "none"})`);
      assert.equal(response.headers.get("location"), location);
    }
  }
});

test("unprefixed AI digest paths are served by the 410 route, not redirected", () => {
  for (const [path, rewrite] of [
    ["/ai-digest", "https://trytoone.com/en/ai-digest"],
    ["/ai-digest/some-post", "https://trytoone.com/en/ai-digest/some-post"],
  ]) {
    const response = run(path);
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(response.headers.get("x-middleware-rewrite"), rewrite, path);
  }
});

test("paths that only start like How-to or AI digest are left to next-intl", () => {
  for (const path of ["/how-tos", "/ai-digests"]) {
    const response = run(path);
    assert.notEqual(response.status, 308, path);
    assert.equal(response.headers.get("x-middleware-rewrite"), null, path);
  }
});
