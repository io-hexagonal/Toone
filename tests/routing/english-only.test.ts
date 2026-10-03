import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { ENGLISH_ONLY_PATHS } from "../../i18n/routing";
import { redirectToEnglish } from "../../lib/english-only";

/** `permanentRedirect` throws; its digest carries the target and status. */
async function redirectTarget(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    const [, , url, status] = String((error as { digest?: string }).digest).split(";");
    return { url, status };
  }
  assert.fail("expected a redirect");
}

test("the page-level fallback to English keeps the query string", async () => {
  assert.deepEqual(
    await redirectTarget(redirectToEnglish("/en/privacy", Promise.resolve({ utm_source: "x", tag: ["a", "b"] }))),
    { url: "/en/privacy?utm_source=x&tag=a&tag=b", status: "308" },
  );
  assert.deepEqual(
    await redirectTarget(redirectToEnglish("/en/terms", Promise.resolve({}))),
    { url: "/en/terms", status: "308" },
  );
});

test("every page that sends other locales to English is listed, so proxy.ts redirects it in one hop", () => {
  const listed: readonly string[] = ENGLISH_ONLY_PATHS;
  let found = 0;
  for (const dir of fs.readdirSync("app/[locale]")) {
    const page = `app/[locale]/${dir}/page.tsx`;
    if (!fs.existsSync(page)) continue;
    const source = fs.readFileSync(page, "utf8");
    if (!source.includes(`redirectToEnglish("/en/${dir}"`) && !source.includes(`permanentRedirect("/en/${dir}")`)) continue;
    found += 1;
    assert.ok(listed.includes(`/${dir}`), `/${dir} is English only but missing from ENGLISH_ONLY_PATHS`);
  }
  assert.ok(found >= 7, `found ${found} English-only pages`);
});
