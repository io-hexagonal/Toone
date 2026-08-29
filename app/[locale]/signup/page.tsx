import WaitlistPage from "@/components/WaitlistPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return {
    title: t("waitlistTitle"),
    description: t("waitlistSub"),
    alternates: { canonical: `https://trytoone.com/${locale}/signup` },
    robots: { index: false, follow: true },
  };
}

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WaitlistPage />;
}
