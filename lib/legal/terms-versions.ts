/**
 * Every version of the Terms a Toone Pro buyer could have accepted, oldest
 * first, each named by the date it took effect (`YYYY-MM-DD`). A purchase
 * confirmation email links to `/en/terms?version=<date>`, so each version
 * stays readable at that address after it is replaced, the current one
 * included.
 *
 * To change the Terms: copy the current text to a component under
 * `app/[locale]/terms/versions/`, register it for its date in
 * `app/[locale]/terms/versions.ts`, then append the new version here.
 */
export type TermsVersion = {
  /** The day it took effect, `YYYY-MM-DD` (the `version` query value). */
  readonly date: string;
  /** The same day as the page shows it ("Updated …"). */
  readonly label: string;
};

export const TERMS_VERSIONS: readonly TermsVersion[] = Object.freeze([
  { date: "2026-11-11", label: "November 11, 2026" },
]);

export const CURRENT_TERMS_VERSION: TermsVersion = TERMS_VERSIONS[TERMS_VERSIONS.length - 1];

/** The query parameter that asks for a version: `/en/terms?version=2026-11-11`. */
export const TERMS_VERSION_PARAM = "version";

/** Which Terms a request shows, and why. */
export type TermsVersionView =
  /** No version was asked for: the current Terms. */
  | { kind: "current"; version: TermsVersion }
  /** The version in force on the requested day (possibly the current one). */
  | { kind: "requested"; version: TermsVersion; requested: string; isCurrent: boolean }
  /** Not a date, or a day no version covers: the current Terms, with a note. */
  | { kind: "unknown"; version: TermsVersion };

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar day written `YYYY-MM-DD`. */
export function isTermsDate(value: string): boolean {
  const match = DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** `YYYY-MM-DD` of `now` in UTC. */
function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * The version in force on `day` (`YYYY-MM-DD`): the latest that took effect
 * on or before it. Null before the first version, after `today`, or for
 * anything that is not a date.
 */
export function termsVersionAt(
  day: string,
  versions: readonly TermsVersion[] = TERMS_VERSIONS,
  today: string = utcDay(new Date()),
): TermsVersion | null {
  if (!isTermsDate(day) || day > today) return null;
  let found: TermsVersion | null = null;
  for (const version of versions) {
    if (version.date <= day) found = version;
  }
  return found;
}

/** What to show for the `version` query value (absent, one value, or repeated: the first counts). */
export function resolveTermsVersion(
  param: string | readonly string[] | undefined,
  versions: readonly TermsVersion[] = TERMS_VERSIONS,
  today: string = utcDay(new Date()),
): TermsVersionView {
  const current = versions[versions.length - 1];
  const raw = typeof param === "string" ? param : param?.[0];
  if (raw === undefined) return { kind: "current", version: current };
  const requested = raw.trim();
  const version = termsVersionAt(requested, versions, today);
  if (!version) return { kind: "unknown", version: current };
  return { kind: "requested", version, requested, isCurrent: version.date === current.date };
}

/** A `YYYY-MM-DD` day as the Terms write dates ("November 11, 2026"). */
export function formatTermsDate(day: string): string {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${day}T00:00:00Z`));
}

/** The address of one version of the Terms, as purchase confirmations link it. */
export function termsVersionPath(version: TermsVersion | string): string {
  const date = typeof version === "string" ? version : version.date;
  return `/en/terms?${TERMS_VERSION_PARAM}=${encodeURIComponent(date)}`;
}
