import { execFileSync } from "node:child_process";

/**
 * Build-time date provenance for `lastmod` / `dateModified`.
 *
 * Both signals must describe when the *content* last changed, not when the
 * site was last deployed (TECH-013). Frontmatter `updated:` is hand-maintained
 * and drifts — `/en/governance` reported 2026-09-11 for copy edited 2026-09-20
 * (G2 follow-up 4) — so the commit date of the file backing a route is the
 * authority, with the hand-written date as the only fallback. There is no
 * build-date fallback: a deploy is not a content change, so an unknown date
 * stays unknown (callers omit it).
 */

const cache = new Map<string, string | null>();

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `YYYY-MM-DD` of the last commit touching each tracked file under `dir`, in
 * one `git log` pass. next.config.ts runs this at build time and inlines the
 * result as TOONE_SOURCE_DATES, because pages render per request (the CSP
 * nonce, lib/csp.ts) and the serverless runtime has no git history. Empty when
 * git is unavailable.
 */
export function collectSourceDates(dir: string, cwd: string = process.cwd()): Record<string, string> {
  const dates: Record<string, string> = {};
  try {
    const out = execFileSync("git", ["log", "--format=%x00%cs", "--name-only", "--", dir], {
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
      } else if (current && line.trim() && !(line in dates)) {
        dates[line.trim()] = current;
      }
    }
  } catch {
    // No git on this host: callers fall back as before.
  }
  return dates;
}

/** Dates inlined at build time (next.config.ts), or an empty map. */
function buildTimeDates(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(process.env.TOONE_SOURCE_DATES || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

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

  const built = buildTimeDates()[sourcePath];
  if (built && DATE.test(built)) {
    cache.set(sourcePath, built);
    return built;
  }

  let value: string | null = null;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", sourcePath], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (DATE.test(out)) value = out;
  } catch {
    // git is not guaranteed on the build host; the caller's fallback applies.
  }
  cache.set(sourcePath, value);
  return value;
}
