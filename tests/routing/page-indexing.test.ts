import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import LandingAudienceBar from "../../components/LandingAudienceBar";
import { BUSINESS_LANDING_INDEXED, GOVERNANCE_PAGE_INDEXED, isUnindexedPage, linksBusinessLanding } from "../../lib/page-indexing";

/*
 * TECH-025 / indexing plan A7: an indexable page has no <a href> to a
 * `noindex` URL. /en/business is `noindex` (A3), so English pages drop the
 * Personal / Business switch; one flag reopens page, sitemap entry and links.
 */

const messages = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const de = JSON.parse(fs.readFileSync("messages/de.json", "utf8"));

function bar(locale: string, msgs: object) {
  return renderToStaticMarkup(createElement(NextIntlClientProvider, {
    locale,
    messages: msgs,
    timeZone: "UTC",
    children: createElement(LandingAudienceBar, { activeAudience: "personal" }),
  }));
}

test("while /en/business is noindex, English pages do not link it", () => {
  assert.equal(BUSINESS_LANDING_INDEXED, false);
  assert.equal(linksBusinessLanding("en"), false);
  assert.equal(linksBusinessLanding("en", "personal"), false);
  assert.equal(linksBusinessLanding("en", "any"), false);
  // /en/business itself (noindex) keeps the switch so a visitor can get back.
  assert.equal(linksBusinessLanding("en", "business"), true);
  // Other locales are noindex themselves (TECH-021): the switch stays.
  assert.equal(linksBusinessLanding("de", "personal"), true);

  const english = bar("en", messages);
  assert.doesNotMatch(english, /href="[^"]*\/business"/);
  assert.match(english, /aria-selected="true"/, "the current audience still shows");
  assert.match(bar("de", de), /href="\/de\/business"/);
});

test("the business page's robots, its sitemap entry and the landing links read the same flag", () => {
  const page = fs.readFileSync("app/[locale]/business/page.tsx", "utf8");
  assert.match(page, /robots: localeRobots\(locale, BUSINESS_LANDING_INDEXED\)/);
  assert.match(fs.readFileSync("app/sitemap.xml/route.ts", "utf8"), /BUSINESS_LANDING_INDEXED \? \[\{ path: "\/business"/);
  for (const file of ["components/SiteHeader.tsx", "components/HeroLanding.tsx", "components/LandingAudienceBar.tsx"]) {
    assert.match(fs.readFileSync(file, "utf8"), /linksBusinessLanding\(/, file);
  }
});

test("while /en/governance is noindex, the footer does not link it; page, sitemap and footer read one flag", () => {
  assert.equal(GOVERNANCE_PAGE_INDEXED, false);
  const page = fs.readFileSync("app/[locale]/governance/page.tsx", "utf8");
  assert.match(page, /robots: localeRobots\(locale, GOVERNANCE_PAGE_INDEXED\)/);
  assert.match(fs.readFileSync("app/sitemap.xml/route.ts", "utf8"), /GOVERNANCE_PAGE_INDEXED \? getPublication\("ai-agent-governance", "en"\)/);
  const footer = fs.readFileSync("components/Footer.tsx", "utf8");
  assert.match(footer, /\{GOVERNANCE_PAGE_INDEXED && <a href="\/en\/governance">/);
  assert.equal(footer.match(/\/governance/g)?.length, 1, "no other governance link in the footer");
});

test("article Markdown and the resources list drop links to pages kept out of the index", () => {
  assert.equal(isUnindexedPage("/en/governance"), true);
  assert.equal(isUnindexedPage("/en/governance#approvals"), true);
  assert.equal(isUnindexedPage("/en/business/"), true);
  assert.equal(isUnindexedPage("/en/ai-agent-routines"), false);
  assert.equal(isUnindexedPage("/en/guides/ai-agent-governance"), false);
  assert.match(fs.readFileSync("components/ArticlePage.tsx", "utf8"), /if \(isUnindexedPage\(target\)\) return <>\{children\}<\/>;/);
  assert.match(fs.readFileSync("app/[locale]/resources/page.tsx", "utf8"), /\.filter\(\s*\(publication\) => !isUnindexedPage\(`\/en\$\{publication\.canonicalPath\}`\)/);
});
