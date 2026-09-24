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
};

/** `PUT /v1/admin/explore/listings/{kind}/{id}` body. */
export type ExploreListingEditRequest = {
  revision_id: string;
  expected_content_hash: string;
  expected_profile_hash: string;
  expected_classification_hash: string;
  expected_presentation_id: string;
  /** Catalog title (1–128) and summary (1–2000); always sent. */
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

export const MAX_TAGS = 12;

/** Trims (and for bundles lowercases and hyphenates) one typed tag. */
export function normalizeTag(raw: string, kind: ListingKind): string {
  const tag = raw.trim().replace(/\s+/g, " ");
  return kind === "bundle" ? tag.toLowerCase().replace(/ /g, "-") : tag;
}

/** Why the server would reject `tag`, or null. Mirrors the contract rules. */
export function tagProblem(tag: string, kind: ListingKind): string | null {
  if (kind === "bundle")
    return /^[a-z0-9-]{1,32}$/.test(tag) ? null : "Bundle tags use lowercase letters, digits and hyphens (1–32 characters).";
  return tag && new TextEncoder().encode(tag).length <= 40 ? null : "Tags must be 1–40 characters.";
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

/**
 * The PUT body. Expected hashes/ids always come from the loaded state; the
 * classification keeps its loaded `input_hash`, `taxonomy_version` and
 * `schema_version` whatever the form holds. With a profile, the public title
 * and short description are the profile's display title and meta
 * description, so the catalog title/summary go back as loaded; without one
 * (legacy listings) they are the editable fields and profile/classification
 * stay null (= unchanged).
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
    listing_profile: edit.listing_profile ? form.profile : null,
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

/** True when saving would change the listing (the reason alone does not). */
export function isEditDirty(edit: ExploreListingEdit, form: ListingEditForm): boolean {
  const body = buildSaveRequest(edit, form);
  return (
    body.cover_image_data_url !== null ||
    body.title !== edit.title ||
    body.summary !== edit.summary ||
    stable(body.listing_profile) !== stable(edit.listing_profile) ||
    stable(body.classification) !== stable(edit.classification) ||
    stable(body.tags) !== stable(edit.tags ?? [])
  );
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
