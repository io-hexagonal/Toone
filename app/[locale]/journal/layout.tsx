import type { Metadata } from "next";
import type { ReactNode } from "react";
import StrictCspLayout from "@/components/StrictCspLayout";

/**
 * Fail-closed robots default for the Journal segment. Every page sets its own
 * robots (`index, follow` on lists and posts, `noindex` on previews), but a
 * not-found render only resolves layout metadata: without this, the root
 * layout's `index, follow` would sit next to the `noindex` Next injects on a
 * 404 (retired posts, unknown slugs, out-of-range pages).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/** Strict CSP section (lib/csp.ts): rendered per request for the script nonce. */
export default function JournalLayout({ children }: { children: ReactNode }) {
  return <StrictCspLayout>{children}</StrictCspLayout>;
}
