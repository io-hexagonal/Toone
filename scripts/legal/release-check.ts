/** Prebuild release gate; the rules are in ./release-gate.ts. */
import { LEGAL_TRADER, unresolvedTraderFields } from "../../lib/legal/trader";
import { releaseCheck } from "./release-gate";

async function main() {
  const missing = unresolvedTraderFields().map((key) => LEGAL_TRADER[key].label);
  const result = await releaseCheck(process.env, missing);
  if (result.message) (result.ok ? console.warn : console.error)(result.message);
  if (!result.ok) process.exit(1);
}

void main();
