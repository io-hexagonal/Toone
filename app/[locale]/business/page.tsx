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

  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
    alternates: {
      canonical: `https://trytoone.com/${locale}/business`,
      languages,
    },
    openGraph: {
      url: `https://trytoone.com/${locale}/business`,
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function BusinessLandingPage(props: Props) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  return TooneLandingPage({ ...props, audience: "business" });
}
