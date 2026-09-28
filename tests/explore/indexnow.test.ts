import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { resetExploreMemo } from "../../lib/explore/data";
import {
  INDEXNOW_KEY,
  indexNowOnApprovalEnabled,
  indexNowUrlFor,
  submitToIndexNow,
} from "../../lib/explore/indexnow";
import type { RevalidateEvent } from "../../lib/explore/types";

beforeEach(() => resetExploreMemo());

const detail = JSON.parse(
  readFileSync(new URL("./fixtures/routine-detail.json", import.meta.url), "utf8"),
);
const event = (overrides: Partial<RevalidateEvent> = {}): RevalidateEvent => ({
  event: "approved",
  type: "routine",
  id: detail.workflow_id,
  slug: detail.slug,
  occurred_at: "2026-09-28T12:00:00Z",
  ...overrides,
});
const serve = (indexable: boolean) => async () =>
  new Response(JSON.stringify({ data: { ...detail, indexable } }));

test("IndexNow on approval stays off until the owner turns it on", () => {
  delete process.env.EXPLORE_INDEXNOW_ON_APPROVAL;
  assert.equal(indexNowOnApprovalEnabled(), false);
  process.env.EXPLORE_INDEXNOW_ON_APPROVAL = "true";
  assert.equal(indexNowOnApprovalEnabled(), true);
  delete process.env.EXPLORE_INDEXNOW_ON_APPROVAL;
});

test("an approved indexable record submits its English URL; noindex and removals do not", async (t) => {
  process.env.EXPLORE_API_BASE_URL = "https://example.test/v1";
  t.mock.method(globalThis, "fetch", serve(true));
  assert.equal(
    await indexNowUrlFor(event()),
    `https://trytoone.com/en/explore/routines/${detail.slug}`,
  );
  assert.equal(await indexNowUrlFor(event({ event: "removed" })), null);
  t.mock.restoreAll();
  resetExploreMemo();
  t.mock.method(globalThis, "fetch", serve(false));
  assert.equal(await indexNowUrlFor(event({ event: "listing_changed", slug: "other-slug" })), null);
});

test("the IndexNow payload names the host, key and key file", async (t) => {
  let sent: { url: string; body: Record<string, unknown> } | undefined;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    sent = { url, body: JSON.parse(String(init.body)) };
    return new Response(null, { status: 202 });
  });
  const status = await submitToIndexNow(["https://trytoone.com/en/explore/routines/x"]);
  assert.equal(status, 202);
  assert.equal(sent?.url, "https://api.indexnow.org/indexnow");
  assert.deepEqual(sent?.body, {
    host: "trytoone.com",
    key: INDEXNOW_KEY,
    keyLocation: `https://trytoone.com/${INDEXNOW_KEY}.txt`,
    urlList: ["https://trytoone.com/en/explore/routines/x"],
  });
  assert.equal(
    readFileSync(new URL(`../../public/${INDEXNOW_KEY}.txt`, import.meta.url), "utf8").trim(),
    INDEXNOW_KEY,
  );
});
