import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(repositoryRoot, "content/publication-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const sourceRoot = path.resolve(repositoryRoot, manifest.sourceRoot);
const checkOnly = process.argv.includes("--check");
const supportedLocales = manifest.supportedLocales ?? ["en", "pt", "es", "fr", "de", "it", "nl", "ru"];
const reservedRootEditorialSlugs = new Set([
  "about", "contact", "download", "editorial-policy", "governance", "guides", "privacy",
  "resources", "showcases", "signin", "signup",
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function yamlString(value) {
  return JSON.stringify(value);
}

function isValidEditorialCanonical(slug, canonicalPath) {
  if (canonicalPath === `/guides/${slug}`) return true;
  return canonicalPath === `/${slug}` && !reservedRootEditorialSlugs.has(slug);
}

function readBoundSource(relativePath, expectedSha256, label) {
  const filePath = path.join(sourceRoot, relativePath);
  if (!fs.existsSync(filePath)) throw new Error(`Missing ${label}: ${filePath}`);
  const source = fs.readFileSync(filePath, "utf8");
  const receivedSha256 = sha256(source);
  if (!expectedSha256) throw new Error(`Missing ${label} checksum for ${relativePath}`);
  if (expectedSha256 !== receivedSha256) {
    throw new Error(
      `${label} checksum mismatch for ${relativePath}: expected ${expectedSha256}, received ${receivedSha256}`,
    );
  }
  return { source, sha256: receivedSha256 };
}

function transformSource(source, item) {
  let body = source;
  if (item.contentStart) {
    const contentStartIndex = body.indexOf(item.contentStart);
    if (contentStartIndex === -1) {
      throw new Error(`Missing contentStart marker for ${item.source}`);
    }
    body = body.slice(contentStartIndex);
  }
  if (item.sourceHeading) {
    const marker = `\n## ${item.sourceHeading}\n`;
    const markerIndex = body.indexOf(marker);
    if (markerIndex === -1) throw new Error(`Missing source heading '${item.sourceHeading}' in ${item.source}`);
    body = body.slice(markerIndex + marker.length);
  }
  body = body.replace(/^# .+\n+/, "");
  body = body.replace(/^> \*\*Status\*\*:.+\n+/m, "");
  body = body.split("\n## Production control\n")[0].trim();
  body = body.replace(/^\*\*Media handoff:\*\*.+\n+/m, "");
  if (item.slug === "ai-native-company") {
    body = body.replace(
      /```mermaid[\s\S]*?```\n+/,
      "![Five connected operating-model checks: core work dependency, encoded organization, persistent operating context, governed action, and measured feedback.](/assets/guides/ai-native-company-diagnostic.svg)\n\n",
    );
  }
  body = body.replace(
    /- \*\*Responsible human review:\*\*.+/,
    "- **Accountability:** Toone Content owns this guide. Product conclusions remain bounded to the linked product and policy pages.",
  );
  body = body.replace(
    /- \*\*Corrections and sourcing:\*\*.+/,
    "- **Corrections and sourcing:** See the [editorial, sources, and corrections policy](/en/editorial-policy) and [About Toone](/en/about).",
  );
  if (!item.preserveContactLinks) {
    body = body.replace(
      /\]\(\/(?:en|pt|es|fr|de|it|nl|ru)\/contact\)/g,
      "](mailto:hello@trytoone.com)",
    );
  }
  body = body.replace(/\n---\s*$/, "");
  return `${body.trim()}\n`;
}

function metadataFor(item, localeConfig) {
  const metadata = { ...item, ...localeConfig };
  const required = [
    "slug",
    "canonicalPath",
    "title",
    "description",
    "eyebrow",
    "author",
    "published",
    "updated",
    "readTime",
  ];
  for (const key of required) {
    if (!metadata[key]) throw new Error(`Missing ${key} for ${item.id}/${localeConfig.locale ?? "en"}`);
  }
  return metadata;
}

function generatedFrontmatter(item, locale, metadata, bindings) {
  const fields = [
    "---",
    `locale: ${yamlString(locale)}`,
    `slug: ${yamlString(metadata.slug)}`,
    `canonicalPath: ${yamlString(metadata.canonicalPath)}`,
    `title: ${yamlString(metadata.title)}`,
    `heading: ${yamlString(metadata.heading ?? metadata.title)}`,
    `description: ${yamlString(metadata.description)}`,
    `eyebrow: ${yamlString(metadata.eyebrow)}`,
    `author: ${yamlString(metadata.author)}`,
    `authorType: ${yamlString(metadata.authorType ?? "Organization")}`,
    `authorUrl: ${yamlString(metadata.authorUrl ?? "/en/editorial-policy")}`,
    `published: ${yamlString(metadata.published)}`,
    `updated: ${yamlString(metadata.updated)}`,
    `readTime: ${yamlString(metadata.readTime)}`,
    `featured: ${metadata.featured ? "true" : "false"}`,
    `image: ${yamlString(metadata.image ?? "/assets/og/toone-og.png")}`,
    `imageAlt: ${yamlString(metadata.imageAlt ?? "Toone")}`,
    `sourceWorkId: ${yamlString(item.id)}`,
    `sourceSha256: ${yamlString(bindings.sourceSha256)}`,
  ];
  if (bindings.englishSourceSha256) {
    fields.push(`englishSourceSha256: ${yamlString(bindings.englishSourceSha256)}`);
  }
  if (bindings.translationManifestSha256) {
    fields.push(`translationManifestSha256: ${yamlString(bindings.translationManifestSha256)}`);
  }
  if (bindings.translationQaSha256) {
    fields.push(`translationQaSha256: ${yamlString(bindings.translationQaSha256)}`);
  }
  fields.push("---", "");
  return fields.join("\n");
}

function legacyFrontmatter(item, sourceSha256) {
  return [
    "---",
    `slug: ${yamlString(item.slug)}`,
    `canonicalPath: ${yamlString(item.canonicalPath)}`,
    `title: ${yamlString(item.title)}`,
    `heading: ${yamlString(item.heading ?? item.title)}`,
    `description: ${yamlString(item.description)}`,
    `eyebrow: ${yamlString(item.eyebrow)}`,
    `author: ${yamlString(item.author)}`,
    `published: ${yamlString(item.published)}`,
    `updated: ${yamlString(item.updated)}`,
    `readTime: ${yamlString(item.readTime)}`,
    `featured: ${item.featured ? "true" : "false"}`,
    `sourceWorkId: ${yamlString(item.id)}`,
    `sourceSha256: ${yamlString(sourceSha256)}`,
    "---",
    "",
  ].join("\n");
}

function writeOrCheck(destination, generated, label) {
  const destinationPath = path.join(repositoryRoot, destination);
  if (checkOnly) {
    const current = fs.existsSync(destinationPath) ? fs.readFileSync(destinationPath, "utf8") : "";
    if (current !== generated) {
      throw new Error(`Content drift: run npm run content:sync (${path.relative(repositoryRoot, destinationPath)})`);
    }
    console.log(`verified ${label} -> ${path.relative(repositoryRoot, destinationPath)} (${sha256(generated).slice(0, 12)})`);
    return;
  }
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, generated);
  console.log(`synced ${label} -> ${path.relative(repositoryRoot, destinationPath)} (${sha256(generated).slice(0, 12)})`);
}

for (const item of manifest.items) {
  if (item.state !== "publishable") continue;

  if (!item.locales) {
    const { source, sha256: sourceSha256 } = readBoundSource(item.source, item.sourceSha256, "Content source");
    const generated = `${legacyFrontmatter(item, sourceSha256)}${transformSource(source, item)}`;
    writeOrCheck(item.destination, generated, item.id);
    continue;
  }

  if (!isValidEditorialCanonical(item.slug, item.canonicalPath)) {
    throw new Error(
      `Invalid canonicalPath for ${item.id}: expected /guides/${item.slug} or non-reserved /${item.slug}`,
    );
  }

  const localeNames = Object.keys(item.locales);
  const expectedLocales = item.localePolicy === "complete" ? supportedLocales : localeNames;
  if (expectedLocales.some((locale) => !item.locales[locale])) {
    throw new Error(`Missing locale set for ${item.id}: expected ${expectedLocales.join(", ")}`);
  }
  if (localeNames.some((locale) => !supportedLocales.includes(locale))) {
    throw new Error(`Unsupported locale in ${item.id}: ${localeNames.join(", ")}`);
  }

  const englishConfig = { ...item.locales.en, locale: "en" };
  if (!englishConfig.source) throw new Error(`Missing English source for ${item.id}`);
  const english = readBoundSource(englishConfig.source, englishConfig.sourceSha256, "English source");

  for (const locale of expectedLocales) {
    const config = { ...item.locales[locale], locale };
    const metadata = metadataFor(item, config);
    const contentSource = locale === "en"
      ? english
      : readBoundSource(config.source, config.sourceSha256, `${locale} translation`);
    const bindings = { sourceSha256: contentSource.sha256 };

    if (locale !== "en") {
      if (config.englishSourceSha256 !== english.sha256) {
        throw new Error(`English source drift for ${item.id}/${locale}: translation pins ${config.englishSourceSha256}, current source is ${english.sha256}`);
      }
      const translationManifest = readBoundSource(
        config.translationManifest,
        config.translationManifestSha256,
        `${locale} translation manifest`,
      );
      const translationQa = readBoundSource(
        config.translationQa,
        config.translationQaSha256,
        `${locale} translation QA`,
      );
      if (!/(?:^|\n)`PASS`\s*(?:\n|$)/m.test(translationQa.source)) {
        throw new Error(`Translation QA is not PASS for ${item.id}/${locale}`);
      }
      bindings.englishSourceSha256 = english.sha256;
      bindings.translationManifestSha256 = translationManifest.sha256;
      bindings.translationQaSha256 = translationQa.sha256;
    }

    const generated = `${generatedFrontmatter(item, locale, metadata, bindings)}${transformSource(contentSource.source, metadata)}`;
    writeOrCheck(config.destination, generated, `${item.id}/${locale}`);
  }
}
