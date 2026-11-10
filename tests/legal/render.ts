/**
 * Renders the legal pages' content components to plain text for the tests:
 * no tags, entities decoded, whitespace collapsed. Import it before any
 * component (it installs the CSS-module hook the privacy choices button needs).
 */
import Module from "node:module";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";

type Loader = (module: { exports: unknown }, filename: string) => void;
const extensions = (Module as unknown as { _extensions: Record<string, Loader> })._extensions;
extensions[".css"] = (module) => {
  module.exports = new Proxy({}, { get: (_target, key) => (key === "__esModule" ? false : String(key)) });
};

export function renderHtml(node: ReactElement): string {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, { locale: "en", messages: en, timeZone: "UTC", children: node }),
  );
}

export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:)])/g, "$1")
    .replace(/\( /g, "(")
    .trim();
}

export function renderText(node: ReactElement): string {
  return htmlToText(renderHtml(node));
}
