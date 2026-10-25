import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { openGraphLocale } from "@/i18n/open-graph";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { TooneLandingPage } from "../page";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Only English `/business` is indexed. The seven non-English variants render
 * the same translated landing copy as their locale home (audit P1-4). They
 * keep serving, `noindex, follow` with a self-canonical like every other
 * non-English page (TECH-021); they used to canonicalise to the locale home
 * while staying `index, follow`, which sent two conflicting signals (audit
 * H2). No hreflang: English is the only indexed locale.
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
    ? "Toone for business | Governed AI routines for company operations"
    : t("siteTitle"); // already carries the brand (Ahrefs F06)
  const description = isEnglish
    ? "Encode how your company works as routines that specialist agents run under human approval. See how teams pilot Toone on one recurring workflow first."
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
    robots: localeRobots(locale),
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
