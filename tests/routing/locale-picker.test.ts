import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import LocalePicker from "../../components/LocalePicker";

/* The language picker is a disclosure whose links exist only while it is open (A6). */

test("the language picker's server HTML is a closed disclosure with no links", () => {
  for (const placement of ["header", "footer"] as const) {
    const html = renderToStaticMarkup(createElement(NextIntlClientProvider, {
      locale: "en",
      messages: {},
      timeZone: "UTC",
      children: createElement(LocalePicker, { placement }),
    }));
    assert.match(html, /<button[^>]*aria-expanded="false"/, placement);
    assert.doesNotMatch(html, /aria-haspopup/, placement);
    assert.doesNotMatch(html, /<a\b|hreflang/i, placement);
  }
});

test("Escape and focus leaving the picker close it", () => {
  const source = fs.readFileSync("components/LocalePicker.tsx", "utf8");
  assert.match(source, /event\.key !== "Escape"[\s\S]*?setOpen\(false\);[\s\S]*?button\.current\?\.focus\(\)/);
  assert.match(source, /onBlur=\{[\s\S]*?!root\.current\?\.contains\(next\)\) setOpen\(false\)/);
});
