import type { Metadata } from "next";
import { openGraphLocale } from "@/i18n/open-graph";
import { localeRobots, localeVersions } from "@/i18n/indexing";

export const PRICING_PATH = "/pricing";

/**
 * Pricing is a public page in every locale. Only English is indexed
 * (TECH-021): the other seven serve `noindex, follow` with a self-canonical
 * and no hreflang. `/en/pricing` is listed in the sitemap.
 */
export function pricingMetadata(locale: string, title: string, description: string): Metadata {
  const canonical = `https://trytoone.com/${locale}${PRICING_PATH}`;
  return {
    // The title carries the brand already; `absolute` avoids "| Toone" twice.
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: localeRobots(locale),
    other: localeVersions(PRICING_PATH),
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "Toone",
      ...openGraphLocale(locale, []),
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}
