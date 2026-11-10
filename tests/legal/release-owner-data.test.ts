import assert from "node:assert/strict";
import test from "node:test";
import { LEGAL_TRADER, unresolvedTraderFields } from "../../lib/legal/trader";

/**
 * RELEASE GATE. Expected to fail until the owner fills in lib/legal/trader.ts,
 * so it only runs with LEGAL_RELEASE_CHECK=1:
 *
 *   LEGAL_RELEASE_CHECK=1 npm run test:legal
 *
 * Run it, and see it pass, before Toone Pro goes on sale on trytoone.com.
 */
const enabled = process.env.LEGAL_RELEASE_CHECK === "1";

test(
  "RELEASE GATE (LEGAL_RELEASE_CHECK=1): legal notice owner data has no TODO_OWNER placeholders",
  { skip: enabled ? false : "set LEGAL_RELEASE_CHECK=1 before releasing Toone Pro on the web" },
  () => {
    const missing = unresolvedTraderFields();
    assert.deepEqual(
      missing,
      [],
      `Fill in lib/legal/trader.ts: ${missing.map((key) => LEGAL_TRADER[key].label).join(", ")}`,
    );
  },
);
