import type { Metadata } from "next";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import ProductShowcasePage from "@/components/showcases/ProductShowcasePage";
import HowToSignInGate from "@/components/showcases/HowToSignInGate";
import { getProductGuidePage } from "@/lib/product-showcase";
import { GATED_GUIDE_METADATA, GUIDE_ROBOTS } from "@/lib/how-to-access";
import { hasSiteSession } from "@/lib/site-session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

// Signed-in accounts only (lib/site-session.ts): rendered per request, never
// prerendered, cached or indexed.
export async function generateMetadata(): Promise<Metadata> {
  if (!(await hasSiteSession())) return GATED_GUIDE_METADATA("/how-to");
  const page = getProductGuidePage("");
  if (!page) return {};

  const canonical = "https://trytoone.com/en/how-to";
  return {
    // "How Toone works | Product guide" already carries the brand; the root
    // template used to append a second "| Toone" (audit P2-5).
    title: { absolute: `${page.title} | Product guide` },
    description: page.description,
    alternates: { canonical },
    robots: GUIDE_ROBOTS,
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
  if (!(await hasSiteSession())) return <HowToSignInGate path="/how-to" />;

  const page = getProductGuidePage("");
  if (!page) throw new Error("Missing product guide overview");

  return <ProductShowcasePage locale={locale} page={page} />;
}
