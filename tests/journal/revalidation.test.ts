import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { isJournalPayload, parseJournalEvent } from "../../lib/journal/revalidation";
import { journalIndexNowEnabled, journalIndexNowUrls } from "../../lib/journal/indexnow";
import { parseRevalidateEvent, verifySignature } from "../../lib/explore/revalidation";

const event = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    event: "published",
    type: "journal",
    id: "jnp_rel0001abcd1234",
    slug: "toone-1-0-79-release-notes",
    occurred_at: "2026-10-01T09:00:00Z",
    ...overrides,
  });

test("journal events: the three events with a jnp_ id and a slug are accepted (§9)", () => {
  for (const name of ["published", "updated", "retired"]) {
    assert.deepEqual(parseJournalEvent(event({ event: name })), {
      event: name,
      type: "journal",
      id: "jnp_rel0001abcd1234",
      slug: "toone-1-0-79-release-notes",
      occurred_at: "2026-10-01T09:00:00Z",
    });
  }
  assert.equal(isJournalPayload(event()), true);
});

test("malformed journal events are rejected", () => {
  for (const overrides of [
    { event: "approved" },
    { event: "deleted" },
    { id: "wfl_abcdefgh12" },
    { id: "jnp_SHORT" },
    { slug: "Bad Slug" },
    { slug: "ab" },
    { occurred_at: "yesterday" },
    { extra: undefined, slug: 42 },
  ]) {
    assert.equal(parseJournalEvent(event(overrides)), null, JSON.stringify(overrides));
  }
  assert.equal(parseJournalEvent("not json"), null);
  assert.equal(isJournalPayload("not json"), false);
});

test("Explore parsing is unchanged: it still rejects journal bodies and accepts its own", () => {
  assert.equal(parseRevalidateEvent(event()), null);
  const explore = JSON.stringify({
    event: "approved",
    type: "routine",
    id: "wfl_3ebf5rtmxzmzpbkf",
    slug: "launch-surface-preparation-xzmzpbkf",
    occurred_at: "2026-10-01T09:00:00Z",
  });
  assert.equal(parseRevalidateEvent(explore)?.type, "routine");
  assert.equal(isJournalPayload(explore), false);
  const signature = "sha256=" + createHmac("sha256", "s3cret").update(event()).digest("hex");
  assert.equal(verifySignature(event(), signature, "s3cret"), true, "same signature scheme for both");
});

test("IndexNow: on unless JOURNAL_INDEXNOW=false; post URL plus the index", () => {
  delete process.env.JOURNAL_INDEXNOW;
  assert.equal(journalIndexNowEnabled(), true);
  process.env.JOURNAL_INDEXNOW = "false";
  assert.equal(journalIndexNowEnabled(), false);
  process.env.JOURNAL_INDEXNOW = "true";
  assert.equal(journalIndexNowEnabled(), true);
  delete process.env.JOURNAL_INDEXNOW;
  assert.deepEqual(journalIndexNowUrls({ slug: "toone-pro-is-here" }), [
    "https://trytoone.com/en/journal/toone-pro-is-here",
    "https://trytoone.com/en/journal",
  ]);
});
