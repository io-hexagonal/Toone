import AuthPage from "@/components/AuthPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("signinTitle"),
    description: t("signinSub"),
    alternates: { canonical: `https://trytoone.com/${locale}/signin` },
    robots: { index: false, follow: true },
  };
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPage mode="signin" />;
}
