import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import ProductShowcasePage from "@/components/showcases/ProductShowcasePage";
import HowToSignInGate from "@/components/showcases/HowToSignInGate";
import { getProductGuidePage } from "@/lib/product-showcase";
import { GATED_GUIDE_METADATA, GUIDE_ROBOTS } from "@/lib/how-to-access";
import { hasSiteSession } from "@/lib/site-session";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: PageSearchParams;
};

// Signed-in accounts only (lib/site-session.ts): rendered per request, never
// prerendered, cached or indexed. Unknown slugs 404 only for signed-in
// requests, so the wall does not reveal which guides exist.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: segments } = await params;
  const slug = segments.join("/");
  if (!(await hasSiteSession())) return GATED_GUIDE_METADATA(`/how-to/${slug}`);
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
    alternates: { canonical },
    robots: GUIDE_ROBOTS,
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

  setRequestLocale(locale);
  if (!(await hasSiteSession())) return <HowToSignInGate path={`/how-to/${slug}`} />;

  const page = getProductGuidePage(slug);
  if (!page) notFound();

  return <ProductShowcasePage locale={locale} page={page} />;
}
