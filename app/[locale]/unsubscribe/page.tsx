import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import UnsubscribePage from "@/components/account/UnsubscribePage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return {
    title: t("unsubscribeTitle"),
    alternates: { canonical: `https://trytoone.com/${locale}/unsubscribe` },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function Unsubscribe({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountMessages><UnsubscribePage /></AccountMessages>;
}
