import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import RedeemPage from "@/components/account/RedeemPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return {
    title: t("redeemTitle"),
    alternates: { canonical: `https://trytoone.com/${locale}/redeem` },
    robots: { index: false, follow: false },
    // The code travels in the fragment, which is never sent; no referrer either.
    referrer: "no-referrer",
  };
}

export default async function Redeem({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountMessages><RedeemPage /></AccountMessages>;
}
