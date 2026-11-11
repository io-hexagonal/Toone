import { renderText } from "./render";
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import {
  CURRENT_TERMS_VERSION,
  TERMS_VERSIONS,
  TERMS_VERSION_PARAM,
  formatTermsDate,
  isTermsDate,
  resolveTermsVersion,
  termsVersionAt,
  termsVersionPath,
  type TermsVersion,
} from "../../lib/legal/terms-versions";
import { TERMS_CANONICAL, TERMS_UPDATED_DATE } from "../../lib/legal/terms";
import TermsContent from "../../app/[locale]/terms/TermsContent";
import { TERMS_VERSION_CONTENT, termsContentFor } from "../../app/[locale]/terms/versions";
import { TermsVersionNote, termsMetadata } from "../../app/[locale]/terms/TermsDocument";

/* Purchase confirmations link /en/terms?version=<date>: every version a buyer could accept stays readable. */

const read = (path: string) => fs.readFileSync(path, "utf8");
const TODAY = "2027-06-01";
/** A history with a replaced version, to exercise the lookup. */
const HISTORY: readonly TermsVersion[] = [
  { date: "2026-11-11", label: "November 11, 2026" },
  { date: "2027-02-01", label: "February 1, 2027" },
];

test("the version list: oldest first, real dates, labels as the page writes them, the current one last", () => {
  assert.ok(TERMS_VERSIONS.length >= 1);
  assert.equal(TERMS_VERSIONS[0].date, "2026-11-11", "the version in force when web sales open");
  const dates = TERMS_VERSIONS.map((version) => version.date);
  assert.deepEqual(dates, [...dates].sort(), "oldest first");
  assert.equal(new Set(dates).size, dates.length, "no duplicates");
  for (const version of TERMS_VERSIONS) {
    assert.ok(isTermsDate(version.date), version.date);
    assert.equal(version.label, formatTermsDate(version.date), version.date);
  }
  assert.equal(CURRENT_TERMS_VERSION, TERMS_VERSIONS[TERMS_VERSIONS.length - 1]);
  assert.equal(TERMS_UPDATED_DATE, CURRENT_TERMS_VERSION.label, "the page's date is the current version's");
  assert.ok(Object.isFrozen(TERMS_VERSIONS));
});

test("every version has its own text; the current one is TermsContent", () => {
  assert.deepEqual(Object.keys(TERMS_VERSION_CONTENT).sort(), TERMS_VERSIONS.map((version) => version.date).sort());
  assert.equal(TERMS_VERSION_CONTENT[CURRENT_TERMS_VERSION.date], TermsContent);
  for (const version of TERMS_VERSIONS) assert.equal(termsContentFor(version), TERMS_VERSION_CONTENT[version.date]);
});

test("a requested date shows the version in force that day", () => {
  assert.deepEqual(resolveTermsVersion(undefined, HISTORY, TODAY), { kind: "current", version: HISTORY[1] });
  assert.deepEqual(resolveTermsVersion("2026-11-11", HISTORY, TODAY), {
    kind: "requested", version: HISTORY[0], requested: "2026-11-11", isCurrent: false,
  });
  assert.deepEqual(resolveTermsVersion("2027-01-31", HISTORY, TODAY), {
    kind: "requested", version: HISTORY[0], requested: "2027-01-31", isCurrent: false,
  }, "the day before the next version");
  assert.deepEqual(resolveTermsVersion("2027-02-01", HISTORY, TODAY), {
    kind: "requested", version: HISTORY[1], requested: "2027-02-01", isCurrent: true,
  });
  assert.deepEqual(resolveTermsVersion(" 2027-03-15 ", HISTORY, TODAY), {
    kind: "requested", version: HISTORY[1], requested: "2027-03-15", isCurrent: true,
  });
  assert.deepEqual(resolveTermsVersion(["2026-12-01", "2027-03-01"], HISTORY, TODAY), {
    kind: "requested", version: HISTORY[0], requested: "2026-12-01", isCurrent: false,
  }, "a repeated parameter: the first counts");
});

test("an unknown date shows the current version, with a note", () => {
  for (const value of ["", "2026-11-10", "2020-01-01", "2027-02-30", "2027-13-01", "11/11/2026", "latest", "2026-11-11T00:00:00Z", "2027-06-02"]) {
    assert.deepEqual(resolveTermsVersion(value, HISTORY, TODAY), { kind: "unknown", version: HISTORY[1] }, JSON.stringify(value));
  }
  assert.equal(termsVersionAt("2026-11-10", HISTORY, TODAY), null, "before the first version");
  assert.equal(termsVersionAt("2027-06-02", HISTORY, TODAY), null, "a day that has not come yet");
  assert.deepEqual(resolveTermsVersion("2026-11-11"), {
    kind: "requested", version: CURRENT_TERMS_VERSION, requested: "2026-11-11", isCurrent: CURRENT_TERMS_VERSION.date === "2026-11-11",
  }, "the published list serves the first version's link");
});

test("the note says which version this is, and links to the current Terms when it was replaced", () => {
  assert.equal(renderText(createElement(TermsVersionNote, { view: { kind: "current", version: HISTORY[1] } })), "");
  const replaced = renderText(createElement(TermsVersionNote, { view: resolveTermsVersion("2027-01-10", HISTORY, TODAY) }));
  assert.match(replaced, /in force on January 10, 2027\. It took effect on November 11, 2026 and has since been replaced: see the current Terms/);
  const current = renderText(createElement(TermsVersionNote, { view: resolveTermsVersion("2027-02-01", HISTORY, TODAY) }));
  assert.match(current, /in force on February 1, 2027\. It is still the current version/);
  const unknown = renderText(createElement(TermsVersionNote, { view: resolveTermsVersion("<script>", HISTORY, TODAY) }));
  assert.match(unknown, /There is no version of these Terms for the date in this link, so this is the current version, in force since February 1, 2027/);
  assert.doesNotMatch(unknown, /script/, "the query is never echoed");
});

test("versioned views keep the canonical /en/terms and are never indexed", () => {
  const plain = termsMetadata("en");
  const versioned = termsMetadata("en", true);
  for (const meta of [plain, versioned]) {
    assert.deepEqual(meta.alternates, { canonical: TERMS_CANONICAL });
    assert.equal(meta.openGraph?.url, TERMS_CANONICAL);
  }
  assert.deepEqual(plain.robots, { index: true, follow: true });
  assert.deepEqual(versioned.robots, { index: false, follow: true });

  const page = read("app/[locale]/terms/page.tsx");
  assert.match(page, /return termsMetadata\(locale\);/);
  assert.doesNotMatch(page, /await searchParams/, "the current Terms stay static");
  const view = read("app/[locale]/terms/versioned/page.tsx");
  assert.match(view, /return termsMetadata\(locale, true\);/);
  assert.match(view, /resolveTermsVersion\(\(await searchParams\)\[TERMS_VERSION_PARAM\]\)/);
});

test("purchase confirmations' link format", () => {
  assert.equal(TERMS_VERSION_PARAM, "version");
  assert.equal(termsVersionPath(CURRENT_TERMS_VERSION), `/en/terms?version=${CURRENT_TERMS_VERSION.date}`);
  assert.equal(termsVersionPath("2026-11-11"), "/en/terms?version=2026-11-11");
});
