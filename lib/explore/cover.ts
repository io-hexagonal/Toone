/**
 * Cover paths are relative to the versioned API base (contract §3). An admin
 * cover override is served at the same path with `?v=<presentation_id>` so the
 * immutable per-revision cache never serves the replaced image. Anything else
 * (absolute URLs, traversal, other files) resolves to null.
 * Pure: shared by the server fetchers and the client admin editor.
 */
export const COVER_PATH =
  /^(workflows|bundles)\/[a-z0-9_]+\/revisions\/[a-z0-9_]+\/cover\.jpg(?:\?v=[A-Za-z0-9_-]{1,64})?$/;

export function resolveCoverPath(base: string, coverUrl: string | null | undefined): string | null {
  if (!coverUrl || !COVER_PATH.test(coverUrl)) return null;
  return `${base.replace(/\/+$/, "")}/${coverUrl}`;
}
