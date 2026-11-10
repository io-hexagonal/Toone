import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { RESERVED_ROOT_EDITORIAL_SLUGS } from "../../lib/content";

const shared: string[] = JSON.parse(fs.readFileSync("lib/reserved-root-slugs.json", "utf8")).slugs;

test("lib/content.ts and the content validator reserve the same root slugs", () => {
  assert.deepEqual([...RESERVED_ROOT_EDITORIAL_SLUGS], shared);
  const validator = fs.readFileSync("scripts/content/validate-publications.mjs", "utf8");
  assert.match(validator, /lib\/reserved-root-slugs\.json/, "the validator reads the shared list");
  assert.doesNotMatch(validator, /new Set\(\[\s*"/, "the validator keeps no list of its own");
  assert.equal(new Set(shared).size, shared.length, "no duplicates");
  assert.deepEqual(shared, [...shared].sort(), "kept sorted");
});

test("every static app/[locale] route is reserved", () => {
  for (const entry of fs.readdirSync("app/[locale]", { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("[")) continue;
    assert.ok(shared.includes(entry.name), `/${entry.name} is a route but not a reserved slug`);
  }
});

test("routes planned for Toone Pro billing and legal pages are reserved ahead of time", () => {
  for (const slug of ["pricing", "success", "cancel", "account", "redeem", "cancel-contract", "legal-notice", "admin"]) {
    assert.ok(shared.includes(slug), slug);
  }
});

test("no editorial publication claims a reserved root slug", () => {
  const manifest = JSON.parse(fs.readFileSync("content/publication-manifest.json", "utf8"));
  for (const item of manifest.items) assert.ok(!shared.includes(item.slug), item.slug);
});
