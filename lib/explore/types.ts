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
  approved_at: string;
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
};

export type RoutineStep = {
  id: string;
  title: string;
  description?: string;
  completionCriteria?: string[];
  subRoutineId?: string;
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
  author_name: string;
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
  approved_at: string;
  members: BundleMemberRef[];
};

export type BundleMemberDetail = RoutineCatalogEntry & {
  position: number;
  pinned_revision_id: string;
  newer_revision_available: boolean;
};

/** `GET /v1/bundles/{id-or-slug}` (contract §5.5). */
export type BundlePublicDetail = {
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
  author_name: string;
  approved_at: string;
  members: BundleMemberDetail[];
};

export type ExploreFeedItem = {
  type: "routine" | "bundle";
  id: string;
  slug?: string | null;
  approved_at: string;
  updated_at: string;
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
