import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "content/publication-manifest.json"), "utf8"));
const locales = manifest.supportedLocales;
const errors = [];
const generatedDestinations = new Set();
const publications = [];
const reservedRootEditorialSlugs = new Set([
  "about", "contact", "download", "editorial-policy", "governance", "guides", "privacy",
  "resources", "showcases", "signin", "signup",
]);
const rootCanonicalExamples = [
  "organizational-knowledge",
  "how-it-works",
  "ai-agent-routines",
  "agent-organizations",
];
const guideCanonicalExamples = [
  "ai-agents-vs-workflow-automation",
  "ai-agent-adoption-roadmap",
  "ai-agent-evaluation",
  "ai-agent-observability",
  "evaluating-ai-agent-browser-integrations",
  "choosing-ai-agent-organization-templates",
];

function fail(message) {
  errors.push(message);
}

function normalize(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
}

function isValidEditorialCanonical(slug, canonicalPath) {
  if (canonicalPath === `/guides/${slug}`) return true;
  return canonicalPath === `/${slug}` && !reservedRootEditorialSlugs.has(slug);
}

function parseGenerated(relativePath, item, locale) {
  const filePath = path.join(root, relativePath);
  generatedDestinations.add(path.normalize(relativePath));
  if (!fs.existsSync(filePath)) {
    fail(`missing generated publication: ${relativePath}`);
    return null;
  }
  const parsed = matter(fs.readFileSync(filePath, "utf8"));
  const data = parsed.data;
  const required = [
    "slug", "canonicalPath", "title", "heading", "description", "eyebrow", "author",
    "published", "updated", "readTime", "sourceWorkId", "sourceSha256",
  ];
  for (const key of required) {
    if (!normalize(data[key])) fail(`${relativePath}: missing ${key}`);
  }
  if (data.sourceWorkId !== item.id) fail(`${relativePath}: sourceWorkId must equal ${item.id}`);
  if (data.slug !== item.slug) fail(`${relativePath}: slug must equal ${item.slug}`);
  if (data.canonicalPath !== item.canonicalPath) {
    fail(`${relativePath}: canonicalPath must equal ${item.canonicalPath}`);
  }
  if (item.locales && !isValidEditorialCanonical(item.slug, data.canonicalPath)) {
    fail(`${relativePath}: canonicalPath must be /guides/{slug} or a non-reserved /{slug}`);
  }
  if (locale && data.locale !== locale) fail(`${relativePath}: locale must equal ${locale}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.published))) fail(`${relativePath}: invalid published date`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.updated))) fail(`${relativePath}: invalid updated date`);
  if (!normalize(parsed.content)) fail(`${relativePath}: body is empty`);
  publications.push({ relativePath, item, locale: locale ?? "en", data, body: normalize(parsed.content) });
  return { data, body: normalize(parsed.content) };
}

function validateLinks(publication, localeConfig) {
  const markdown = fs.readFileSync(path.join(root, publication.relativePath), "utf8");
  const allowedEnglishFallbacks = new Set(localeConfig?.englishFallbacks ?? []);
  const linkPattern = /(!?)\[[^\]]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of markdown.matchAll(linkPattern)) {
    const isImage = match[1] === "!";
    const href = match[2].split("#")[0];
    if (!href || /^(?:https?:|mailto:|tel:)/.test(href)) continue;
    if (isImage && href.startsWith("/")) {
      if (!fs.existsSync(path.join(root, "public", href))) {
        fail(`${publication.relativePath}: missing image asset ${href}`);
      }
      continue;
    }
    const explicitLocale = href.match(/^\/(en|pt|es|fr|de|it|nl|ru)(?:\/|$)/)?.[1];
    if (explicitLocale && explicitLocale !== publication.locale) {
      if (explicitLocale !== "en" || !allowedEnglishFallbacks.has(href)) {
        fail(`${publication.relativePath}: cross-locale link ${href} is not a declared English fallback`);
      }
    }
    if (explicitLocale) continue;
    const editorialPath = href.match(/^\/(?:guides\/)?[a-z0-9]+(?:-[a-z0-9]+)*\/?$/)?.[0]
      ?.replace(/\/$/, "");
    const rootSlug = editorialPath?.match(/^\/([a-z0-9-]+)$/)?.[1];
    if (editorialPath && !(rootSlug && reservedRootEditorialSlugs.has(rootSlug))) {
      const target = publications.find(
        (candidate) =>
          candidate.locale === publication.locale &&
          candidate.data.canonicalPath === editorialPath,
      );
      if (!target) fail(`${publication.relativePath}: same-locale editorial target is missing for ${href}`);
    }
  }
}

if (manifest.schemaVersion !== 2) fail("publication manifest schemaVersion must be 2");
if (JSON.stringify(locales) !== JSON.stringify(["en", "pt", "es", "fr", "de", "it", "nl", "ru"])) {
  fail("supportedLocales must be exactly en, pt, es, fr, de, it, nl, ru");
}
for (const slug of rootCanonicalExamples) {
  if (!isValidEditorialCanonical(slug, `/${slug}`)) fail(`root canonical example rejected: /${slug}`);
}
for (const slug of guideCanonicalExamples) {
  if (!isValidEditorialCanonical(slug, `/guides/${slug}`)) {
    fail(`guide canonical example rejected: /guides/${slug}`);
  }
}
for (const slug of reservedRootEditorialSlugs) {
  if (isValidEditorialCanonical(slug, `/${slug}`)) fail(`reserved root collision accepted: /${slug}`);
}
const localeAppDirectory = path.join(root, "app/[locale]");
for (const entry of fs.readdirSync(localeAppDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith("[")) continue;
  if (!reservedRootEditorialSlugs.has(entry.name)) {
    fail(`static locale segment is not reserved from editorial routing: /${entry.name}`);
  }
}

const seenIds = new Set();
const seenSlugs = new Set();
for (const item of manifest.items) {
  if (item.state !== "publishable") continue;
  if (seenIds.has(item.id)) fail(`duplicate work id: ${item.id}`);
  seenIds.add(item.id);
  if (seenSlugs.has(item.slug)) fail(`duplicate publication slug: ${item.slug}`);
  seenSlugs.add(item.slug);

  if (!item.locales) {
    if (item.localePolicy !== "english-only") fail(`${item.id}: legacy publication must declare localePolicy english-only`);
    parseGenerated(item.destination, item, null);
    continue;
  }

  if (item.localePolicy !== "complete") fail(`${item.id}: localized publication must declare localePolicy complete`);
  if (!isValidEditorialCanonical(item.slug, item.canonicalPath)) {
    fail(`${item.id}: canonicalPath must be /guides/{slug} or a non-reserved /{slug}`);
  }
  const localeKeys = Object.keys(item.locales);
  if (localeKeys.length !== locales.length || locales.some((locale) => !localeKeys.includes(locale))) {
    fail(`${item.id}: missing locale set; expected ${locales.join(", ")}`);
    continue;
  }

  const parsedByLocale = {};
  for (const locale of locales) {
    const config = item.locales[locale];
    const expectedDestination = `content/guides/${locale}/${item.slug}.md`;
    if (config.destination !== expectedDestination) {
      fail(`${item.id}/${locale}: destination must be ${expectedDestination}`);
    }
    parsedByLocale[locale] = parseGenerated(config.destination, item, locale);
    const generated = parsedByLocale[locale];
    if (!generated) continue;
    for (const key of ["title", "heading", "description", "eyebrow", "author", "readTime", "image", "imageAlt", "authorType", "authorUrl"]) {
      if (!normalize(generated.data[key])) fail(`${config.destination}: missing localized ${key}`);
    }
    if (locale !== "en") {
      if (generated.data.englishSourceSha256 !== item.locales.en.sourceSha256) {
        fail(`${config.destination}: stale English source binding`);
      }
      if (generated.data.translationManifestSha256 !== config.translationManifestSha256) {
        fail(`${config.destination}: stale translation manifest binding`);
      }
      if (generated.data.translationQaSha256 !== config.translationQaSha256) {
        fail(`${config.destination}: stale translation QA binding`);
      }
    }
  }

  const english = parsedByLocale.en;
  if (english) {
    for (const locale of locales.filter((value) => value !== "en")) {
      const translated = parsedByLocale[locale];
      if (!translated) continue;
      for (const key of ["title", "heading", "description", "eyebrow", "readTime"]) {
        if (normalize(translated.data[key]) === normalize(english.data[key])) {
          fail(`${item.id}/${locale}: ${key} is unchanged from English`);
        }
      }
      if (translated.body === english.body) fail(`${item.id}/${locale}: body is unchanged from English`);
    }
  }
}

for (const publication of publications) {
  validateLinks(publication, publication.item.locales?.[publication.locale]);
}

const guidesRoot = path.join(root, "content/guides");
for (const locale of locales) {
  const localeDirectory = path.join(guidesRoot, locale);
  if (!fs.existsSync(localeDirectory)) continue;
  for (const file of fs.readdirSync(localeDirectory).filter((name) => name.endsWith(".md"))) {
    const relativePath = path.normalize(path.relative(root, path.join(localeDirectory, file)));
    if (!generatedDestinations.has(relativePath)) fail(`orphan generated locale file: ${relativePath}`);
  }
}

for (const locale of locales) {
  const seenMetadata = new Map();
  for (const publication of publications.filter((entry) => entry.locale === locale)) {
    const signature = `${normalize(publication.data.title).toLowerCase()}\n${normalize(publication.data.description).toLowerCase()}`;
    const existing = seenMetadata.get(signature);
    if (existing) fail(`${publication.relativePath}: duplicate title/description with ${existing}`);
    seenMetadata.set(signature, publication.relativePath);
  }
}

const routeSource = fs.readFileSync(path.join(root, "app/[locale]/guides/[slug]/page.tsx"), "utf8");
const rootRouteSource = fs.readFileSync(path.join(root, "app/[locale]/[slug]/page.tsx"), "utf8");
const sitemapSource = fs.readFileSync(path.join(root, "app/sitemap.xml/route.ts"), "utf8");
for (const marker of ["publicationAlternates", "inLanguage: locale", "publication.authorType", "BreadcrumbList", "dynamicParams = false"]) {
  if (!routeSource.includes(marker)) fail(`guide route is missing SEO/static marker: ${marker}`);
}
for (const marker of ["getRootEditorialSlugs", "isRootEditorialPublication", "publicationAlternates", "inLanguage: locale", "BreadcrumbList", "dynamicParams = false"]) {
  if (!rootRouteSource.includes(marker)) fail(`root editorial route is missing SEO/static marker: ${marker}`);
}
for (const marker of ["getPublicationLocales", "publicationAlternateLinks", "x-default", "getGuideSlugs", "getRootEditorialSlugs"]) {
  if (!sitemapSource.includes(marker)) fail(`sitemap is missing locale-parity marker: ${marker}`);
}

if (errors.length) {
  console.error(`publication validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const localizedFamilies = manifest.items.filter((item) => item.state === "publishable" && item.locales).length;
console.log(`publication validation passed: ${publications.length} generated file(s), ${localizedFamilies} complete localized family/families, ${rootCanonicalExamples.length} root + ${guideCanonicalExamples.length} guide canonical examples`);
