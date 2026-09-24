/**
 * Admin editing of live Explore listings (plan 2026-09-24 "Explore admin
 * editing", API contract). Browser-safe: uses the signed-in session helpers
 * in `lib/api` and never imports the server-only Explore fetchers.
 *
 * The form edits a deep copy of the loaded profile and classification, so
 * every field the editor does not expose (author_ran_it, related_hints,
 * guide_path, slug_words, search_phrases, ids…) is sent back exactly as
 * loaded. The server rejects unknown or missing profile keys.
 */
import { apiBase, apiErrorFrom, authedRequest, type ApiErrorDetail } from "@/lib/api";
import { resolveCoverPath } from "./cover";
import type { ExploreClassification, ExploreTaxonomy } from "./taxonomy";
import type { ListingProfilePublic } from "./types";

export const EXPLORE_EDIT_CAPABILITY = "explore.edit";

export function canEditExplore(capabilities: readonly string[] | null | undefined): boolean {
  return !!capabilities?.includes(EXPLORE_EDIT_CAPABILITY);
}

export type ListingKind = "routine" | "bundle";

export function parseListingKind(value: string | null | undefined): ListingKind | null {
  return value === "routine" || value === "bundle" ? value : null;
}

/** An item id (`wfl_…`, `wfb_…`) or slug; anything else never reaches the API. */
export function isListingRef(value: string | null | undefined): value is string {
  return !!value && value.length <= 128 && /^[a-z0-9][a-z0-9_-]*$/.test(value);
}

/** The full reviewed profile, including the two fields the public API omits. */
export type ListingProfileFull = ListingProfilePublic & {
  related_hints: string[];
  author_ran_it: boolean;
};

export type ListingEditRef = { id: string; name: string };

/** `GET /v1/admin/explore/listings/{kind}/{id}`. */
export type ExploreListingEdit = {
  kind: ListingKind;
  id: string;
  slug: string;
  revision_id: string;
  content_hash: string;
  /** Effective catalog title and summary (submitted, or the admin overlay). */
  title: string;
  summary: string;
  /** null for legacy listings published before listing profiles. */
  listing_profile: ListingProfileFull | null;
  /** "" when there is no profile. */
  profile_hash: string;
  classification: ExploreClassification | null;
  /** "" when there is no classification. */
  classification_hash: string;
  tags: string[];
  /** Relative to the API base; "" when there is no cover. */
  cover_url: string;
  /** "" until the first tags/cover edit. */
  presentation_id: string;
  refs: {
    useful_for_ids: string[];
    artefacts: ListingEditRef[];
    inputs: ListingEditRef[];
  };
  /** Server-side bounds for the overlay fields; older servers omit it. */
  limits?: Partial<EditLimits> | null;
};

/** `limits` in the edit state: the server's own bounds for the overlay fields. */
export type EditLimits = {
  title_max: number;
  summary_max: number;
  tags_max: number;
  tag_max_length: number;
  /** Regex source every tag must match; "" means no pattern (routines). */
  tag_pattern: string;
  reason_max: number;
  cover_max_bytes: number;
};

/** Used only for fields a server omits (older deployments). */
export const DEFAULT_EDIT_LIMITS: Readonly<Record<ListingKind, EditLimits>> = {
  routine: { title_max: 128, summary_max: 2000, tags_max: 12, tag_max_length: 40, tag_pattern: "", reason_max: 500, cover_max_bytes: 256 * 1024 },
  bundle: { title_max: 128, summary_max: 2000, tags_max: 12, tag_max_length: 32, tag_pattern: "^[a-z0-9-]{1,32}$", reason_max: 500, cover_max_bytes: 256 * 1024 },
};

/** The server's limits, field by field, falling back to the defaults. */
export function editLimits(edit: Pick<ExploreListingEdit, "kind" | "limits">): EditLimits {
  const fallback = DEFAULT_EDIT_LIMITS[edit.kind];
  const given = edit.limits ?? {};
  const count = (key: Exclude<keyof EditLimits, "tag_pattern">) => {
    const value = given[key];
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : fallback[key];
  };
  let pattern = typeof given.tag_pattern === "string" ? given.tag_pattern : fallback.tag_pattern;
  try { if (pattern) new RegExp(pattern); } catch { pattern = fallback.tag_pattern; }
  return {
    title_max: count("title_max"), summary_max: count("summary_max"), tags_max: count("tags_max"),
    tag_max_length: count("tag_max_length"), tag_pattern: pattern, reason_max: count("reason_max"),
    cover_max_bytes: count("cover_max_bytes"),
  };
}

/** `PUT /v1/admin/explore/listings/{kind}/{id}` body. */
export type ExploreListingEditRequest = {
  revision_id: string;
  expected_content_hash: string;
  expected_profile_hash: string;
  expected_classification_hash: string;
  expected_presentation_id: string;
  /** Catalog title (1–title_max) and summary (0–summary_max); always sent. */
  title: string;
  summary: string;
  /** null keeps it unchanged (and is the only value for a legacy listing). */
  listing_profile: ListingProfileFull | null;
  classification: ExploreClassification | null;
  tags: string[];
  /** null keeps the current cover. */
  cover_image_data_url: string | null;
  reason: string;
};

const editPath = (kind: ListingKind, id: string) =>
  `/admin/explore/listings/${kind}/${encodeURIComponent(id)}`;

export function getListingEdit(token: string, kind: ListingKind, id: string): Promise<ExploreListingEdit> {
  return authedRequest<ExploreListingEdit>(token, editPath(kind, id));
}

export function saveListingEdit(
  token: string, kind: ListingKind, id: string, body: ExploreListingEditRequest,
): Promise<ExploreListingEdit> {
  return authedRequest<ExploreListingEdit>(token, editPath(kind, id), {
    method: "PUT", body: JSON.stringify(body),
  });
}

/** The public taxonomy (`GET /v1/explore/taxonomy`), fetched from the browser. */
export async function getPublicTaxonomy(signal?: AbortSignal): Promise<ExploreTaxonomy> {
  const res = await fetch(`${apiBase()}/explore/taxonomy`, { headers: { Accept: "application/json" }, signal });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw apiErrorFrom(body, res.status);
  const data = (body as { data?: ExploreTaxonomy } | null)?.data;
  if (!data || !Array.isArray(data.terms)) throw new Error("invalid taxonomy");
  return data;
}

/** Absolute URL of the current cover, resolved like the public pages do. */
export function editCoverUrl(edit: Pick<ExploreListingEdit, "cover_url">, base = apiBase()): string | null {
  return resolveCoverPath(base, edit.cover_url);
}

/** Public page path (without locale) for the edited listing. */
export function publicListingPath(edit: Pick<ExploreListingEdit, "kind" | "slug" | "id">): string {
  return `/explore/${edit.kind === "routine" ? "routines" : "bundles"}/${edit.slug || edit.id}`;
}

/* ---------- tags ---------- */

/**
 * What the server does to tags before comparing and storing them: trim, and
 * for bundles lowercase. Internal whitespace is kept (the server keeps it).
 */
export function normalizeTag(raw: string, kind: ListingKind): string {
  const tag = raw.trim();
  return kind === "bundle" ? tag.toLowerCase() : tag;
}

/**
 * A tag as typed into the chip input. Bundles also turn spaces into hyphens
 * (their tags may not contain spaces), so "Product Hunt" becomes a valid
 * "product-hunt" instead of an error. Only used for newly typed tags.
 */
export function tagFromInput(raw: string, kind: ListingKind): string {
  const tag = normalizeTag(raw, kind);
  return kind === "bundle" ? tag.replace(/\s+/g, "-") : tag;
}

/** Why the server would reject `tag` under `limits`, or null. */
export function tagProblem(tag: string, limits: EditLimits): string | null {
  if (limits.tag_pattern) {
    return new RegExp(limits.tag_pattern).test(tag)
      ? null
      : `Use lowercase letters, digits and hyphens (1–${limits.tag_max_length} characters).`;
  }
  const bytes = new TextEncoder().encode(tag).length;
  return tag && bytes <= limits.tag_max_length ? null : `Tags must be 1–${limits.tag_max_length} characters.`;
}

/** Normalized, non-empty, deduplicated in order (the server does the same). */
export function normalizeTags(tags: readonly string[], kind: ListingKind): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTag(raw, kind);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/* ---------- form <-> payload ---------- */

export type ListingEditForm = {
  /** Catalog title/summary; edited only when the listing has no profile. */
  title: string;
  summary: string;
  profile: ListingProfileFull | null;
  classification: ExploreClassification | null;
  tags: string[];
  /** A new JPEG data URL, or null to keep the current cover. */
  coverDataUrl: string | null;
  reason: string;
};

export function formFromEdit(edit: ExploreListingEdit): ListingEditForm {
  return {
    title: edit.title,
    summary: edit.summary,
    profile: edit.listing_profile ? structuredClone(edit.listing_profile) : null,
    classification: edit.classification ? structuredClone(edit.classification) : null,
    tags: [...(edit.tags ?? [])],
    coverDataUrl: null,
    reason: "",
  };
}

/** Every string in a JSON value trimmed (the server trims profile strings too). */
export function trimStrings<T>(value: T): T {
  if (typeof value === "string") return value.trim() as T;
  if (Array.isArray(value)) return value.map(trimStrings) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, trimStrings(item)])) as T;
  return value;
}

/**
 * The PUT body. Expected hashes/ids always come from the loaded state; the
 * classification keeps its loaded `input_hash`, `taxonomy_version` and
 * `schema_version` whatever the form holds. With a profile, the public title
 * and short description are the profile's display title and meta
 * description, so the catalog title/summary go back as loaded; without one
 * (legacy listings) they are the editable fields and profile/classification
 * stay null (= unchanged). Every text is trimmed, so what the length counters
 * show is what the server receives.
 */
export function buildSaveRequest(edit: ExploreListingEdit, form: ListingEditForm): ExploreListingEditRequest {
  const classification = form.classification && edit.classification
    ? {
        ...form.classification,
        schema_version: edit.classification.schema_version,
        taxonomy_version: edit.classification.taxonomy_version,
        input_hash: edit.classification.input_hash,
      }
    : form.classification;
  return {
    revision_id: edit.revision_id,
    expected_content_hash: edit.content_hash,
    expected_profile_hash: edit.profile_hash,
    expected_classification_hash: edit.classification_hash,
    expected_presentation_id: edit.presentation_id,
    title: edit.listing_profile ? edit.title : form.title.trim(),
    summary: edit.listing_profile ? edit.summary : form.summary.trim(),
    listing_profile: edit.listing_profile && form.profile ? trimStrings(form.profile) : null,
    classification: edit.classification ? classification : null,
    tags: normalizeTags(form.tags, edit.kind),
    cover_image_data_url: form.coverDataUrl,
    reason: form.reason.trim(),
  };
}

/** Key-order-independent JSON for change detection. */
function stable(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v,
  );
}

/**
 * True when saving would change the listing (the reason alone does not).
 * Compares against the loaded values normalized the way the server
 * normalizes them, so trimming or re-casing alone is not a change.
 */
export function isEditDirty(edit: ExploreListingEdit, form: ListingEditForm): boolean {
  const body = buildSaveRequest(edit, form);
  return (
    body.cover_image_data_url !== null ||
    body.title !== edit.title.trim() ||
    body.summary !== edit.summary.trim() ||
    stable(body.listing_profile) !== stable(edit.listing_profile ? trimStrings(edit.listing_profile) : null) ||
    stable(body.classification) !== stable(edit.classification) ||
    stable(body.tags) !== stable(normalizeTags(edit.tags ?? [], edit.kind))
  );
}

/* ---------- local validation (the server stays the authority) ---------- */

const runeCount = (value: string) => Array.from(value).length;

/**
 * Problems the server would certainly reject, found before sending: required
 * texts that are empty after trimming, texts over their limit, bad tags.
 * Paths use the server's `details[].path` format so both map to fields alike.
 */
export function localProblems(edit: ExploreListingEdit, form: ListingEditForm): ApiErrorDetail[] {
  const limits = editLimits(edit);
  const body = buildSaveRequest(edit, form);
  const out: ApiErrorDetail[] = [];
  const add = (path: string, instruction: string) => out.push({ path, rule: "local", instruction });
  const text = (path: string, value: string, min: number, max: number) => {
    const length = runeCount(value);
    if (min > 0 && length === 0) add(path, "Required.");
    else if (length < min) add(path, `Use at least ${min} characters.`);
    else if (length > max) add(path, `Use at most ${max} characters.`);
  };
  if (!edit.listing_profile) {
    text("title", body.title, 1, limits.title_max);
    text("summary", body.summary, 0, limits.summary_max);
  }
  text("reason", body.reason, 0, limits.reason_max);
  if (body.tags.length > limits.tags_max) add("tags", `Use at most ${limits.tags_max} tags.`);
  body.tags.forEach((tag, i) => { const issue = tagProblem(tag, limits); if (issue) add(`tags[${i}]`, issue); });
  const p = body.listing_profile;
  if (p) {
    const at = (path: string) => `listing_profile.${path}`;
    const L = LIMITS;
    text(at("search.display_title"), p.search.display_title, 1, L.displayTitle);
    text(at("search.seo_title"), p.search.seo_title, 1, L.seoTitle);
    text(at("search.meta_description"), p.search.meta_description, L.metaDescription[0], L.metaDescription[1]);
    text(at("search.job_statement"), p.search.job_statement, 1, L.jobStatement);
    text(at("answer"), p.answer, L.answer[0], L.answer[1]);
    text(at("cover_alt"), p.cover_alt, 1, L.coverAlt);
    text(at("time_and_effort.you_prepare"), p.time_and_effort.you_prepare, 1, L.youPrepare);
    text(at("time_and_effort.run_estimate"), p.time_and_effort.run_estimate, 1, L.runEstimate);
    const lines = (key: "use_cases" | "how_it_works" | "stays_in_your_control", bounds: { min: number; max: number; length: number }) => {
      const items = p[key];
      if (items.length < bounds.min || items.length > bounds.max) add(at(key), `Keep ${bounds.min}–${bounds.max} items.`);
      items.forEach((item, i) => text(at(`${key}[${i}]`), item, 1, bounds.length));
    };
    lines("use_cases", L.useCases);
    lines("how_it_works", L.howItWorks);
    lines("stays_in_your_control", L.staysInYourControl);
    const count = (key: string, n: number, bounds: { min: number; max: number }) => {
      if (n < bounds.min || n > bounds.max) add(at(key), bounds.min ? `Keep ${bounds.min}–${bounds.max} items.` : `Keep at most ${bounds.max} items.`);
    };
    count("for_whom", p.for_whom.length, L.forWhom);
    p.for_whom.forEach((item, i) => {
      if (!item.useful_for_id) add(at(`for_whom[${i}].useful_for_id`), "Choose an audience.");
      text(at(`for_whom[${i}].why`), item.why, 1, L.forWhom.why);
    });
    count("results", p.results.length, L.results);
    p.results.forEach((item, i) => {
      text(at(`results[${i}].name`), item.name, 1, L.results.name);
      text(at(`results[${i}].description`), item.description, 1, L.results.description);
      text(at(`results[${i}].format_label`), item.format_label, 1, L.results.formatLabel);
    });
    count("you_provide", p.you_provide.length, L.youProvide);
    p.you_provide.forEach((item, i) => {
      text(at(`you_provide[${i}].label`), item.label, 1, L.youProvide.label);
      text(at(`you_provide[${i}].description`), item.description, 1, L.youProvide.description);
      text(at(`you_provide[${i}].example`), item.example, 0, L.youProvide.example);
    });
    count("faq", p.faq.length, L.faq);
    p.faq.forEach((item, i) => {
      text(at(`faq[${i}].question`), item.question, 1, L.faq.question);
      text(at(`faq[${i}].answer`), item.answer, 1, L.faq.answer);
    });
    p.customization.forEach((item, i) => {
      text(at(`customization[${i}].label`), item.label, 1, L.customization.label);
      for (const key of ["default", "allowed", "note"] as const) text(at(`customization[${i}].${key}`), item[key], 0, L.customization.text);
    });
    p.third_parties.forEach((item, i) => {
      text(at(`third_parties[${i}].name`), item.name, 1, L.thirdParties.name);
      text(at(`third_parties[${i}].note`), item.note, 0, L.thirdParties.note);
    });
  }
  return out;
}

/**
 * Field errors are keyed by path; when a list's rows move, the errors move
 * with them. `order[newIndex] = oldIndex` (-1 for a new row); errors of
 * removed rows are dropped.
 */
export function remapListErrors(
  errors: ReadonlyMap<string, string[]>, listPath: string, order: readonly number[],
): Map<string, string[]> {
  const prefix = `${listPath}[`;
  const next = new Map<string, string[]>();
  const newIndexOf = new Map(order.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  for (const [path, messages] of errors) {
    if (!path.startsWith(prefix)) { next.set(path, messages); continue; }
    const match = /^\[(\d+)\](.*)$/.exec(path.slice(listPath.length));
    if (!match) { next.set(path, messages); continue; }
    const newIndex = newIndexOf.get(Number(match[1]));
    if (newIndex !== undefined) next.set(`${listPath}[${newIndex}]${match[2]}`, messages);
  }
  return next;
}

/* ---------- validation details -> fields ---------- */

/**
 * The field a server `details[].path` belongs to: the path itself when a
 * field renders it, else its nearest rendered ancestor (`tags[2]` → `tags`,
 * `listing_profile.results[1].artefact_id` → `listing_profile.results[1]` …),
 * else null (shown in the summary).
 */
export function fieldForPath(path: string, known: ReadonlySet<string>): string | null {
  let current = path;
  while (current) {
    if (known.has(current)) return current;
    const next = current.replace(/(\[\d+\]|\.[^.[\]]+)$/, "");
    if (next === current) break;
    current = next;
  }
  return null;
}

export function groupErrorDetails(details: readonly ApiErrorDetail[], known: ReadonlySet<string>) {
  const fields = new Map<string, string[]>();
  const unmatched: ApiErrorDetail[] = [];
  for (const detail of details) {
    const field = fieldForPath(detail.path, known);
    const text = detail.instruction || detail.rule || "Check this field.";
    if (field) fields.set(field, [...(fields.get(field) ?? []), text]);
    else unmatched.push(detail);
  }
  return { fields, unmatched };
}

/* ---------- server limits (contract §13 validation), for counters and row bounds ---------- */

export const LIMITS = {
  title: 128,
  summary: 2000,
  displayTitle: 60,
  seoTitle: 60,
  metaDescription: [50, 160],
  answer: [200, 600],
  jobStatement: 160,
  coverAlt: 200,
  reason: 500,
  youPrepare: 200,
  runEstimate: 80,
  useCases: { min: 2, max: 4, length: 200 },
  howItWorks: { min: 3, max: 7, length: 200 },
  staysInYourControl: { min: 1, max: 6, length: 200 },
  forWhom: { min: 1, max: 5, why: 200 },
  results: { min: 1, max: 12, name: 80, description: 300, formatLabel: 60 },
  youProvide: { min: 0, max: 12, label: 80, description: 300, example: 200 },
  faq: { min: 0, max: 5, question: 160, answer: 500 },
  customization: { label: 80, text: 200 },
  thirdParties: { name: 80, note: 200 },
  topics: [1, 3],
  usefulFor: [1, 5],
} as const;
