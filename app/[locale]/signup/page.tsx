import AuthPage from "@/components/AuthPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return {
    title: t("signupTitle"),
    description: t("signupSub"),
    alternates: { canonical: `https://trytoone.com/${locale}/signup` },
    robots: { index: false, follow: true },
  };
}

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthPage mode="signup" />;
}
