import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

/** This repository is public: legal notes must not point into the private app sources. */
const MONOREPO_PATH = /apps\/toone-(?:server|desktop|mobile)|packages\/mcp-server|internal\/(?:domain|handlers|adapters)|\.go\b|\.swift\b|toone-payments-plan|store-build-\d+/;

const LEGAL_PAGES = [
  "app/[locale]/terms/page.tsx",
  "app/[locale]/terms/TermsContent.tsx",
  "app/[locale]/privacy/page.tsx",
  "app/[locale]/privacy/PrivacyContent.tsx",
  "app/[locale]/legal-notice/page.tsx",
  "app/[locale]/legal-notice/WebSales.tsx",
];
const LEGAL_SOURCES = [...LEGAL_PAGES, ...fs.readdirSync("lib/legal").map((name) => path.join("lib/legal", name))];

test("docs/legal and the legal pages cite no monorepo source paths", () => {
  const files = [
    ...fs.readdirSync("docs/legal").map((name) => path.join("docs/legal", name)),
    ...LEGAL_SOURCES,
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const match = source.match(MONOREPO_PATH);
    assert.equal(match, null, `${file} mentions ${match?.[0]}`);
  }
});

test("legal pages carry no draft markers", () => {
  for (const file of LEGAL_PAGES) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /\bDRAFT\b|\bVERIFY\b|lorem ipsum/i, file);
  }
});

test("docs/legal names no branches, commits or unreleased work", () => {
  const INTERNALS = /\bbranch(?:es)?\b|\bunpushed\b|\bunmerged\b|\bpro-terms-|apple-sign-in-release|site\/pro-|\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/i;
  for (const name of fs.readdirSync("docs/legal")) {
    const file = path.join("docs/legal", name);
    const match = fs.readFileSync(file, "utf8").match(INTERNALS);
    assert.equal(match, null, `${file} mentions ${match?.[0]}`);
  }
});
