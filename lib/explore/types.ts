import type { ExploreClassification } from "./taxonomy";
import type { ExplorePrice } from "./price";
/**
 * Explore wire types — derived from the frozen contract in
 * docs/architecture/explore/contract.md (§5) and its fixtures.
 *
 * Field names mirror the JSON exactly (snake_case) so a fixture can be
 * assigned to these types without mapping. Fields the live server predates
 * (`slug`, `cover_url`) are optional; `resolveSlug` / `resolveCoverUrl` in
 * `./api` supply the fallbacks.
 */

export type RoutineListing = "standalone" | "bundle_only";

/** `GET /v1/workflows` items (contract §5.1). */
export type RoutineCatalogEntry = {
  classification?: ExploreClassification | null;
  classification_hash?: string;
  workflow_id: string;
  slug?: string | null;
  revision_id: string;
  title: string;
  summary: string;
  tags: string[];
  license: string;
  listing?: RoutineListing;
  content_hash: string;
  routine_schema_version: number;
  member_count: number;
  sub_routine_count: number;
  step_count: number;
  agent_count: number;
  cover_url?: string | null;
  /** Legacy inline cover for the shipping desktop build; superseded by `cover_url`. */
  cover_image_data_url?: string | null;
  author_name: string;
  /** True when Toone (a platform admin) published it: show the Toone mark. */
  author_official?: boolean;
  approved_at: string;
} & CardPresentation;

/**
 * Card fields a schema-3 record carries (contract §13): `display_title`,
 * `card_summary` (= the profile's meta description) and the number of
 * results. `null` or absent for legacy records.
 */
export type CardPresentation = {
  display_title?: string | null;
  card_summary?: string | null;
  results_count?: number | null;
  /** Contract §5 marketplace price; absent reads as free. */
  price?: ExplorePrice;
};

/** One shared routine family inside a package: the root routine or a direct child. */
export type PackageMember = {
  key: string;
  source_routine_id: string;
  parent_key?: string;
  owner_agent_key?: string;
  payload: RoutinePayload;
};

/**
 * The versioned routine payload. Only the fields the web renders are typed;
 * the desktop owns the full schema and may add fields at any time.
 */
export type RoutinePayload = {
  name?: string;
  purpose?: string;
  preamble?: string;
  prerequisites?: string;
  escalation?: string;
  agentName?: string;
  cadence?: string;
  departmentId?: string;
  isSubRoutine?: boolean;
  parentId?: string;
  schemaVersion?: number;
  steps?: RoutineStep[];
  inputs?: RoutineInput[];
  artefacts?: { id: string; name?: string; format?: string; description?: string }[];
};

export type RoutineStep = {
  id: string;
  title: string;
  description?: string;
  completionCriteria?: string[];
  subRoutineId?: string;
  childInputBindings?: { childInputId: string; sourceKind: string; sourceId: string }[];
  executorAgentId?: string;
  skillIds?: string[];
  outcomes?: { id: string; description?: string; isTerminal?: boolean }[];
};

export type RoutineInput = {
  id: string;
  kind?: string;
  description?: string;
  requirement?: string;
  valueType?: string;
};

export type PackageAgent = {
  source_id: string;
  name: string;
  description: string;
  greeting?: string;
  capabilities: string[];
  skill_ids: string[];
  mcp_ids: string[];
};

export type PackageSkill = {
  id: string;
  markdown: string;
  metadata_json?: string | null;
  semantic_hash: string;
};

export type PackageRequirements = {
  agent_ids?: string[];
  skill_ids?: string[];
  model_ids?: string[];
  mcp_ids?: string[];
  resource_bindings?: string[];
};

export type WorkflowPackage = {
  format_version: number;
  routine_schema_version: number;
  minimum_app_version?: string;
  root_key: string;
  members: PackageMember[];
  requirements?: PackageRequirements;
  agents?: PackageAgent[];
  skills?: PackageSkill[];
  resources?: {
    member_key: string;
    input_id: string;
    binding: string;
    value_type: string;
    mode: string;
    reason?: string;
    content?: string | null;
    byte_count: number;
    sha256?: string;
    directory_entries?: {
      relative_path: string;
      content: string;
      byte_count: number;
      sha256: string;
    }[];
  }[];
};

export type BundleRef = {
  bundle_id: string;
  slug?: string | null;
  title: string;
};

/** `GET /v1/workflows/{id-or-slug}` (contract §5.2). */
export type RoutinePublicDetail = {
  classification?: ExploreClassification | null;
  classification_hash?: string;
  workflow_id: string;
  slug?: string | null;
  revision_id: string;
  sequence: number;
  title: string;
  summary: string;
  tags: string[];
  license: string;
  listing?: RoutineListing;
  cover_url?: string | null;
  cover_image_data_url?: string | null;
  /** Contract §5 marketplace price; absent reads as free. */
  price?: ExplorePrice;
  author_name: string;
  /** True when Toone (a platform admin) published it: show the Toone mark. */
  author_official?: boolean;
  approved_at: string;
  content_hash: string;
  package_schema_version: number;
  routine_schema_version: number;
  member_count: number;
  sub_routine_count: number;
  step_count: number;
  agent_count: number;
  included_in_bundles?: BundleRef[];
  package: WorkflowPackage;
} & ProfileFields;

/** Contract §13 additions to both public details; absent on legacy records. */
export type ProfileFields = {
  listing_profile?: ListingProfilePublic | null;
  /** False only when the server says so; legacy records are indexable. */
  indexable?: boolean;
  third_party_reviews?: ThirdPartyReview[];
  related?: RoutineCatalogEntry[];
};

export type BundleMemberRef = {
  position: number;
  workflow_id: string;
  slug?: string | null;
  title: string;
  revision_id: string;
  cover_url?: string | null;
};

/** `GET /v1/bundles` items (contract §5.4). */
export type BundleCatalogEntry = {
  classification?: ExploreClassification | null;
  classification_hash?: string;
  bundle_id: string;
  slug?: string | null;
  revision_id: string;
  title: string;
  summary: string;
  tags: string[];
  content_hash: string;
  member_count: number;
  cover_url?: string | null;
  cover_image_data_url?: string | null;
  author_name: string;
  /** True when Toone (a platform admin) published it: show the Toone mark. */
  author_official?: boolean;
  approved_at: string;
  members: BundleMemberRef[];
} & CardPresentation;

export type BundleMemberDetail = RoutineCatalogEntry & {
  position: number;
  pinned_revision_id: string;
  newer_revision_available: boolean;
};

/** `GET /v1/bundles/{id-or-slug}` (contract §5.5). */
export type BundlePublicDetail = {
  classification?: ExploreClassification | null;
  classification_hash?: string;
  bundle_id: string;
  slug?: string | null;
  revision_id: string;
  sequence: number;
  title: string;
  summary: string;
  tags: string[];
  content_hash: string;
  member_count: number;
  cover_url?: string | null;
  cover_image_data_url?: string | null;
  /** Contract §5 marketplace price; absent reads as free. */
  price?: ExplorePrice;
  author_name: string;
  /** True when Toone (a platform admin) published it: show the Toone mark. */
  author_official?: boolean;
  approved_at: string;
  members: BundleMemberDetail[];
} & ProfileFields;

export type ExploreFeedItem = {
  type: "routine" | "bundle";
  id: string;
  slug?: string | null;
  approved_at: string;
  updated_at: string;
  /** Contract §13: `false` keeps the item out of the sitemap. */
  indexable?: boolean;
};

/** `GET /v1/explore/feed` (contract §5.8). */
export type ExploreFeed = { items: ExploreFeedItem[]; generated_at: string };

/** `GET /v1/explore/tags` items (contract §5.9). */
export type ExploreTag = { tag: string; routines: number; bundles: number };

/** Server → web webhook body (contract §9). */
export type RevalidateEvent = {
  event: "approved" | "removed" | "repinned" | "listing_changed";
  type: "routine" | "bundle";
  id: string;
  slug: string;
  occurred_at: string;
};

export type ListResult<T> = { items: T[]; total: number };

/* ---------- Listing profile (contract §13, profile_schema_version 1) ---------- */

export type ListingProfileSearch = {
  job_statement: string;
  search_phrases: string[];
  display_title: string;
  seo_title: string;
  meta_description: string;
  slug_words: string[];
};
export type ListingProfileAudience = { useful_for_id: string; why: string };
export type ListingProfileResult = {
  artefact_id: string | null;
  name: string;
  description: string;
  format_label: string;
};
export type ListingProfileInput = {
  input_id: string | null;
  label: string;
  description: string;
  example: string;
};
export const CUSTOMIZATION_KINDS = ["input", "site_list", "tone", "schedule", "limit", "format", "model", "step"] as const;
export type ListingProfileCustomization = {
  id: string;
  label: string;
  kind: (typeof CUSTOMIZATION_KINDS)[number];
  target: string;
  default: string;
  allowed: string;
  note: string;
};
export const THIRD_PARTY_ACTIONS = ["read", "signup", "profile", "post", "submit", "pay"] as const;
export type ThirdPartyAction = (typeof THIRD_PARTY_ACTIONS)[number];
export const THIRD_PARTY_COSTS = ["free", "freemium", "paid", "unknown"] as const;
export type ListingProfileThirdParty = {
  id: string;
  name: string;
  url: string;
  domain: string;
  actions: ThirdPartyAction[];
  cost: (typeof THIRD_PARTY_COSTS)[number];
  note: string;
};
export type ListingProfileFaq = { question: string; answer: string };

/**
 * The public projection of a listing profile: the §1.1 shape without
 * `author_ran_it` and `related_hints`, which the server never publishes.
 */
export type ListingProfilePublic = {
  profile_schema_version: 1;
  search: ListingProfileSearch;
  answer: string;
  for_whom: ListingProfileAudience[];
  use_cases: string[];
  time_and_effort: { you_prepare: string; run_estimate: string };
  results: ListingProfileResult[];
  how_it_works: string[];
  you_provide: ListingProfileInput[];
  stays_in_your_control: string[];
  customization: ListingProfileCustomization[];
  third_parties: ListingProfileThirdParty[];
  faq: ListingProfileFaq[];
  guide_path: string;
  cover_alt: string;
};

export type ThirdPartyReview = {
  domain: string;
  status: "well_known" | "ok" | "ok_with_note";
  note: string;
};
