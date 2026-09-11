import fs from "node:fs";
const manifest = JSON.parse(fs.readFileSync("content/publication-manifest.json", "utf8"));
const prerender = JSON.parse(fs.readFileSync(".next/prerender-manifest.json", "utf8"));
const routes = Object.keys(prerender.routes);
const expected = manifest.items.flatMap(item => item.locales.map(locale => `/${locale}${item.canonicalPath}`));
expected.push(...manifest.supportedLocales.flatMap(locale => [`/${locale}/early-access`, `/${locale}/invite`, `/${locale}/downloads`]));
const missing = expected.filter(route => !routes.includes(route));
if (missing.length) { console.error("Missing built routes:", missing); process.exit(1); }
console.log(`Verified ${expected.length} content and access routes.`);
