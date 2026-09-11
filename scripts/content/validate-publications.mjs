import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const manifest = JSON.parse(fs.readFileSync("content/publication-manifest.json", "utf8"));
const errors = [];
const declared = new Set();
const forbidden = /WRITE_UNCERTAIN|sourceSha256|translationQaSha256|Content-owned implementation notes|checksum-bound|fan[- ](?:out|in)|bounded retries/i;
const reserved = new Set(["early-access", "invite", "download", "downloads", "signin", "signup"]);
for (const item of manifest.items) {
  if (!/^[a-z0-9-]+$/.test(item.slug) || reserved.has(item.slug)) errors.push(`Invalid editorial slug: ${item.slug}`);
  for (const locale of item.locales) {
    if (!manifest.supportedLocales.includes(locale)) errors.push(`Unsupported locale: ${locale}`);
    const relative = item.locales.length === 1
      ? `content/guides/${item.slug}.md` : `content/guides/${locale}/${item.slug}.md`;
    declared.add(relative);
    if (!fs.existsSync(relative)) { errors.push(`Missing ${relative}`); continue; }
    const { data, content } = matter(fs.readFileSync(relative, "utf8"));
    for (const key of ["title", "heading", "description", "author", "published", "updated", "readTime"]) {
      if (!data[key]) errors.push(`${relative}: missing ${key}`);
    }
    if (data.slug !== item.slug || data.canonicalPath !== item.canonicalPath) errors.push(`${relative}: route mismatch`);
    if ((data.locale || "en") !== locale) errors.push(`${relative}: locale mismatch`);
    if (!content.trim()) errors.push(`${relative}: empty article`);
    if (forbidden.test(content)) errors.push(`${relative}: operational detail must not be published`);
    if (/github\.com\/[^\s)]+\/releases\/[^\s)]+\.dmg/i.test(content)) errors.push(`${relative}: public binary link`);
    for (const match of content.matchAll(/!\[[^\]]*\]\((\/[^)]+)\)/g)) {
      if (!fs.existsSync(path.join("public", match[1]))) errors.push(`${relative}: missing image`);
    }
  }
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(relative);
    else if (relative.endsWith(".md") && !declared.has(relative)) errors.push(`Undeclared publication: ${relative}`);
  }
}
walk("content/guides");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Validated ${declared.size} product introductions across ${manifest.supportedLocales.length} locales.`);
