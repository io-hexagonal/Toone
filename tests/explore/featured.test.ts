import assert from "node:assert/strict";
import { test } from "node:test";
import { featuredCover, featuredItems, type CatalogItem } from "../../lib/explore/presentation";

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

test("featured: a bundle shows its first routine's image, not its titled cover", () => {
  const resolve = (entry: { cover_url?: string | null }) => entry.cover_url ?? null;
  const bundle = (members: { position: number; cover_url: string | null }[]): CatalogItem => ({
    type: "bundle",
    entry: { bundle_id: "wfb_a", cover_url: "bundle.jpg", members } as never,
  });
  assert.equal(featuredCover(bundle([{ position: 1, cover_url: "second.jpg" }, { position: 0, cover_url: "first.jpg" }]), resolve), "first.jpg");
  assert.equal(featuredCover(bundle([{ position: 0, cover_url: null }, { position: 1, cover_url: "second.jpg" }]), resolve), "second.jpg");
  assert.equal(featuredCover(bundle([]), resolve), "bundle.jpg", "no routine image: the bundle's own");
  assert.equal(featuredCover(item("wfl_r", "2026-10-01T00:00:00Z", true), resolve), "x", "a routine keeps its own");
});
