import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  assetIdFromSrc,
  extractExploreBlocks,
  isExploreFence,
  journalTableOfContents,
  opensExploreFence,
  parseExploreBlock,
  plainText,
} from "../../lib/journal/markdown";

test("explore blocks: one record line, optional variant, nothing else (§6.3)", () => {
  assert.deepEqual(parseExploreBlock("bundle: product-launch-essentials-trwv3k5g\n"), {
    type: "bundle",
    ref: "product-launch-essentials-trwv3k5g",
    variant: "card",
  });
  assert.deepEqual(parseExploreBlock("routine: wfl_abcdefgh12\nvariant: compact"), {
    type: "routine",
    ref: "wfl_abcdefgh12",
    variant: "compact",
  });
  assert.equal(parseExploreBlock(""), null);
  assert.equal(parseExploreBlock("routine: a-b\nbundle: c-d"), null, "two records");
  assert.equal(parseExploreBlock("routine: a-b\ntitle: x"), null, "unknown key");
  assert.equal(parseExploreBlock("routine: a-b\nvariant: hero"), null, "unknown variant");
  assert.equal(parseExploreBlock("bundle: wfl_abcdefgh12"), null, "id of the wrong type");
  assert.equal(parseExploreBlock("routine: <script>"), null);
});

test("explore blocks are extracted in order, skipping invalid ones", () => {
  const body = [
    "Intro",
    "```explore",
    "bundle: launch-kit-r5h8c2nd",
    "```",
    "```js",
    "routine: not-a-block",
    "```",
    "````explore",
    "routine: product-launch-prep-qk4m2x7a",
    "variant: compact",
    "````",
    "```explore",
    "nonsense",
    "```",
  ].join("\n");
  assert.deepEqual(extractExploreBlocks(body), [
    { type: "bundle", ref: "launch-kit-r5h8c2nd", variant: "card" },
    { type: "routine", ref: "product-launch-prep-qk4m2x7a", variant: "compact" },
  ]);
});

test("an explore fence is one whose info string is exactly `explore` (server rule)", () => {
  for (const line of ["```explore", "~~~explore", "````explore", "```explore   ", "``` explore", "   ```explore"]) {
    assert.equal(isExploreFence(line), true, line);
  }
  for (const line of [
    "```Explore",
    "```EXPLORE",
    "```explore compact",
    "```explore{}",
    "```explore`",
    "    ```explore",
    "``explore",
    "> ```explore",
    "- ```explore",
    "```",
    "explore",
  ]) {
    assert.equal(isExploreFence(line), false, line);
  }
  assert.equal(opensExploreFence(["x", "```explore"], 2), true);
  assert.equal(opensExploreFence(["x", "```explore"], 1), false);
  assert.equal(opensExploreFence(["```explore"], undefined), false);
  assert.equal(opensExploreFence(["```explore"], 0), false);
});

test("explore extraction ignores near-miss fences and fences nested in other code", () => {
  const body = [
    "```Explore",
    "routine: casing-variant-aaaaaaaa",
    "```",
    "```explore compact",
    "routine: extra-words-bbbbbbbb",
    "```",
    "````md",
    "```explore",
    "routine: inside-a-markdown-sample",
    "```",
    "````",
    "~~~explore",
    "bundle: tilde-fence-cccccccc",
    "~~~",
    "```explore",
    "routine: unclosed-at-the-end",
  ].join("\n");
  assert.deepEqual(extractExploreBlocks(body), [
    { type: "bundle", ref: "tilde-fence-cccccccc", variant: "card" },
    { type: "routine", ref: "unclosed-at-the-end", variant: "card" },
  ]);
});

test("the renderer and the extractor agree on which fences are explore blocks", () => {
  const body = [
    "Intro",
    "",
    "```explore",
    "bundle: launch-kit-r5h8c2nd",
    "```",
    "",
    "```explore compact",
    "routine: extra-words-bbbbbbbb",
    "```",
    "",
    "```Explore",
    "routine: casing-variant-aaaaaaaa",
    "```",
    "",
    "- item",
    "",
    "  ```explore",
    "  routine: in-a-list-dddddddd",
    "  ```",
    "",
    "> ```explore",
    "> routine: in-a-quote-eeeeeeee",
    "> ```",
    "",
    "~~~explore",
    "routine: product-launch-prep-qk4m2x7a",
    "variant: compact",
    "~~~",
  ].join("\n");
  const lines = body.split("\n");
  type Hast = { position?: { start?: { line?: number } }; children?: { type: string; children?: { value?: string }[] }[] };
  const html = renderToStaticMarkup(
    createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm],
      components: {
        pre: ({ node, children }) => {
          const hast = node as Hast | undefined;
          if (!opensExploreFence(lines, hast?.position?.start?.line)) return createElement("pre", null, children);
          const source = hast?.children?.find((child) => child.type === "element")?.children?.[0]?.value ?? "";
          const block = parseExploreBlock(source);
          return createElement("x-embed", { "data-ref": block?.ref ?? "invalid" });
        },
      },
      children: body,
    }),
  );
  const rendered = [...html.matchAll(/<x-embed data-ref="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(rendered, extractExploreBlocks(body).map((block) => block.ref));
  // A list item's fence still opens within three spaces of indent (a block,
  // as on the server); a blockquote's starts with `>` (not a block).
  assert.deepEqual(rendered, ["launch-kit-r5h8c2nd", "in-a-list-dddddddd", "product-launch-prep-qk4m2x7a"]);
  assert.ok(html.includes("routine: in-a-quote-eeeeeeee"), "a quoted fence renders as plain code");
  assert.ok(html.includes("routine: extra-words-bbbbbbbb"), "a near miss renders as plain code");
});

test("table of contents skips headings inside fenced code and strips inline markup", () => {
  const body = "## First `step`\n\n```md\n## Not a heading\n```\n\n### Detail\n\n## [Linked](/x) **bold** ##\n";
  assert.deepEqual(journalTableOfContents(body), [
    { id: "first-step", label: "First step", level: 2 },
    { id: "detail", label: "Detail", level: 3 },
    { id: "linked-bold", label: "Linked bold", level: 2 },
  ]);
  assert.equal(plainText("![alt](asset:jna_x) and [t](/y)"), "alt and t");
});

test("asset refs resolve only for well-formed asset ids", () => {
  assert.equal(assetIdFromSrc("asset:jna_shot0release001"), "jna_shot0release001");
  assert.equal(assetIdFromSrc("https://example.com/a.png"), null);
  assert.equal(assetIdFromSrc("asset:jna_x"), null);
});
