import { execFileSync } from "node:child_process";

/**
 * Build-time date provenance for `lastmod` / `dateModified`.
 *
 * Both signals must describe when the *content* last changed, not when the
 * site was last deployed (TECH-013). Frontmatter `updated:` is hand-maintained
 * and drifts — `/en/governance` reported 2026-09-11 for copy edited 2026-09-20
 * (G2 follow-up 4) — so the commit date of the file backing a route is the
 * authority, with the hand-written date as the only fallback.
 */

/** Fallback when git history is unavailable (e.g. a shallow CI checkout). */
export const BUILD_DATE = new Date().toISOString().slice(0, 10);

const cache = new Map<string, string | null>();

/**
 * `YYYY-MM-DD` of the last commit touching `sourcePath`, or `null` when the
 * path is unknown, untracked, or git is not available on the build host.
 * `null` is deliberate: callers decide what to fall back to and whether to
 * report it, rather than silently receiving today's date.
 */
export function gitLastCommitDate(sourcePath: string | null | undefined): string | null {
  if (!sourcePath) return null;
  const cached = cache.get(sourcePath);
  if (cached !== undefined) return cached;

  let value: string | null = null;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", sourcePath], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) value = out;
  } catch {
    // git is not guaranteed on the build host; the caller's fallback applies.
  }
  cache.set(sourcePath, value);
  return value;
}
