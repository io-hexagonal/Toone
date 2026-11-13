import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isReleaseBuildEnv, webSalesLegallyReady } from "../../lib/legal/release";
import { checkoutLive, releaseCheck } from "../../scripts/legal/release-gate";

const MISSING = ["Name", "Geographic address"];

test("a release build is a Vercel production build or LEGAL_RELEASE_CHECK=1", () => {
  assert.equal(isReleaseBuildEnv({ VERCEL_ENV: "production" }), true);
  assert.equal(isReleaseBuildEnv({ LEGAL_RELEASE_CHECK: "1" }), true);
  assert.equal(isReleaseBuildEnv({ VERCEL_ENV: "preview" }), false);
  assert.equal(isReleaseBuildEnv({}), false);
  const config = fs.readFileSync("next.config.ts", "utf8");
  assert.match(config, /TOONE_RELEASE_BUILD: process\.env\.VERCEL_ENV === "production" \|\| process\.env\.LEGAL_RELEASE_CHECK === "1" \? "1" : "0"/);
});

test("a release build with missing trader details never offers web checkout", () => {
  assert.equal(webSalesLegallyReady(false, true), false);
  assert.equal(webSalesLegallyReady(true, true), true);
  assert.equal(webSalesLegallyReady(false, false), true, "local, preview and test builds can try checkout");
  for (const [file, pattern] of [
    ["components/billing/PricingPlans.helpers.ts", /legallyReady: boolean = WEB_SALES_LEGALLY_READY[^]*flag && legallyReady &&/],
    ["components/billing/PricingLink.tsx", /flags\.stripe_pro_checkout && WEB_SALES_LEGALLY_READY/],
    ["components/account/AccountPage.tsx", /features\?\.stripe_pro_checkout && WEB_SALES_LEGALLY_READY/],
  ] as const) {
    assert.match(fs.readFileSync(file, "utf8"), pattern, file);
  }
});

test("the production build fails while web checkout is on and the trader details are missing", async () => {
  const on = async () => true;
  const off = async () => false;
  const down = async () => null;
  assert.deepEqual(await releaseCheck({}, MISSING, on), { ok: true, message: null }, "not a release build");
  assert.deepEqual(await releaseCheck({ VERCEL_ENV: "production" }, [], on), { ok: true, message: null }, "details complete");
  const failed = await releaseCheck({ VERCEL_ENV: "production" }, MISSING, on);
  assert.equal(failed.ok, false);
  assert.match(failed.message ?? "", /web checkout is on.*Name, Geographic address/);
  for (const live of [off, down]) {
    const passed = await releaseCheck({ LEGAL_RELEASE_CHECK: "1" }, MISSING, live);
    assert.equal(passed.ok, true);
    assert.match(passed.message ?? "", /hides web checkout/);
  }
  let asked = "";
  await releaseCheck({ VERCEL_ENV: "production", NEXT_PUBLIC_API_BASE_URL: "http://api.test/v1" }, MISSING, async (base) => {
    asked = base;
    return false;
  });
  assert.equal(asked, "http://api.test/v1");
});

test("the build reads checkout from the public capabilities; any failure counts as unknown", async () => {
  const answer = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  assert.equal(await checkoutLive("http://x", answer(200, { features: { stripe_pro_checkout: true } })), true);
  assert.equal(await checkoutLive("http://x", answer(200, { features: { stripe_pro_checkout: "yes" } })), false);
  assert.equal(await checkoutLive("http://x", answer(503, {})), null);
  assert.equal(await checkoutLive("http://x", (async () => { throw new Error("offline"); }) as unknown as typeof fetch), null);
});

test("prebuild runs the release gate before every build", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(pkg.scripts.prebuild, /npm run legal:release-check/);
  assert.equal(pkg.scripts["legal:release-check"], "node --import tsx scripts/legal/release-check.ts");
});
