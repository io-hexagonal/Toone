import assert from "node:assert/strict";
import test from "node:test";
import { LEGAL_TRADER, TRADER_DETAILS_COMPLETE, unresolvedTraderFields } from "../../lib/legal/trader";

/**
 * RELEASE GATE. Expected to fail until the owner fills in lib/legal/trader.ts,
 * so it only runs for a release: with LEGAL_RELEASE_CHECK=1, or in a Vercel
 * production environment (VERCEL_ENV=production).
 *
 *   LEGAL_RELEASE_CHECK=1 npm run test:legal
 *
 * Run it, and see it pass, before Toone Pro goes on sale on trytoone.com.
 */
export function releaseCheckEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.LEGAL_RELEASE_CHECK === "1" || env.VERCEL_ENV === "production";
}

test(
  "RELEASE GATE (LEGAL_RELEASE_CHECK=1 or VERCEL_ENV=production): legal notice owner data has no TODO_OWNER placeholders",
  { skip: releaseCheckEnabled() ? false : "set LEGAL_RELEASE_CHECK=1 before releasing Toone Pro on the web" },
  () => {
    const missing = unresolvedTraderFields();
    assert.deepEqual(
      missing,
      [],
      `Fill in lib/legal/trader.ts: ${missing.map((key) => LEGAL_TRADER[key].label).join(", ")}`,
    );
    assert.equal(TRADER_DETAILS_COMPLETE, true);
  },
);

test("the release gate runs for LEGAL_RELEASE_CHECK=1 and for Vercel production only", () => {
  assert.equal(releaseCheckEnabled({ LEGAL_RELEASE_CHECK: "1" }), true);
  assert.equal(releaseCheckEnabled({ VERCEL_ENV: "production" }), true);
  assert.equal(releaseCheckEnabled({ VERCEL_ENV: "preview" }), false);
  assert.equal(releaseCheckEnabled({ LEGAL_RELEASE_CHECK: "0" }), false);
  assert.equal(releaseCheckEnabled({}), false);
});

test("TRADER_DETAILS_COMPLETE is computed from the owner data", () => {
  assert.equal(TRADER_DETAILS_COMPLETE, unresolvedTraderFields().length === 0);
});
