import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

/** This repository is public: legal notes must not point into the private app sources. */
const MONOREPO_PATH = /apps\/toone-(?:server|desktop|mobile)|packages\/mcp-server|internal\/(?:domain|handlers|adapters)|\.go\b|\.swift\b|toone-payments-plan|store-build-\d+/;

test("docs/legal and the legal pages cite no monorepo source paths", () => {
  const files = [
    ...fs.readdirSync("docs/legal").map((name) => path.join("docs/legal", name)),
    "app/[locale]/terms/page.tsx",
    "app/[locale]/privacy/page.tsx",
    "app/[locale]/legal-notice/page.tsx",
    "lib/legal/terms.ts",
    "lib/legal/trader.ts",
  ];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const match = source.match(MONOREPO_PATH);
    assert.equal(match, null, `${file} mentions ${match?.[0]}`);
  }
});

test("legal pages carry no draft markers", () => {
  for (const file of ["app/[locale]/terms/page.tsx", "app/[locale]/privacy/page.tsx", "app/[locale]/legal-notice/page.tsx"]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /\bDRAFT\b|\bVERIFY\b|lorem ipsum/i, file);
  }
});
