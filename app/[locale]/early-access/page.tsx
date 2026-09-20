import WaitlistPage from "@/components/WaitlistPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: "landing" });
 // An access-code gate with no public user task: keep it crawlable for link
 // equity but out of the index (audit P1-3). It is also dropped from the
 // sitemap generator, which previously claimed 9 alternates for a page that
 // emits none.
 return {
  title: t("waitlistTitle"),
  description: t("waitlistSub"),
  alternates: { canonical: `https://trytoone.com/${locale}/early-access` },
  robots: { index: false, follow: true },
 };
}
export default async function EarlyAccess({ params }: Props) {
 const { locale } = await params;
 setRequestLocale(locale);
 return <WaitlistPage />;
}
