import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { PRIVACY_UPDATED_DATE } from "../../lib/legal/privacy";

const read = (path: string) => fs.readFileSync(path, "utf8");
const page = read("app/[locale]/privacy/page.tsx");
const normalized = page.replace(/&apos;/g, "'").replace(/\s+/g, " ").toLowerCase();

test("privacy page is public, dated, and linked for App Store review", () => {
  assert.ok(fs.existsSync("docs/legal/privacy-release-review.md"));
  assert.ok(PRIVACY_UPDATED_DATE.length > 0);
  assert.match(page, /robots: \{ index: locale === "en", follow: true \}/);
  assert.match(page, /Updated: \{PRIVACY_UPDATED_DATE\}/);
  assert.doesNotMatch(page, /DRAFT — NOT FINAL|noindex/);
});

test("public privacy is reachable from the footer, About page, and sitemap", () => {
  const sitemap = read("app/sitemap.xml/route.ts");
  const footer = read("components/Footer.tsx");
  const about = read("app/[locale]/about/page.tsx");
  assert.match(sitemap, /\{ path: "\/privacy", source: "app\/\[locale\]\/privacy\/page\.tsx" \}/);
  assert.match(footer, /<Link href="\/privacy">/);
  assert.match(about, /<a href="\/en\/privacy">/);
});

test("policy distinguishes the Store app, relay, AI provider and website storage", () => {
  for (const disclosure of [
    "mac app store edition does not offer this feature",
    "toone (mac app store)</strong> does not include this analytics",
    "relay room stores the mac and iphone device identifiers",
    "email address of each person you invite",
    "codex may receive your prompts, files and tool output",
    "apple may process that audio on its servers",
    "apple private relay address",
    "browser's localstorage",
    "analytics.truleaf.org",
    "toone's server receives your codex requests and responses",
    "in-app deletion service is available",
  ]) {
    assert.ok(normalized.includes(disclosure), `missing disclosure: ${disclosure}`);
  }
});

test("policy matches the site's consent control and avoids stale local-only claims", () => {
  for (const stale of [
    "all conversations, files, and project data remain on your device",
    "the toone desktop app sends anonymous usage telemetry",
    "authentication is handled through your terminal",
  ]) {
    assert.ok(!normalized.includes(stale), `stale claim: ${stale}`);
  }
  assert.match(page, /<PrivacyChoicesButton \/>/);
  const choices = read("components/PrivacyChoices.tsx");
  assert.match(choices, /if \(choice !== "allow" \|\| document\.getElementById\(SCRIPT_ID\)\) return/);
  assert.match(choices, /script\.src = "https:\/\/analytics\.truleaf\.org\/script\.js"/);
  const storage = read("lib/privacy-choices.ts");
  assert.match(storage, /180 \* 24 \* 60 \* 60 \* 1000/);
  const api = read("lib/api.ts");
  assert.match(api, /localStorage\.setItem\(SESSION_KEY, JSON\.stringify\(session\)\)/);
  assert.match(api, /const SESSION_KEY = "toone\.session"/);
});

test("Apple web disclosure follows the actual token handoff", () => {
  assert.match(normalized, /website forwards the identity token and any provided name/);
  assert.match(normalized, /does not send apple's authorization code/);
  const api = read("lib/api.ts");
  assert.match(api, /jsonPost\(body\)/);
  assert.doesNotMatch(api.slice(api.indexOf("export async function loginApple"), api.indexOf("export async function getMe")), /authorization_code|body\.code\s*=\s*response\.authorization/);
});
