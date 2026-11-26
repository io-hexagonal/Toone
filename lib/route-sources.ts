/**
 * The files whose last change dates each static sitemap route (TECH-013).
 *
 * A page's visible content often lives outside its page.tsx: the homepage is
 * TooneLandingPage plus the landing sections it renders, the pricing page is
 * mostly PricingPlans. A route's `lastmod` is the latest manifest date among
 * its sources (lib/content-dates.json, app/sitemap.xml/route.ts), and every
 * file listed here is a dated source (lib/source-date.ts), so the manifest
 * covers it.
 *
 * Listed: the page, the components that render its main content, and the data
 * files that content is written in. Not listed: site chrome (SiteHeader,
 * Navigation, Footer, LocalePicker, LocaleSuggestion, cookie and privacy-choice
 * UI), shared page frames (TrustPage), styles, and the Black Friday strip above
 * the landing header: a change there is not a change to the page's content.
 * Also not listed: messages/*.json, one file shared by every page (see the
 * known limit in app/sitemap.xml/route.ts).
 *
 * Keys are the route path after the locale; `[slug]` stands for every idea.
 * `/business`, `/contact` and `/request-access` are `noindex` and out of the
 * sitemap since 2026-11-26 (indexing plan A3, A4); their entries stay so that
 * reopening one is a sitemap entry, not a new source list.
 */

const LANDING = [
  "app/[locale]/page.tsx",
  "components/HeroLanding.tsx",
  "components/HowItWorksSection.tsx",
  "components/HowItWorksGraph.tsx",
  "components/BuiltDifferentlySection.tsx",
  "components/OutcomesSection.tsx",
  "components/ResourcesSection.tsx",
  "components/ClosingCtaBand.tsx",
  "components/FaqSection.tsx",
] as const;

export const ROUTE_SOURCES = {
  "": LANDING,
  "/resources": ["app/[locale]/resources/page.tsx"],
  // The same landing, opened on the business audience.
  "/business": ["app/[locale]/business/page.tsx", ...LANDING],
  "/pricing": [
    "app/[locale]/pricing/page.tsx",
    "components/billing/PricingPlans.tsx",
    // The routine idea cards under the plans.
    "components/affiliates/CreatorIdeas.tsx",
    "lib/creator-ideas.ts",
  ],
  "/privacy": ["app/[locale]/privacy/page.tsx", "app/[locale]/privacy/PrivacyContent.tsx"],
  "/terms": [
    "app/[locale]/terms/page.tsx",
    "app/[locale]/terms/TermsDocument.tsx",
    "app/[locale]/terms/TermsContent.tsx",
  ],
  "/legal-notice": [
    "app/[locale]/legal-notice/page.tsx",
    "app/[locale]/legal-notice/WebSales.tsx",
    "lib/legal/trader.ts",
  ],
  "/about": ["app/[locale]/about/page.tsx", "components/FeaturedOnStrip.tsx"],
  "/contact": ["app/[locale]/contact/page.tsx"],
  "/compare": ["app/[locale]/compare/page.tsx"],
  "/claude": ["app/[locale]/claude/page.tsx"],
  "/editorial-policy": ["app/[locale]/editorial-policy/page.tsx"],
  "/request-access": ["app/[locale]/request-access/page.tsx", "components/WaitlistPage.tsx"],
  // The page frame only. What /en/explore shows is the live catalog; each
  // record's own date is its lastmod in /sitemap-explore.xml.
  "/explore": ["app/[locale]/explore/page.tsx"],
  "/newcomers/ideas": [
    "app/[locale]/newcomers/ideas/page.tsx",
    "components/newcomers/NewcomerIdeaPage.tsx",
    "components/affiliates/CreatorIdeas.tsx",
    "lib/creator-ideas.ts",
    "lib/newcomer-ideas-seo.ts",
  ],
  "/newcomers/ideas/[slug]": [
    "app/[locale]/newcomers/ideas/[slug]/page.tsx",
    "components/newcomers/NewcomerIdeaPage.tsx",
    "lib/creator-ideas.ts",
    "lib/newcomer-ideas-seo.ts",
  ],
} as const satisfies Record<string, readonly string[]>;

export type SourcedRoute = keyof typeof ROUTE_SOURCES;

/** Every file a route above names, page files included, sorted and unique. */
export const ROUTE_SOURCE_FILES: readonly string[] = [...new Set(Object.values(ROUTE_SOURCES).flat())].sort();
