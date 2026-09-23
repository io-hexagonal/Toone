/**
 * Lenient decoding of the public listing profile (contract §13).
 *
 * The server validates every rule in §1.2; the web trusts its lengths and
 * references but never its shape. Unknown keys are ignored (the server may
 * add fields), and the two private fields (`author_ran_it`, `related_hints`)
 * are dropped even if a server ever sent them. Anything structurally wrong
 * makes the whole profile absent, so the page falls back to the legacy
 * layout instead of rendering half a profile or crashing; the reason is
 * logged with the JSON path.
 */
import {
  CUSTOMIZATION_KINDS,
  THIRD_PARTY_ACTIONS,
  THIRD_PARTY_COSTS,
  type ListingProfilePublic,
  type ThirdPartyReview,
} from "./types";

class ProfileShapeError extends Error {
  constructor(public path: string) {
    super(`invalid ${path}`);
  }
}

type Obj = Record<string, unknown>;
const isObj = (value: unknown): value is Obj =>
  !!value && typeof value === "object" && !Array.isArray(value);

function obj(value: unknown, path: string): Obj {
  if (!isObj(value)) throw new ProfileShapeError(path);
  return value;
}
/** A trimmed string; `required` also rejects the empty string. */
function str(value: unknown, path: string, required = true): string {
  if (typeof value !== "string") throw new ProfileShapeError(path);
  const out = value.trim();
  if (required && !out) throw new ProfileShapeError(path);
  return out;
}
/** Optional text: absent or null reads as "". */
function optStr(value: unknown, path: string): string {
  return value === undefined || value === null ? "" : str(value, path, false);
}
function list<T>(
  value: unknown,
  path: string,
  item: (value: unknown, path: string) => T,
  { optional = false, min = 0 } = {},
): T[] {
  if (optional && (value === undefined || value === null)) return [];
  if (!Array.isArray(value) || value.length < min) throw new ProfileShapeError(path);
  return value.map((entry, index) => item(entry, `${path}[${index}]`));
}
function nullableId(value: unknown, path: string): string | null {
  return value === null || value === undefined ? null : str(value, path);
}
function oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value))
    throw new ProfileShapeError(path);
  return value as T;
}

/** §1.2: `""` or a site-relative English guide path. Anything else is dropped. */
const GUIDE_PATH = /^\/en\/[a-z0-9/-]{1,120}$/;

function decode(raw: unknown): ListingProfilePublic {
  const p = obj(raw, "listing_profile");
  if (p.profile_schema_version !== 1)
    throw new ProfileShapeError("listing_profile.profile_schema_version");
  const s = obj(p.search, "listing_profile.search");
  const at = (key: string) => `listing_profile.${key}`;
  const time = obj(p.time_and_effort, at("time_and_effort"));
  const guide = typeof p.guide_path === "string" ? p.guide_path.trim() : "";
  const search = {
    job_statement: str(s.job_statement, at("search.job_statement")),
    search_phrases: list(s.search_phrases, at("search.search_phrases"), (v, path) => str(v, path), { optional: true }),
    display_title: str(s.display_title, at("search.display_title")),
    seo_title: str(s.seo_title, at("search.seo_title")),
    meta_description: str(s.meta_description, at("search.meta_description")),
    slug_words: list(s.slug_words, at("search.slug_words"), (v, path) => str(v, path), { optional: true }),
  };
  return {
    profile_schema_version: 1,
    search,
    answer: str(p.answer, at("answer")),
    for_whom: list(p.for_whom, at("for_whom"), (v, path) => {
      const o = obj(v, path);
      return { useful_for_id: str(o.useful_for_id, `${path}.useful_for_id`), why: str(o.why, `${path}.why`) };
    }, { min: 1 }),
    use_cases: list(p.use_cases, at("use_cases"), (v, path) => str(v, path)),
    time_and_effort: {
      you_prepare: optStr(time.you_prepare, at("time_and_effort.you_prepare")),
      run_estimate: optStr(time.run_estimate, at("time_and_effort.run_estimate")),
    },
    results: list(p.results, at("results"), (v, path) => {
      const o = obj(v, path);
      return {
        artefact_id: nullableId(o.artefact_id, `${path}.artefact_id`),
        name: str(o.name, `${path}.name`),
        description: str(o.description, `${path}.description`),
        format_label: optStr(o.format_label, `${path}.format_label`),
      };
    }, { min: 1 }),
    how_it_works: list(p.how_it_works, at("how_it_works"), (v, path) => str(v, path), { min: 1 }),
    you_provide: list(p.you_provide, at("you_provide"), (v, path) => {
      const o = obj(v, path);
      return {
        input_id: nullableId(o.input_id, `${path}.input_id`),
        label: str(o.label, `${path}.label`),
        description: str(o.description, `${path}.description`),
        example: optStr(o.example, `${path}.example`),
      };
    }, { optional: true }),
    stays_in_your_control: list(p.stays_in_your_control, at("stays_in_your_control"), (v, path) => str(v, path), { min: 1 }),
    customization: list(p.customization, at("customization"), (v, path) => {
      const o = obj(v, path);
      return {
        id: str(o.id, `${path}.id`),
        label: str(o.label, `${path}.label`),
        kind: oneOf(o.kind, CUSTOMIZATION_KINDS, `${path}.kind`),
        target: optStr(o.target, `${path}.target`),
        default: optStr(o.default, `${path}.default`),
        allowed: optStr(o.allowed, `${path}.allowed`),
        note: optStr(o.note, `${path}.note`),
      };
    }, { optional: true }),
    third_parties: list(p.third_parties, at("third_parties"), (v, path) => {
      const o = obj(v, path);
      const url = str(o.url, `${path}.url`);
      // Only https links are published (§1.2); never render another scheme.
      if (!/^https:\/\/[^\s/]+/i.test(url)) throw new ProfileShapeError(`${path}.url`);
      return {
        id: str(o.id, `${path}.id`),
        name: str(o.name, `${path}.name`),
        url,
        domain: str(o.domain, `${path}.domain`).toLowerCase(),
        actions: [...new Set(list(o.actions, `${path}.actions`, (a, ap) => oneOf(a, THIRD_PARTY_ACTIONS, ap), { min: 1 }))],
        cost: oneOf(o.cost ?? "unknown", THIRD_PARTY_COSTS, `${path}.cost`),
        note: optStr(o.note, `${path}.note`),
      };
    }, { optional: true }),
    faq: list(p.faq, at("faq"), (v, path) => {
      const o = obj(v, path);
      return { question: str(o.question, `${path}.question`), answer: str(o.answer, `${path}.answer`) };
    }, { optional: true }),
    guide_path: GUIDE_PATH.test(guide) ? guide : "",
    cover_alt: typeof p.cover_alt === "string" && p.cover_alt.trim() ? p.cover_alt.trim() : search.display_title,
  };
}

/**
 * The public profile, or null when absent or malformed. `record` names the
 * record in the log line (never the payload: it may be large).
 */
export function normalizeListingProfile(
  raw: unknown,
  record: string,
): ListingProfilePublic | null {
  if (raw === undefined || raw === null) return null;
  try {
    return decode(raw);
  } catch (error) {
    console.warn(
      `[explore] ignoring malformed listing_profile on ${record}: ${
        error instanceof ProfileShapeError ? error.message : "unexpected shape"
      }; rendering the fallback layout`,
    );
    return null;
  }
}

/** Public review verdicts; `excluded` never reaches the page even if sent. */
export function normalizeThirdPartyReviews(raw: unknown): ThirdPartyReview[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!isObj(entry) || typeof entry.domain !== "string") return [];
    if (entry.status !== "well_known" && entry.status !== "ok" && entry.status !== "ok_with_note") return [];
    return [{
      domain: entry.domain.trim().toLowerCase(),
      status: entry.status,
      note: typeof entry.note === "string" ? entry.note.trim() : "",
    }];
  });
}
