import fs from "node:fs";
const buildDir = process.env.NEXT_DIST_DIR || ".next";
const manifest = JSON.parse(
  fs.readFileSync("content/publication-manifest.json", "utf8"),
);
const prerender = JSON.parse(
  fs.readFileSync(`${buildDir}/prerender-manifest.json`, "utf8"),
);
const routes = Object.keys(prerender.routes);
const expected = manifest.items.flatMap((item) =>
  item.locales.map((locale) => `/${locale}${item.canonicalPath}`),
);
expected.push(
  ...manifest.supportedLocales.flatMap((locale) => [
    `/${locale}/early-access`,
    `/${locale}/invite`,
    `/${locale}/downloads`,
  ]),
);
expected.push(
  "/en/how-to",
  "/en/how-to/getting-started",
  "/en/how-to/concepts",
);
const missing = expected.filter((route) => !routes.includes(route));
if (missing.length) {
  console.error("Missing built routes:", missing);
  process.exit(1);
}
console.log(`Verified ${expected.length} content and access routes.`);

const appRoutes = JSON.parse(
  fs.readFileSync(`${buildDir}/server/app-paths-manifest.json`, "utf8"),
);
for (const route of [
  "/[locale]/explore/page",
  "/[locale]/explore/routines/[slug]/page",
  "/[locale]/explore/bundles/[slug]/page",
  "/api/revalidate/route",
]) {
  if (!(route in appRoutes)) {
    console.error("Missing Explore route:", route);
    process.exit(1);
  }
}
console.log("Verified dynamic Explore pages and webhook route.");
