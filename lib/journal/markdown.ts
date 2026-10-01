/**
 * Body helpers for Journal markdown (contract §6.2, §6.3).
 *
 * The server validates every body before it can be published; these helpers
 * only read it. They are pure so the post page, the preview and the tests
 * share one interpretation of `explore` blocks, headings and image refs.
 */
import { headingId } from "../content";

export type ExploreBlock = {
  type: "routine" | "bundle";
  /** Slug or id exactly as the author wrote it. */
  ref: string;
  variant: "card" | "compact";
};

const EXPLORE_REF = /^(?:wf[lb]_[a-z0-9]{8,32}|[a-z0-9]+(?:-[a-z0-9]+)*)$/;

/**
 * Parse the inside of a ```explore fence. Exactly one `routine:` or `bundle:`
 * line plus an optional `variant:`; anything else makes the block invalid
 * (null), and the page renders it as plain text rather than guessing.
 */
export function parseExploreBlock(source: string): ExploreBlock | null {
  let type: ExploreBlock["type"] | null = null;
  let ref = "";
  let variant: ExploreBlock["variant"] = "card";
  let sawVariant = false;
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = /^([a-z]+)\s*:\s*(\S+)$/.exec(trimmed);
    if (!match) return null;
    const [, key, value] = match;
    if (key === "routine" || key === "bundle") {
      if (type) return null;
      type = key;
      ref = value;
    } else if (key === "variant") {
      if (sawVariant || (value !== "card" && value !== "compact")) return null;
      sawVariant = true;
      variant = value;
    } else {
      return null;
    }
  }
  if (!type || ref.length > 128 || !EXPLORE_REF.test(ref)) return null;
  if (ref.startsWith("wfl_") && type !== "routine") return null;
  if (ref.startsWith("wfb_") && type !== "bundle") return null;
  return { type, ref, variant };
}

/* ---------- fenced code (CommonMark §4.5, as the server reads it) ---------- */

/** Up to three spaces of indent, a run of ≥ 3 backticks or tildes, the info string. */
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;

type FenceOpening = { marker: string; info: string };

/**
 * The opening fence on `line` — its marker run and trimmed info string — or
 * null when the line opens no fence. A backtick fence whose info string holds
 * a backtick is not a fence (CommonMark), so it is null too.
 */
export function fenceOpening(line: string): FenceOpening | null {
  const match = FENCE_OPEN.exec(line);
  if (!match) return null;
  const info = match[2].trim();
  if (match[1][0] === "`" && info.includes("`")) return null;
  return { marker: match[1], info };
}

/**
 * §6.3: a fence is an `explore` block only when its info string is exactly
 * `explore`. The server rejects every other spelling (`Explore`,
 * `explore compact`, …) as a block, so the site must not render one as a
 * card either. This is the single predicate behind both the embed prefetch
 * (`extractExploreBlocks`) and the renderer (`JournalArticle`), so the two
 * can never disagree about which fences are blocks.
 */
export function isExploreFence(line: string): boolean {
  return fenceOpening(line)?.info === "explore";
}

/**
 * For the renderer: true when the code block whose source starts on
 * `line` (1-based, the mdast/hast `position.start.line`) opens with an
 * explore fence. The server reads the body line by line, so a fence behind
 * a `> ` or on a list marker line (`- ```explore`) is not a block there, and
 * reading the same source line here keeps the renderer in step with it.
 */
export function opensExploreFence(bodyLines: readonly string[], line: number | undefined): boolean {
  return typeof line === "number" && line >= 1 && isExploreFence(bodyLines[line - 1] ?? "");
}

function closesFence(line: string, marker: string): boolean {
  const trimmed = line.replace(/^ +/, "");
  if (line.length - trimmed.length > 3) return false;
  let run = 0;
  while (run < trimmed.length && trimmed[run] === marker[0]) run++;
  return run >= marker.length && trimmed.slice(run).trim() === "";
}

type BodyScan = {
  /** Every line, with fence lines (openers, content, closers) marked. */
  lines: { line: string; inFence: boolean }[];
  /** Every fence in document order; an unclosed fence runs to the end. */
  fences: { explore: boolean; content: string[] }[];
};

/** One pass over the body, tracking every fence the way the server does. */
function scanBody(body: string): BodyScan {
  const scan: BodyScan = { lines: [], fences: [] };
  let open: { marker: string; explore: boolean; content: string[] } | null = null;
  for (const line of body.split("\n")) {
    if (open) {
      scan.lines.push({ line, inFence: true });
      if (closesFence(line, open.marker)) {
        scan.fences.push({ explore: open.explore, content: open.content });
        open = null;
      } else {
        open.content.push(line);
      }
      continue;
    }
    const opening = fenceOpening(line);
    if (opening) {
      open = { marker: opening.marker, explore: isExploreFence(line), content: [] };
      scan.lines.push({ line, inFence: true });
      continue;
    }
    scan.lines.push({ line, inFence: false });
  }
  if (open) scan.fences.push({ explore: open.explore, content: open.content });
  return scan;
}

/** Every ```explore block in document order (invalid blocks are skipped). */
export function extractExploreBlocks(body: string): ExploreBlock[] {
  const blocks: ExploreBlock[] = [];
  for (const fence of scanBody(body).fences) {
    if (!fence.explore) continue;
    const block = parseExploreBlock(fence.content.join("\n"));
    if (block) blocks.push(block);
  }
  return blocks;
}

/** Markdown inline syntax reduced to the words a reader sees. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type JournalTocItem = { id: string; label: string; level: 2 | 3 };

/**
 * `##` / `###` headings outside fenced code (§6.2). Ids use the same
 * `headingId` the rendered headings use, applied to the same plain text.
 */
export function journalTableOfContents(body: string): JournalTocItem[] {
  const items: JournalTocItem[] = [];
  for (const { line, inFence } of scanBody(body).lines) {
    if (inFence) continue;
    const match = /^(##|###)\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const label = plainText(match[2]);
    if (!label) continue;
    items.push({ id: headingId(label), label, level: match[1].length as 2 | 3 });
  }
  return items;
}

/** `asset:jna_…` image reference → the asset id, else null. */
export function assetIdFromSrc(src: string): string | null {
  const match = /^asset:(jna_[a-z0-9]{8,32})$/.exec(src.trim());
  return match ? match[1] : null;
}
