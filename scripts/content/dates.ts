/** CLI for lib/content-dates.json; the rules are in ./dates-core.ts. */
import fs from "node:fs";
import { expectedDates, historyKind, MANIFEST_PATH, manifestDiff } from "./dates-core";

function main() {
  const check = process.argv.includes("--check");
  const kind = historyKind();
  if (kind !== "full") {
    const why = kind === "shallow" ? "this is a shallow clone" : "there is no git repository";
    if (check) {
      console.warn(`[content-dates] check skipped: ${why}, so git dates would be wrong.`);
      return;
    }
    console.error(`[content-dates] refusing to write: ${why}. Run \`git fetch --unshallow\` first.`);
    process.exit(1);
  }
  const expected = expectedDates();
  if (!check) {
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(expected, null, 2)}\n`);
    console.log(`[content-dates] wrote ${Object.keys(expected).length} dates to ${MANIFEST_PATH}`);
    return;
  }
  const actual = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as Record<string, string>;
  const diff = manifestDiff(actual, expected);
  if (diff.length) {
    console.error(
      `[content-dates] ${MANIFEST_PATH} is stale for ${diff.length} file(s). ` +
        "Run `npm run content:dates` and commit the result:\n" +
        diff.join("\n"),
    );
    process.exit(1);
  }
  console.log(`[content-dates] ${MANIFEST_PATH} matches git for ${Object.keys(expected).length} files.`);
}

main();
