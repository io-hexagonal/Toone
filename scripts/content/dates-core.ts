/**
 * lib/content-dates.json: the content dates behind sitemap `lastmod` and
 * JSON-LD `dateModified` (lib/source-date.ts, TECH-013). Shared by the CLI
 * (scripts/content/dates.ts) and its tests.
 *
 *   npm run content:dates         rewrite the manifest from git history
 *   npm run content:dates:check   fail if the manifest is stale (part of npm test)
 *
 * A file's date is the newest author date (`%as`) among the commits touching
 * it, so a rebase or a log order that differs from authoring order cannot move
 * it; a file with uncommitted changes counts as changed today, so regenerating before a
 * commit puts the right date in that same commit. Both modes need full
 * history: in a shallow clone every old file looks new, which is the bug the
 * manifest exists to avoid, so writing refuses and checking is skipped.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { collectSourceDates, DATED_SOURCE_ROOTS, isDatedSource } from "../../lib/source-date";

export const MANIFEST_PATH = "lib/content-dates.json";

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

/** "full", "shallow", or "none" when there is no git repository. */
export function historyKind(cwd: string = process.cwd()): "full" | "shallow" | "none" {
  try {
    return git(["rev-parse", "--is-shallow-repository"], cwd).trim() === "true" ? "shallow" : "full";
  } catch {
    return "none";
  }
}

/** Today as git's `%as` writes a commit made now: the local calendar date. */
function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The manifest as git history says it should be, sorted by path. */
export function expectedDates(cwd: string = process.cwd(), today = localToday()) {
  const roots = [...DATED_SOURCE_ROOTS];
  const tracked = git(["ls-files", "-z", "--", ...roots], cwd).split("\0").filter(isDatedSource);
  const committed = collectSourceDates(roots, cwd);
  // Modified, staged or untracked (not ignored) dated files changed today.
  const dirty = new Set(
    git(["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...roots], cwd)
      .split("\0")
      .filter((entry) => entry.length > 3 && entry[0] !== "D" && entry[1] !== "D")
      .map((entry) => entry.slice(3))
      .filter(isDatedSource),
  );
  const files = new Set([...tracked, ...dirty].filter((file) => fs.existsSync(path.join(cwd, file))));
  const dates: Record<string, string> = {};
  for (const file of [...files].sort()) {
    const date = dirty.has(file) ? today : committed[file];
    if (date) dates[file] = date;
  }
  return dates;
}

/** Human-readable differences between two manifests (empty when equal). */
export function manifestDiff(actual: Record<string, string>, expected: Record<string, string>): string[] {
  const lines: string[] = [];
  for (const file of new Set([...Object.keys(actual), ...Object.keys(expected)])) {
    if (actual[file] === expected[file]) continue;
    lines.push(`  ${file}: manifest ${actual[file] ?? "(missing)"}, git ${expected[file] ?? "(not a dated source)"}`);
  }
  return lines.sort();
}
