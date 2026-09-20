import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ProductShowcasePage from "@/components/showcases/ProductShowcasePage";
import { getProductGuidePage, getProductGuideSlugs } from "@/lib/product-showcase";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
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
  return {
    // Was "<Page> | Toone product guide | Toone" once the root template ran
    // (audit P2-5). One brand token, appended here.
    title: { absolute: `${page.title} | Toone product guide` },
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

export default async function HowToEntry({ params }: Props) {
  const { locale, slug: segments } = await params;
  const slug = segments.join("/");
  if (locale !== "en") permanentRedirect(`/en/how-to/${slug}`);

  const page = getProductGuidePage(slug);
  if (!page) notFound();

  setRequestLocale(locale);
  return <ProductShowcasePage locale={locale} page={page} />;
}
