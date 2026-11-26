import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HowToLink from "../../components/HowToLink";
import SignedInOnly from "../../components/SignedInOnly";

/* The server HTML (what crawlers and signed-out visitors get) has no /how-to link and no dead call to action. */

test("HowToLink renders no anchor in the server HTML, whatever the fallback", () => {
  const link = (fallback: "none" | "text" | "block") =>
    renderToStaticMarkup(createElement(HowToLink, { href: "/en/how-to", className: "card", fallback, children: "Guides" }));
  assert.equal(link("none"), "");
  assert.equal(link("text"), "Guides");
  assert.equal(link("block"), '<div class="card" data-howto-static="">Guides</div>');
  for (const fallback of ["none", "text", "block"] as const) assert.doesNotMatch(link(fallback), /<a\b|how-to/);
});

test("SignedInOnly renders nothing in the server HTML", () => {
  const html = renderToStaticMarkup(createElement(SignedInOnly, {
    children: createElement("aside", { className: "article-close" }, createElement("a", { href: "/en/how-to" }, "Read")),
  }));
  assert.equal(html, "");
});

test("the article's closing call to action is for signed-in visitors only", () => {
  const page = fs.readFileSync("components/ArticlePage.tsx", "utf8");
  assert.match(page, /<SignedInOnly>\s*<aside className="article-close">[\s\S]*?<\/aside>\s*<\/SignedInOnly>/);
});
