import ResetPasswordPage from "@/components/ResetPasswordPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { openGraphLocale } from "@/i18n/open-graph";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.reset" });
  return {
    title: t("title"),
    description: t("sub"),
    alternates: { canonical: `https://trytoone.com/${locale}/reset-password` },
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: `https://trytoone.com/${locale}/reset-password`, siteName: "Toone", ...openGraphLocale(locale, []) },
  };
}

export default async function ResetPasswordRoute({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ResetPasswordPage />;
}
