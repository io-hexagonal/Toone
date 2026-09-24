import assert from "node:assert/strict";
import test from "node:test";
import { metaDescription, recordSchemaFields, SITE } from "../../lib/explore/presentation";

const purpose =
  "Research selected launch websites, prepare authorized accounts and product profiles, and create a site-specific launch strategy and unpublished draft. Account creation is optional and explicitly scoped by run setup. Never publish, schedule or submit a launch.";

test("meta description keeps whole sentences within 160 characters", () => {
  const out = metaDescription(purpose);
  assert.ok(out.length <= 160, out);
  assert.ok(out.endsWith("."));
  assert.equal(metaDescription("Short summary."), "Short summary.");
});

test("meta description cuts a single long sentence at a word boundary", () => {
  const out = metaDescription("word ".repeat(60));
  assert.ok(out.length <= 160);
  assert.ok(out.endsWith("…"));
  assert.ok(!out.includes("  "));
});

test("record schema names author, date and publisher", () => {
  const fields = recordSchemaFields({ author_name: "Ada", approved_at: "2026-09-21T00:00:00Z" });
  assert.deepEqual(fields.author, { "@type": "Person", name: "Ada" });
  assert.equal(fields.dateModified, "2026-09-21T00:00:00Z");
  assert.deepEqual(fields.publisher, { "@id": `${SITE}/#organization` });
  assert.equal("author" in recordSchemaFields({ author_name: "", approved_at: "x" }), false);
});

test("Toone-published records credit the organization, not a person", () => {
  const fields = recordSchemaFields({ author_name: "Toone", author_official: true, approved_at: "x" });
  assert.deepEqual(fields.author, { "@id": `${SITE}/#organization` });
});

import { accessAttribution, requestAccessHref } from "../../lib/explore/presentation";

test("access attribution keeps only Explore and a valid record id", () => {
  assert.deepEqual(accessAttribution("explore", "routine:wfl_3ebf5rtmxzmzpbkf"), { from: "explore", item: "routine:wfl_3ebf5rtmxzmzpbkf" });
  assert.deepEqual(accessAttribution("explore", "routine:<script>"), { from: "explore" });
  assert.deepEqual(accessAttribution("ads", "routine:wfl_3ebf5rtmxzmzpbkf"), {});
  assert.deepEqual(accessAttribution(["explore"], undefined), {});
  assert.equal(requestAccessHref("en", "bundle:wfb_ux67rregtrwv3k5g"), "/en/request-access?from=explore&item=bundle%3Awfb_ux67rregtrwv3k5g");
});
