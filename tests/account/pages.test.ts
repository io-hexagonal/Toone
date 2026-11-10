import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { signInReturnPath } from "../../components/AuthPage";

/* Indexing, referrer and routing rules of the account, redeem, contract and admin code pages. */

const read = (path: string) => fs.readFileSync(path, "utf8");
const PAGES = {
  account: "app/[locale]/account/page.tsx",
  redeem: "app/[locale]/redeem/page.tsx",
  "cancel-contract": "app/[locale]/cancel-contract/page.tsx",
  "admin/codes": "app/[locale]/admin/codes/page.tsx",
  "admin/invitations": "app/[locale]/admin/invitations/page.tsx",
};

test("every new page is noindex, nofollow and sends no referrer", () => {
  for (const [route, path] of Object.entries(PAGES)) {
    const page = read(path);
    assert.match(page, /robots: \{ index: false, follow: false \}/, route);
    assert.match(page, /referrer: "no-referrer"/, route);
    assert.doesNotMatch(page, /localeRobots/, `${route} never becomes indexable`);
  }
  for (const route of ["account", "redeem", "cancel-contract"]) {
    assert.match(read(PAGES[route as keyof typeof PAGES]), new RegExp(`canonical: \`https://trytoone\\.com/\\$\\{locale\\}/${route}\``), route);
  }
});

test("none of the new pages is in a sitemap", () => {
  const sitemap = read("app/sitemap.xml/route.ts");
  for (const route of ["/account", "/redeem", "/cancel-contract", "/admin"]) assert.ok(!sitemap.includes(`"${route}"`), route);
});

test("/admin/invitations now redirects to /admin/codes", () => {
  assert.match(read(PAGES["admin/invitations"]), /redirect\(\{ href: "\/admin\/codes", locale \}\)/);
  assert.ok(!fs.existsSync("components/InvitationAdminPage.tsx"));
  assert.match(read("components/InvitationAdminLink.tsx"), /href="\/admin\/codes"/);
  assert.match(read("components/InvitationAdminLink.tsx"), /useCapability\("invitation\.manage", token\)/);
});

test("/redeem reads the code from location.hash only and cleans the address", () => {
  const page = read("components/account/RedeemPage.tsx");
  assert.match(page, /codeFromFragment\(window\.location\.hash\)/);
  assert.match(page, /window\.history\.replaceState\(/);
  assert.doesNotMatch(page, /searchParams\.get\("code"\)|useSearchParams/);
  assert.doesNotMatch(read("components/account/RedeemForm.tsx"), /location|searchParams/);
});

test("signed-in links: Account in the header and the sign-in success panel", () => {
  assert.match(read("components/SiteHeader.tsx"), /<SignedInLink href="\/account"/);
  assert.match(read("components/AuthPage.tsx"), /<Link className="auth-signout" href="\/account">/);
});

test("after sign-in, /account and /redeem are return targets; nothing else new is", () => {
  assert.equal(signInReturnPath("?next=%2Faccount"), "/account");
  assert.equal(signInReturnPath("?next=%2Faccount%2F"), "/account/");
  assert.equal(signInReturnPath("?next=%2Fredeem"), "/redeem");
  assert.equal(signInReturnPath("?next=%2Fhow-to"), "/how-to");
  for (const search of [
    "?next=%2Faccount%3Fx%3D1", "?next=%2Faccount%23code%3DPRO30", "?next=%2Fredeem%23code%3DPRO30", "?next=%2Fredeem%3Fcode%3DPRO30",
    "?next=%2Faccountx", "?next=%2Faccount%2Fbilling", "?next=%2F%2Faccount", "?next=%2F%5Caccount", "?next=https%3A%2F%2Fevil.example%2Faccount",
    "?next=%2Fadmin%2Fcodes", "?next=%2Fredeem%2F..%2Fadmin", "?next=%2FAccount", "?next=%20%2Faccount", "?next=%2Faccount%0A",
  ]) {
    assert.equal(signInReturnPath(search), null, search);
  }
});
