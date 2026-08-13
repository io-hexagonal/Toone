import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(repositoryRoot, "content/publication-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const sourceRoot = path.resolve(repositoryRoot, manifest.sourceRoot);
const checkOnly = process.argv.includes("--check");

function yamlString(value) {
  return JSON.stringify(value);
}

function transformSource(source, item) {
  let body = source;
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
  body = body.replace(
    /```mermaid[\s\S]*?```\n+/,
    "![Five connected operating-model checks: core work dependency, encoded organization, persistent operating context, governed action, and measured feedback.](/assets/guides/ai-native-company-diagnostic.svg)\n\n",
  );
  body = body.replace(
    /- \*\*Responsible human review:\*\*.+/,
    "- **Accountability:** Toone Content owns this guide. Product conclusions remain bounded to the linked product and policy pages.",
  );
  body = body.replace(
    /- \*\*Corrections and sourcing:\*\*.+/,
    "- **Corrections and sourcing:** See the [editorial, sources, and corrections policy](/en/editorial-policy) and [About Toone](/en/about).",
  );
  body = body.replace(/\n---\s*$/, "");
  return `${body.trim()}\n`;
}

for (const item of manifest.items) {
  if (item.state !== "publishable") continue;

  const sourcePath = path.join(sourceRoot, item.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing Content source: ${sourcePath}`);
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  const sourceSha256 = crypto.createHash("sha256").update(source).digest("hex");
  if (item.sourceSha256 && item.sourceSha256 !== sourceSha256) {
    throw new Error(
      `Source checksum mismatch for ${item.id}: expected ${item.sourceSha256}, received ${sourceSha256}`,
    );
  }
  const frontmatter = [
    "---",
    `slug: ${yamlString(item.slug)}`,
    `canonicalPath: ${yamlString(item.canonicalPath)}`,
    `title: ${yamlString(item.title)}`,
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

  const destinationPath = path.join(repositoryRoot, item.destination);
  const generated = `${frontmatter}${transformSource(source, item)}`;
  if (checkOnly) {
    const current = fs.existsSync(destinationPath) ? fs.readFileSync(destinationPath, "utf8") : "";
    if (current !== generated) {
      throw new Error(`Content drift: run npm run content:sync (${path.relative(repositoryRoot, destinationPath)})`);
    }
    console.log(`verified ${item.id} -> ${path.relative(repositoryRoot, destinationPath)} (${sourceSha256.slice(0, 12)})`);
    continue;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, generated);
  console.log(`synced ${item.id} -> ${path.relative(repositoryRoot, destinationPath)} (${sourceSha256.slice(0, 12)})`);
}
