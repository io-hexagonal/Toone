import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { openGraphLocale } from "@/i18n/open-graph";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { TooneLandingPage } from "../page";
export { viewport } from "../page";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * No locale of `/business` is indexed. English renders the home page's
 * landing component with a different hero: on 2026-11-26 it was 94-98% the
 * same text as `/en` (indexing plan A3). It stays live for visitors and
 * links, `noindex, follow` with a self-canonical and no sitemap entry, until
 * it has content of its own. The seven non-English variants were already
 * `noindex, follow` (TECH-021). No hreflang.
 */
const ENGLISH_BUSINESS_URL = "https://trytoone.com/en/business";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  // Tag spec 2026-09-20 (final v1). English literals for now: the strings are
  // not yet translated, and shipping them under a `meta.*` key would force the
  // English copy onto all eight locales.
  const isEnglish = locale === "en";
  const title = isEnglish
    ? "Toone for business | Recurring company work as routines your team can check"
    : t("siteTitle"); // already carries the brand (Ahrefs F06)
  const description = isEnglish
    ? "Describe how a process works and Toone turns it into a routine on your Mac: scripts run the fixed steps, AI agents take the judgment calls, and steps that send, post or pay can wait for approval."
    : t("siteDescription");
  const ogTitle = isEnglish ? "Toone for business" : t("ogTitle");
  const ogDescription = isEnglish ? description : t("ogDescription");

  const canonical = isEnglish ? ENGLISH_BUSINESS_URL : `https://trytoone.com/${locale}/business`;

  return {
    // `absolute` because the string already carries the brand; the root
    // template would otherwise double-brand it (audit P2-5).
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: localeRobots(locale, false),
    other: localeVersions("/business"),
    openGraph: {
      type: "website",
      // og:url follows the canonical so the social graph consolidates with it.
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      siteName: "Toone",
      // No og:locale:alternate: no other language is declared either.
      ...openGraphLocale(locale, []),
      // Next shallow-merges metadata: a route-level `openGraph` replaces the
      // root object wholesale, so the images must be restated here or the
      // route ships without og:image (audit P2-6).
      images: [
        {
          url: "https://trytoone.com/assets/og/toone-og.png",
          width: 2400,
          height: 1260,
          alt: "Toone: The native workspace for agentic workflows.",
          type: "image/png",
        },
      ],
    },
  };
}

export default async function BusinessLandingPage(props: Props) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return TooneLandingPage({ ...props, audience: "business" });
}
