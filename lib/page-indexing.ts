import { isIndexedLocale } from "@/i18n/indexing";

/**
 * Pages kept out of the index for now (indexing plan A3, A4, 2026-11-26), one
 * switch each. A page's `robots`, its sitemap entry and the site's links to it
 * all read the same flag, so reopening a page is this one change: indexable
 * pages never link a `noindex` URL (TECH-025), and a reopened page gets its
 * links and sitemap entry back with it.
 */

/**
 * `/en/business`: `noindex, follow` while it is a near-copy of the home page
 * (94-98% the same text on 2026-11-26). Read by app/[locale]/business/page.tsx.
 */
export const BUSINESS_LANDING_INDEXED = false;

/**
 * `/en/governance`: `noindex, follow` until it shows the approval step, Safe
 * Mode and the audit log with real screenshots. Read by
 * app/[locale]/governance/page.tsx.
 */
export const GOVERNANCE_PAGE_INDEXED = false;

/**
 * Whether a page may link the Business landing (the Personal / Business
 * switch). Indexed-locale pages link it only while it is indexed. The other
 * locales are `noindex` themselves (TECH-021), and `/business` itself shows
 * the switch so a visitor there can get back, so both keep it.
 */
export function linksBusinessLanding(locale: string, current?: "personal" | "business" | "any"): boolean {
  return BUSINESS_LANDING_INDEXED || !isIndexedLocale(locale) || current === "business";
}

/**
 * Whether a same-site path (`/en/governance`, `/en/business#faq`) is one of
 * the pages above while it is kept out of the index. Article and guide
 * Markdown keeps the words of such a link but drops the link, and listings
 * leave the page out, so the content can keep its links for when the page
 * reopens (TECH-025).
 */
export function isUnindexedPage(path: string): boolean {
  const page = path.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return (
    (!GOVERNANCE_PAGE_INDEXED && /^\/en\/governance$/.test(page)) ||
    (!BUSINESS_LANDING_INDEXED && /^\/en\/business$/.test(page))
  );
}
