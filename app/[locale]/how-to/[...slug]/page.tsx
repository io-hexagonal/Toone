import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import ProductShowcasePage from "@/components/showcases/ProductShowcasePage";
import { getProductGuidePage, getProductGuideSlugs } from "@/lib/product-showcase";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: PageSearchParams;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getProductGuideSlugs().map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: segments } = await params;
  const slug = segments.join("/");
  const page = getProductGuidePage(slug);
  if (!page) return {};

  const canonical = `https://trytoone.com/en/how-to/${slug}`;
  // Was "<Page> | Toone product guide | Toone" once the root template ran
  // (audit P2-5). One brand token, appended here, and none when the page
  // title already names Toone (F33).
  const suffix = /toone/i.test(page.title) ? "Product guide" : "Toone product guide";
  return {
    title: { absolute: `${page.title} | ${suffix}` },
    description: page.description,
    alternates: {
      canonical,
      languages: { en: canonical, "x-default": canonical },
    },
    robots: locale === "en" ? undefined : { index: false, follow: true },
    openGraph: {
      type: "article",
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

export default async function HowToEntry({ params, searchParams }: Props) {
  const { locale, slug: segments } = await params;
  const slug = segments.join("/");
  if (locale !== "en") await redirectToEnglish(`/en/how-to/${slug}`, searchParams);

  const page = getProductGuidePage(slug);
  if (!page) notFound();

  setRequestLocale(locale);
  return <ProductShowcasePage locale={locale} page={page} />;
}
