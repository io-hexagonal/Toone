import fs from "node:fs";
const manifest = JSON.parse(fs.readFileSync("content/publication-manifest.json", "utf8"));
const prerender = JSON.parse(fs.readFileSync(".next/prerender-manifest.json", "utf8"));
const routes = Object.keys(prerender.routes);
const expected = manifest.items.flatMap(item => item.locales.map(locale => `/${locale}${item.canonicalPath}`));
expected.push(...manifest.supportedLocales.flatMap(locale => [`/${locale}/early-access`, `/${locale}/invite`, `/${locale}/downloads`]));
expected.push("/en/how-to", "/en/how-to/getting-started", "/en/how-to/concepts");
const missing = expected.filter(route => !routes.includes(route));
if (missing.length) { console.error("Missing built routes:", missing); process.exit(1); }
console.log(`Verified ${expected.length} content and access routes.`);

// Explore renders from the API at request time (ISR / dynamic), so its pages are
// never in `prerender.routes`. Assert the app router compiled them instead.
const appRoutes = JSON.parse(fs.readFileSync(".next/server/app-paths-manifest.json", "utf8"));
const exploreRoutes = [
  "/[locale]/explore/page",
  "/[locale]/explore/routines/[slug]/page",
  "/[locale]/explore/bundles/[slug]/page",
  "/api/revalidate/route",
  "/sitemap-explore.xml/route",
];
const missingExplore = exploreRoutes.filter(route => !(route in appRoutes));
if (missingExplore.length) { console.error("Missing Explore routes:", missingExplore); process.exit(1); }
console.log(`Verified ${exploreRoutes.length} dynamic Explore routes.`);

// The Journal is API-driven too (Journal contract §10): the list pages may be
// prerendered, but every post, page n and preview renders on demand.
const journalRoutes = [
  "/[locale]/journal/page",
  "/[locale]/journal/page/[n]/page",
  "/[locale]/journal/releases/page",
  "/[locale]/journal/releases/page/[n]/page",
  "/[locale]/journal/routines/page",
  "/[locale]/journal/routines/page/[n]/page",
  "/[locale]/journal/launches/page",
  "/[locale]/journal/launches/page/[n]/page",
  "/[locale]/journal/[slug]/page",
  "/[locale]/journal/preview/[token]/page",
  "/journal/feed.xml/route",
  "/journal/og/[file]/route",
  "/sitemap-journal.xml/route",
];
const missingJournal = journalRoutes.filter(route => !(route in appRoutes));
if (missingJournal.length) { console.error("Missing Journal routes:", missingJournal); process.exit(1); }
console.log(`Verified ${journalRoutes.length} dynamic Journal routes.`);
