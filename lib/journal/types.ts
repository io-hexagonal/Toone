/**
 * Journal wire types — derived from the frozen contract in
 * docs/architecture/journal/contract.md (§5, §7, §9) in the product repo.
 *
 * Field names mirror the JSON exactly (snake_case) so a fixture can be
 * assigned to these types without mapping. Everything the API sends passes
 * through the allow-list normalizers in `./data` before a page sees it.
 */

export type JournalPostType = "release" | "spotlight" | "launch";
export type JournalAssistance = "none" | "assisted" | "drafted";
export type JournalReleaseChannel = "direct" | "appstore";
export type JournalState = "draft" | "published" | "retired";

export type JournalAuthor = {
  name: string;
  type: "Organization" | "Person";
  /** Site-relative (`/en/editorial-policy`) or absolute https URL; optional. */
  url: string | null;
};

export type JournalRelease = {
  version: string;
  channels: JournalReleaseChannel[];
};

export type JournalCover = {
  /** Path relative to the versioned API base (`journal/assets/jna_…`). */
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type JournalExploreRef = {
  type: "routine" | "bundle";
  slug: string;
  id: string;
};

/** `GET /v1/journal/posts` items (§7 PostEntry). */
export type JournalPostEntry = {
  post_id: string;
  slug: string;
  type: JournalPostType;
  title: string;
  heading: string;
  description: string;
  author: JournalAuthor;
  assistance: JournalAssistance;
  release: JournalRelease | null;
  cover: JournalCover | null;
  explore_refs: JournalExploreRef[];
  read_minutes: number;
  /** first_published_at — schema.org datePublished; never changes. */
  published_at: string;
  /** When the live revision went live — schema.org dateModified. */
  updated_at: string;
};

export type JournalAsset = {
  url: string;
  width: number;
  height: number;
  content_type: string;
};

/** `GET /v1/journal/posts/{id-or-slug}` (§7 PostDetail). */
export type JournalPostDetail = JournalPostEntry & {
  revision_id: string;
  content_hash: string;
  body: string;
  keywords: { primary: string; secondary: string[] };
  assets: Record<string, JournalAsset>;
};

/** `GET /v1/journal/previews/{token}`: a detail plus the post's state. */
export type JournalPreview = JournalPostDetail & {
  preview: true;
  state: JournalState;
};

/** `GET /v1/journal/feed` items (§7.1). */
export type JournalFeedItem = {
  post_id: string;
  slug: string;
  type: JournalPostType;
  state: JournalState;
  published_at: string;
  updated_at: string;
  retired_at: string | null;
};

/**
 * Outcome of a post lookup. `gone` is the §7.2 410: the site 308s to
 * `redirectSlug` when the retirement named one, and otherwise renders a
 * `noindex` not-found.
 */
export type JournalPostLookup =
  | { kind: "post"; post: JournalPostDetail }
  | { kind: "gone"; redirectSlug: string | null }
  | { kind: "missing" };

export type JournalListResult = { items: JournalPostEntry[]; total: number };

/** §9 webhook body for Journal events. */
export type JournalRevalidateEvent = {
  event: "published" | "updated" | "retired";
  type: "journal";
  id: string;
  slug: string;
  occurred_at: string;
};
