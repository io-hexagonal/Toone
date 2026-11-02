import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { VERCEL_APP_HOST_PATTERN } from "../../lib/vercel-host";

/** Next.js anchors `has` host values; mirror that here. */
const host = new RegExp(`^${VERCEL_APP_HOST_PATTERN}$`);

test("the noindex host pattern matches every toone-landing vercel.app host", () => {
  for (const name of [
    "toone-landing.vercel.app",
    "toone-landing-3yw40y3ds-barakoles-projects.vercel.app",
    "toone-landing-git-main-barakoles-projects.vercel.app",
    "toone-landing-barakoles-projects.vercel.app",
  ]) {
    assert.ok(host.test(name), name);
  }
});

test("the noindex host pattern never matches trytoone.com or other hosts", () => {
  for (const name of [
    "trytoone.com",
    "www.trytoone.com",
    "localhost:3000",
    "toone-landing.vercel.app.evil.com",
    "other-project.vercel.app",
    "xtoone-landing.vercel.app",
  ]) {
    assert.ok(!host.test(name), name);
  }
});

test("next.config.ts sends X-Robots-Tag: noindex on that host for every path", () => {
  const config = fs.readFileSync("next.config.ts", "utf8");
  assert.match(
    config,
    /source: "\/:path\*",\s*has: \[\{ type: "host", value: VERCEL_APP_HOST_PATTERN \}\],\s*headers: \[\{ key: "X-Robots-Tag", value: "noindex" \}\]/,
  );
});
