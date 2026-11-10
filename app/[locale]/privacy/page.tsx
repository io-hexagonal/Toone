import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { localeRobots, localeVersions } from "@/i18n/indexing";
import { redirectToEnglish, type PageSearchParams } from "@/lib/english-only";
import TrustPage from "@/components/TrustPage";
import { PRIVACY_CANONICAL, PRIVACY_UPDATED_DATE } from "@/lib/legal/privacy";
import { TOONE_PRO_SELLER } from "@/lib/legal/seller";
import PrivacyContent from "./PrivacyContent";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: PageSearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Privacy Policy",
    description:
      "How Toone handles website, account, product, payment, and analytics data, who receives it, how long it is kept, and how to exercise your rights.",
    alternates: { canonical: PRIVACY_CANONICAL },
    robots: localeRobots(locale),
    other: localeVersions("/privacy", ["en"]),
    // R7: og:url must equal the canonical. Without a route-level `openGraph`
    // this page inherited the root layout's card, whose og:url is the locale
    // home, so the shared URL and the canonical disagreed.
    openGraph: {
      type: "website",
      url: PRIVACY_CANONICAL,
      title: "Privacy Policy",
      description: "How Toone handles website, account, product, payment, and analytics data, and what stays on your Mac.",
      siteName: "Toone",
      images: ["https://trytoone.com/assets/og/toone-og.png"],
    },
  };
}

export default async function PrivacyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== "en") await redirectToEnglish("/en/privacy", searchParams);
  setRequestLocale(locale);

  return (
    <TrustPage
      eyebrow="Legal"
      title="Privacy Policy"
      lede="Toone keeps your organization files and working context on your Mac. This policy covers the information that does reach Toone: your account, the website, Toone Pro purchases, and the features that send information off your Mac."
      updated={PRIVACY_UPDATED_DATE}
      updatedLabel="Updated"
    >
      <PrivacyContent seller={TOONE_PRO_SELLER} />
    </TrustPage>
  );
}
