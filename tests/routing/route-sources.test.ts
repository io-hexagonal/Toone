import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { ROUTE_SOURCE_FILES, ROUTE_SOURCES } from "../../lib/route-sources";
import { DATED_SOURCE_ROOTS, isDatedSource } from "../../lib/source-date";

/**
 * TECH-013: a static sitemap route is dated by the latest of its sources, its
 * page.tsx and the components that render its main content. Every declared
 * source must exist and carry a manifest date, or the route's lastmod could
 * silently fall back to an older file.
 */

const manifest = JSON.parse(fs.readFileSync("lib/content-dates.json", "utf8")) as Record<string, string>;

test("every static sitemap route names at least one source", () => {
  for (const [route, sources] of Object.entries(ROUTE_SOURCES)) {
    assert.ok(sources.length > 0, `${route || "/"} resolves to no source`);
    assert.equal(new Set(sources).size, sources.length, `${route || "/"} lists a source twice`);
  }
});

test("every declared source exists, is a dated source and has a manifest date", () => {
  for (const [route, sources] of Object.entries(ROUTE_SOURCES)) {
    for (const file of sources) {
      assert.ok(fs.existsSync(file), `${route || "/"}: ${file} exists`);
      assert.ok(isDatedSource(file), `${route || "/"}: ${file} is a dated source`);
      assert.match(manifest[file] ?? "", /^\d{4}-\d{2}-\d{2}$/, `${route || "/"}: ${file} is in lib/content-dates.json`);
    }
  }
});

test("every declared source sits under a pathspec the manifest generator reads", () => {
  for (const file of ROUTE_SOURCE_FILES) {
    assert.ok(
      DATED_SOURCE_ROOTS.some((root) => file === root || file.startsWith(`${root}/`)),
      `${file} is under ${DATED_SOURCE_ROOTS.join(", ")}`,
    );
  }
  for (const root of DATED_SOURCE_ROOTS) assert.ok(!root.includes("["), `${root}: no glob characters`);
});

test("pages built from components are dated by them, and site chrome is not a source", () => {
  assert.ok(ROUTE_SOURCES[""].includes("components/HeroLanding.tsx"));
  assert.ok(ROUTE_SOURCES[""].includes("components/FaqSection.tsx"));
  assert.ok(ROUTE_SOURCES["/business"].includes("app/[locale]/page.tsx"));
  assert.ok(ROUTE_SOURCES["/pricing"].includes("components/billing/PricingPlans.tsx"));
  const chrome = /\/(SiteHeader|Navigation|Footer|LocalePicker|LocaleSuggestion|PrivacyChoices|CookieBanner)\.tsx$/;
  for (const file of ROUTE_SOURCE_FILES) {
    assert.doesNotMatch(file, chrome, `${file} is site chrome`);
    assert.ok(!file.startsWith("messages/"), `${file}: shared copy files would date every page`);
  }
});
