import { execFileSync } from "node:child_process";
import committedDates from "./content-dates.json";
import { ROUTE_SOURCE_FILES } from "./route-sources";

/**
 * Date provenance for `lastmod` / `dateModified` (TECH-013).
 *
 * Both signals describe when the *content* last changed, not when the site
 * was last deployed. The authority is the commit date of the files backing a
 * route (its page and the components that render its main content,
 * lib/route-sources.ts), and those dates are read from
 * `lib/content-dates.json`, a manifest committed with the code (A2).
 *
 * Why a committed file and not git at build time: Vercel builds from a
 * shallow clone (about 10 commits). In a shallow clone the oldest commit
 * present appears to add every file, so `git log -1 -- <file>` returned a
 * recent date for every page untouched since then: the live sitemap dated 22
 * of 25 pages to the deploy day, and `/en/governance` said
 * `dateModified: 2026-11-25` for copy last edited 2026-09-28 (technical audit
 * M3, 2026-11-26). The manifest is written from full history on a developer
 * machine (`npm run content:dates`) and `npm test` fails when it is stale
 * (`npm run content:dates:check`), so the build never needs git.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const ROUTE_FILES = new Set(ROUTE_SOURCE_FILES);

/**
 * The files whose dates the site publishes: every page and content file, plus
 * the components and data files a sitemap route names as its sources
 * (lib/route-sources.ts).
 */
export function isDatedSource(path: string): boolean {
  return (
    path.startsWith("content/") ||
    (path.startsWith("app/[locale]/") && path.endsWith("/page.tsx")) ||
    ROUTE_FILES.has(path)
  );
}

/**
 * Pathspecs that hold every dated source: `content`, `app`, and each route
 * source outside them. No `[` in any of them: git reads those as patterns.
 */
export const DATED_SOURCE_ROOTS: readonly string[] = [
  "content",
  "app",
  ...ROUTE_SOURCE_FILES.filter((file) => !file.startsWith("app/") && !file.startsWith("content/")),
];

/**
 * `YYYY-MM-DD` of the last commit touching each file under `roots`, from one
 * `git log` pass. Used only to write and check the manifest
 * (scripts/content/dates.ts), on a clone with full history. Empty when git is
 * unavailable.
 */
export function collectSourceDates(
  roots: string | readonly string[],
  cwd: string = process.cwd(),
): Record<string, string> {
  const dates: Record<string, string> = {};
  try {
    const out = execFileSync("git", ["log", "--format=%x00%cs", "--name-only", "--", ...[roots].flat()], {
      cwd,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    let current: string | null = null;
    for (const line of out.split("\n")) {
      if (line.startsWith("\0")) {
        const date = line.slice(1).trim();
        current = DATE.test(date) ? date : null;
      } else if (current && line.trim() && !(line.trim() in dates)) {
        dates[line.trim()] = current;
      }
    }
  } catch {
    // No git on this host.
  }
  return dates;
}

const MANIFEST: Readonly<Record<string, string>> = committedDates;

/**
 * `YYYY-MM-DD` when the content behind `sourcePath` last changed, from the
 * committed manifest, or `null` when the path is not in it. `null` is
 * deliberate: callers fall back to a declared editorial date or omit the date,
 * never today's date.
 */
export function contentDate(sourcePath: string | null | undefined): string | null {
  if (!sourcePath) return null;
  const date = MANIFEST[sourcePath];
  return typeof date === "string" && DATE.test(date) ? date : null;
}
