import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.TOONE_ROUTE_CHECK_ORIGIN ?? "http://127.0.0.1:3100";
const locales = ["en", "pt", "es", "fr", "de", "it", "nl", "ru"];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/publication-manifest.json"), "utf8"));
const approvedCanonicalExamples = [
  "/organizational-knowledge",
  "/how-it-works",
  "/ai-agent-routines",
  "/agent-organizations",
  "/guides/ai-agents-vs-workflow-automation",
  "/guides/ai-agent-adoption-roadmap",
  "/guides/ai-agent-evaluation",
  "/guides/ai-agent-observability",
  "/guides/evaluating-ai-agent-browser-integrations",
  "/guides/choosing-ai-agent-organization-templates",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isPrerendered(response) {
  return (response.headers.get("x-nextjs-prerender") ?? "").includes("1");
}

for (const locale of locales) {
  const response = await fetch(`${baseUrl}/${locale}/resources`, { redirect: "manual" });
  const html = await response.text();
  assert(response.status === 200, `${locale} Resources must return 200`);
  assert(isPrerendered(response), `${locale} Resources must be prerendered`);
  assert(
    html.includes(`https://trytoone.com/${locale}/resources`),
    `${locale} Resources self-canonical is missing`,
  );
  assert(
    (html.match(/hrefLang=/g) ?? []).length === 9,
    `${locale} Resources must expose eight reciprocal locales plus x-default`,
  );
}

for (const locale of locales.slice(1)) {
  const response = await fetch(`${baseUrl}/${locale}/guides/ai-native-company`, {
    redirect: "manual",
  });
  assert(response.status === 308, `${locale} incomplete legacy guide must return 308`);
  assert(
    response.headers.get("location") === "/en/guides/ai-native-company",
    `${locale} incomplete legacy guide must redirect to the preserved English URL`,
  );
}

for (const [route, title] of [
  ["/en/guides/ai-native-company", "What Is an AI-Native Company? An Operating-Model Diagnostic"],
  ["/en/governance", "AI Agent Governance: A Practical Control Model"],
]) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
  const html = await response.text();
  assert(response.status === 200, `${route} must return 200`);
  assert(isPrerendered(response), `${route} must be prerendered`);
  assert(html.includes(title), `${route} visible title changed or is missing`);
  assert(html.includes(`https://trytoone.com${route}`), `${route} canonical is missing`);
  assert(html.includes('"@type":"Article"'), `${route} Article schema is missing`);
  assert(html.includes('"@type":"BreadcrumbList"'), `${route} BreadcrumbList schema is missing`);
  assert(html.includes('"name":"Toone Content"'), `${route} schema author changed or is missing`);
}
const legacyGuideAlias = await fetch(`${baseUrl}/en/ai-native-company`, { redirect: "manual" });
assert(legacyGuideAlias.status === 404, "English AI-native guide must not acquire a root alias");

for (const [route, expectedStatus] of [
  ["/en/about", 200],
  ["/en/business", 200],
  ["/en/download", 200],
  ["/en/editorial-policy", 200],
  ["/en/governance", 200],
  ["/en/guides", 308],
  ["/en/privacy", 200],
  ["/en/resources", 200],
  ["/en/showcases", 200],
  ["/en/signin", 200],
  ["/en/signup", 200],
]) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
  assert(response.status === expectedStatus, `${route} static-route collision check failed`);
}

const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();

for (const canonicalPath of approvedCanonicalExamples) {
  const configured = manifest.items.some(
    (item) => item.state === "publishable" && item.canonicalPath === canonicalPath,
  );
  if (configured) continue;
  const response = await fetch(`${baseUrl}/en${canonicalPath}`, { redirect: "manual" });
  assert(response.status === 404, `/en${canonicalPath} must remain 404 before its package exists`);
  assert(
    !sitemap.includes(`<loc>https://trytoone.com/en${canonicalPath}</loc>`),
    `/en${canonicalPath} leaked into the sitemap before its package exists`,
  );
}
for (const locale of locales) {
  const businessRecord = new RegExp(
    `<loc>https://trytoone.com/${locale}/business</loc>`,
    "g",
  );
  assert(
    (sitemap.match(businessRecord) ?? []).length === 1,
    `${locale} Business must occur once in the sitemap`,
  );
  const resourcesRecord = new RegExp(
    `<loc>https://trytoone.com/${locale}/resources</loc>`,
    "g",
  );
  assert(
    (sitemap.match(resourcesRecord) ?? []).length === 1,
    `${locale} Resources must occur once in the sitemap`,
  );
}
for (const locale of locales.slice(1)) {
  assert(
    !sitemap.includes(`<loc>https://trytoone.com/${locale}/guides/ai-native-company</loc>`),
    `${locale} incomplete guide leaked into the sitemap`,
  );
}
assert(
  (sitemap.match(/<loc>https:\/\/trytoone.com\/en\/guides\/ai-native-company<\/loc>/g) ?? [])
    .length === 1,
  "English AI-native guide must occur once in the sitemap",
);
assert(
  (sitemap.match(/<loc>https:\/\/trytoone.com\/en\/governance<\/loc>/g) ?? []).length === 1,
  "English Governance must occur once in the sitemap",
);

for (const item of manifest.items.filter(
  (candidate) => candidate.state === "publishable" && candidate.localePolicy === "complete",
)) {
  for (const locale of locales) {
    const localeConfig = item.locales[locale];
    const route = `/${locale}${item.canonicalPath}`;
    const canonical = `https://trytoone.com${route}`;
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const html = await response.text();
    assert(response.status === 200, `${route} must return 200`);
    assert(isPrerendered(response), `${route} must be prerendered`);
    assert(html.includes(canonical), `${route} self-canonical is missing`);
    assert(html.includes(localeConfig.title ?? item.title), `${route} localized visible title is missing`);
    assert((html.match(/hrefLang=/g) ?? []).length === 9, `${route} hreflang family is incomplete`);
    assert(html.includes(`"inLanguage":"${locale}"`), `${route} schema language mismatch`);
    assert(html.includes(`"name":"${localeConfig.author ?? item.author}"`), `${route} schema author mismatch`);
    assert(sitemap.includes(`<loc>${canonical}</loc>`), `${route} is missing from sitemap`);

    const oppositePath = item.canonicalPath.startsWith("/guides/")
      ? `/${item.slug}`
      : `/guides/${item.slug}`;
    const oppositeRoute = `/${locale}${oppositePath}`;
    const oppositeResponse = await fetch(`${baseUrl}${oppositeRoute}`, { redirect: "manual" });
    assert(oppositeResponse.status === 404, `${oppositeRoute} duplicate canonical alias must be 404`);
    assert(
      !sitemap.includes(`<loc>https://trytoone.com${oppositeRoute}</loc>`),
      `${oppositeRoute} duplicate canonical alias leaked into sitemap`,
    );
  }
}

console.log(
  "built route checks passed: both canonical families, static-route collision safety, localized Resources, incomplete-family protection, preserved English routes/schema, and sitemap parity",
);
