import AuthPage from "@/components/AuthPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { openGraphLocale } from "@/i18n/open-graph";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("signupTitle"),
    description: t("signupOpenSub"),
    alternates: { canonical: `https://trytoone.com/${locale}/create-account` },
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: `https://trytoone.com/${locale}/create-account`, siteName: "Toone", ...openGraphLocale(locale, []) },
  };
}

/** Public sign-up: an emailed code proves the address, then the account is created. */
export default async function CreateAccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPage mode="signup" />;
}
