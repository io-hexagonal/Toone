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

/** Private server internals the public site code must not name: contract doc files, server source paths and helpers, private scripts. */
const SERVER_INTERNALS = /\bbilling\.md\b|\binvitations\.md\b|scripts\/e2e\b|apps\/toone-|internal\/(?:domain|handlers|adapters|services|ports)\b|\.go\b|\bParseOrderRef\b|STRIPE_(?:SECRET|WEBHOOK|AUTOMATIC|BLOCKED|PORTAL|PRO|MANAGED)_[A-Z_]+|TOONE_PAYMENTS_ENABLED/;
const CODE_ROOTS = ["app", "components", "lib", "scripts", "messages", "i18n", "tests"];
const SELF = path.join("tests", "legal", "public-docs.test.ts");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(?:[cm]?[jt]sx?|json|css|md)$/.test(entry.name) ? [file] : [];
  });
}

test("public site code and comments name no private server internals", () => {
  const files = [...CODE_ROOTS.flatMap(sourceFiles), "proxy.ts", "next.config.ts"].filter((file) => file !== SELF);
  assert.ok(files.length > 100);
  for (const file of files) {
    const match = fs.readFileSync(file, "utf8").match(SERVER_INTERNALS);
    assert.equal(match, null, `${file} mentions ${match?.[0]}`);
  }
});
