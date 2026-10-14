import assert from "node:assert/strict";
import { test } from "node:test";
import { featuredCover, featuredItems, type CatalogItem } from "../../lib/explore/presentation";

function item(id: string, approvedAt: string, cover: boolean): CatalogItem {
  return {
    type: "routine",
    entry: { workflow_id: id, approved_at: approvedAt, cover_url: cover ? "x" : null } as never,
  };
}

function bundleItem(id: string, approvedAt: string, cover: boolean): CatalogItem {
  return {
    type: "bundle",
    entry: { bundle_id: id, approved_at: approvedAt, cover_url: cover ? "x" : null, members: [] } as never,
  };
}

const hasCover = (entry: CatalogItem) => !!(entry.entry as { cover_url?: string | null }).cover_url;
const ids = (list: CatalogItem[]) =>
  list.map((entry) => ("bundle_id" in entry.entry ? entry.entry.bundle_id : entry.entry.workflow_id));

test("featured: only bundles with a cover, newest approval first, at most the limit", () => {
  const items = [
    bundleItem("wfb_old", "2026-09-01T00:00:00Z", true),
    bundleItem("wfb_nocover", "2026-09-30T00:00:00Z", false),
    bundleItem("wfb_new", "2026-09-20T00:00:00Z", true),
    bundleItem("wfb_mid", "2026-09-10T00:00:00Z", true),
  ];
  assert.deepEqual(ids(featuredItems(items, hasCover)), ["wfb_new", "wfb_mid", "wfb_old"]);
  assert.deepEqual(ids(featuredItems(items, hasCover, 2)), ["wfb_new", "wfb_mid"]);
  assert.deepEqual(featuredItems([], hasCover), []);
});

test("featured: routines never appear, even newer ones with a cover", () => {
  const items = [
    item("wfl_newest", "2026-10-10T00:00:00Z", true),
    bundleItem("wfb_a", "2026-09-01T00:00:00Z", true),
    item("wfl_other", "2026-09-20T00:00:00Z", true),
  ];
  assert.deepEqual(ids(featuredItems(items, hasCover)), ["wfb_a"]);
  assert.deepEqual(featuredItems([item("wfl_only", "2026-10-01T00:00:00Z", true)], hasCover), [], "no bundles: no carousel");
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
