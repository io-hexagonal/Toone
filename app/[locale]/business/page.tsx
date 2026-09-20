import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TooneLandingPage } from "../page";

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Only English `/business` is a distinct, indexable canonical. The seven
 * non-English variants render the same translated landing copy as their locale
 * home (same H1, same description) — audit P1-4 / G2 follow-up 1. They keep
 * serving, but they canonicalise to the locale home so the duplicate signal
 * consolidates there, and they are dropped from the sitemap.
 *
 * TECH-010 consequence: a canonicalised URL must not be claimed as anyone's
 * hreflang alternate, so the `/business` hreflang set collapses to `en` +
 * `x-default` and the non-English variants emit no `languages` at all (the
 * locale-home set they consolidate into already carries all eight locales).
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
    : `${t("siteTitle")} | Toone`;
  const description = isEnglish
    ? "Encode how your company works as routines that specialist agents run under human approval. See how teams pilot Toone on one recurring workflow first."
    : t("siteDescription");
  const ogTitle = isEnglish ? "Toone for business" : t("ogTitle");
  const ogDescription = isEnglish ? description : t("ogDescription");

  const canonical = isEnglish ? ENGLISH_BUSINESS_URL : `https://trytoone.com/${locale}`;

  return {
    // `absolute` because the string already carries the brand; the root
    // template would otherwise double-brand it (audit P2-5).
    title: { absolute: title },
    description,
    alternates: isEnglish
      ? {
          canonical,
          languages: { en: ENGLISH_BUSINESS_URL, "x-default": ENGLISH_BUSINESS_URL },
        }
      : { canonical },
    openGraph: {
      type: "website",
      // og:url follows the canonical so the social graph consolidates with it.
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      siteName: "Toone",
      locale: isEnglish ? "en_US" : locale,
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
