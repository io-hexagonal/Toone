import type { Metadata } from "next";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import { setRequestLocale } from "next-intl/server";
import TrustPage from "@/components/TrustPage";
import { TERMS_CANONICAL, TERMS_UPDATED_DATE } from "@/lib/legal/terms";
import { loadSeller } from "@/lib/legal/current-seller";
import TermsContent from "./TermsContent";

/** The seller model comes from the API (cached like the pricing page), so a switch needs no redeploy. */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }>; searchParams: PageSearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    // Root template appends "| Toone"; the brand stays out of this title (F33).
    title: "Terms and Licenses",
    description:
      "License terms for Toone from the Mac App Store and Toone downloaded directly, and the terms for buying Toone Pro, the free plan, and redeemable codes.",
    alternates: { canonical: TERMS_CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/terms", ["en"]),
    openGraph: {
      type: "website",
      url: TERMS_CANONICAL,
      title: "Toone Terms and Licenses",
      description:
        "License information for the Mac App Store and direct editions of Toone, and the terms for Toone Pro.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function TermsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/terms", searchParams);
  setRequestLocale(locale);
  const seller = await loadSeller();

  return (
    <TrustPage
      eyebrow="Legal"
      title="Toone Terms and Licenses"
      lede="The license for Toone depends on where you obtained the app. Toone Pro, the optional upgrade, has its own purchase terms below."
      updated={TERMS_UPDATED_DATE}
      updatedLabel="Updated"
    >
      <TermsContent seller={seller} />
    </TrustPage>
  );
}
