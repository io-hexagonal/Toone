import assert from "node:assert/strict";
import { test } from "node:test";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../../next.config";

/** The first `redirects()` rule that matches, as Next resolves it: the first match wins. */
async function firstRedirect(pathname: string, host = "trytoone.com") {
  const rules = (await nextConfig.redirects?.()) ?? [];
  for (const rule of rules) {
    const hostRule = rule.has?.find((condition) => condition.type === "host");
    if (hostRule && hostRule.value !== host) continue;
    const match = getPathMatch(rule.source, { strict: true, removeUnnamedParams: true })(pathname);
    if (match) return { destination: rule.destination, permanent: rule.permanent };
  }
  return undefined;
}

const OWNER = "/en/how-to/features/workspace-windows";
const FOLDED = ["zen-mode", "project-switcher", "project-explorer"];

test("folded workspace pages are one 308 to the workspace page from every locale and the bare path", async () => {
  for (const slug of FOLDED) {
    for (const prefix of ["/en", "/pt", "/es", "/fr", "/de", "/it", "/nl", "/ru", ""]) {
      assert.deepEqual(await firstRedirect(`${prefix}/how-to/features/${slug}`), { destination: OWNER, permanent: true });
      assert.deepEqual(await firstRedirect(`${prefix}/how-to/features/${slug}`, "www.trytoone.com"), {
        destination: `https://trytoone.com${OWNER}`,
        permanent: true,
      });
    }
  }
});

test("the workspace page and its neighbours are not redirected", async () => {
  assert.equal(await firstRedirect(OWNER), undefined);
  assert.equal(await firstRedirect("/en/how-to/features/zen-mode-extra"), undefined);
  assert.equal(await firstRedirect("/en/how-to/features/browser-sessions"), undefined);
});
