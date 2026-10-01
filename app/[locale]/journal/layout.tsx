import type { Metadata } from "next";
import type { ReactNode } from "react";

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

export default function JournalLayout({ children }: { children: ReactNode }) {
  return children;
}
