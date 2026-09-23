import assert from "node:assert/strict";
import { test } from "node:test";
import { featuredItems, type CatalogItem } from "../../lib/explore/presentation";

function item(id: string, approvedAt: string, cover: boolean): CatalogItem {
  return {
    type: "routine",
    entry: { workflow_id: id, approved_at: approvedAt, cover_url: cover ? "x" : null } as never,
  };
}

test("featured: only items with a cover, newest approval first, at most the limit", () => {
  const items = [
    item("wfl_old", "2026-09-01T00:00:00Z", true),
    item("wfl_nocover", "2026-09-30T00:00:00Z", false),
    item("wfl_new", "2026-09-20T00:00:00Z", true),
    item("wfl_mid", "2026-09-10T00:00:00Z", true),
  ];
  const hasCover = (entry: CatalogItem) => !!(entry.entry as { cover_url?: string | null }).cover_url;
  const ids = (list: CatalogItem[]) => list.map((entry) => ("workflow_id" in entry.entry ? entry.entry.workflow_id : ""));
  assert.deepEqual(ids(featuredItems(items, hasCover)), ["wfl_new", "wfl_mid", "wfl_old"]);
  assert.deepEqual(ids(featuredItems(items, hasCover, 2)), ["wfl_new", "wfl_mid"]);
  assert.deepEqual(featuredItems([], hasCover), []);
});
