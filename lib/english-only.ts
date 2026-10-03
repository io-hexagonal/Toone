import { permanentRedirect } from "next/navigation";

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Fallback for another locale's copy of an English-only page. proxy.ts
 * already answers those URLs with one 308 that keeps the query, so this runs
 * only if a request reaches the page anyway; it keeps the query too. Only
 * this branch reads `searchParams`, so the English page stays static.
 */
export async function redirectToEnglish(path: string, searchParams: PageSearchParams): Promise<never> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item);
    }
  }
  const search = query.toString();
  permanentRedirect(search ? `${path}?${search}` : path);
}
