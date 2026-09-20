import AuthPage from "@/components/AuthPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: "auth" });
 // An access-code gate with no public user task: keep it crawlable for link
 // equity but out of the index (audit P1-3). It is also dropped from the
 // sitemap generator, which previously claimed 9 alternates for a page that
 // emits none.
 return {
  title: t("inviteCodeTitle"),
  description: t("inviteCodeSub"),
  alternates: { canonical: `https://trytoone.com/${locale}/early-access` },
  robots: { index: false, follow: true },
  // og:url follows the canonical (R7) instead of inheriting the locale home.
  openGraph: { type: "website", url: `https://trytoone.com/${locale}/early-access`, siteName: "Toone" },
 };
}
export default async function EarlyAccess({ params }: Props) {
 const { locale } = await params;
 setRequestLocale(locale);
 return <AuthPage mode="invite" />;
}
