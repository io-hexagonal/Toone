import type { Metadata } from "next";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import ProductShowcasePage from "@/components/showcases/ProductShowcasePage";
import { getProductGuidePage } from "@/lib/product-showcase";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = getProductGuidePage("");
  if (!page) return {};

  const canonical = "https://trytoone.com/en/how-to";
  return {
    // "How Toone works | Product guide" already carries the brand; the root
    // template used to append a second "| Toone" (audit P2-5).
    title: { absolute: `${page.title} | Product guide` },
    description: page.description,
    alternates: {
      canonical,
      languages: { en: canonical, "x-default": canonical },
    },
    robots: locale === "en" ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title: page.title,
      description: page.description,
      siteName: "Toone",
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

export default async function HowToOverview({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/how-to", searchParams);

  setRequestLocale(locale);
  const page = getProductGuidePage("");
  if (!page) throw new Error("Missing product guide overview");

  return <ProductShowcasePage locale={locale} page={page} />;
}
