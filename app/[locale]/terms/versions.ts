import type { ComponentType } from "react";
import { CURRENT_TERMS_VERSION, type TermsVersion } from "@/lib/legal/terms-versions";
import TermsContent, { type TermsContentProps } from "./TermsContent";

/**
 * The text of each Terms version (lib/legal/terms-versions.ts), keyed by the
 * date it took effect. The current version is TermsContent; a replaced one
 * keeps a frozen copy under ./versions/.
 */
export const TERMS_VERSION_CONTENT: Readonly<Record<string, ComponentType<TermsContentProps>>> = Object.freeze({
  "2026-11-11": TermsContent,
});

/** The text of `version`; the current text for a version without its own (never expected: a test checks every version has one). */
export function termsContentFor(version: TermsVersion): ComponentType<TermsContentProps> {
  return TERMS_VERSION_CONTENT[version.date] ?? TERMS_VERSION_CONTENT[CURRENT_TERMS_VERSION.date] ?? TermsContent;
}
