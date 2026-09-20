import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/routing";
import { TooneLandingPage } from "../page";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const languages: Record<string, string> = {};

  for (const supportedLocale of locales) {
    languages[supportedLocale] = `https://trytoone.com/${supportedLocale}/business`;
  }
  languages["x-default"] = "https://trytoone.com/en/business";

  // Tag spec 2026-09-20 (final v1). English literals for now: the strings are
  // not yet translated, and shipping them under a `meta.*` key would force the
  // English copy onto all eight locales. Non-English /business still inherits
  // the shared site strings — tracked as the open half of audit P1-4.
  const isEnglish = locale === "en";
  const title = isEnglish
    ? "Toone for business | Governed AI routines for company operations"
    : `${t("siteTitle")} | Toone`;
  const description = isEnglish
    ? "Encode how your company works as routines that specialist agents run under human approval. See how teams pilot Toone on one recurring workflow first."
    : t("siteDescription");
  const ogTitle = isEnglish ? "Toone for business" : t("ogTitle");
  const ogDescription = isEnglish ? description : t("ogDescription");

  return {
    // `absolute` because the string already carries the brand; the root
    // template would otherwise double-brand it (audit P2-5).
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://trytoone.com/${locale}/business`,
      languages,
    },
    openGraph: {
      type: "website",
      url: `https://trytoone.com/${locale}/business`,
      title: ogTitle,
      description: ogDescription,
      siteName: "Toone",
      locale: locale === "en" ? "en_US" : locale,
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
