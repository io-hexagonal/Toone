import type { ReactNode } from "react";
import { connection } from "next/server";

/**
 * Layout of every section served with the strict CSP (lib/csp.ts,
 * STRICT_SECTIONS): the section renders per request so Next.js can put this
 * request's nonce on its scripts. A prerendered page would carry inline
 * scripts without a nonce, which the strict policy blocks. Data fetches keep
 * their own `next.revalidate` caching.
 */
export default async function StrictCspLayout({ children }: { children: ReactNode }) {
  await connection();
  return children;
}
