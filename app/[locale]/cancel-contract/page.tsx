import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import ContractRequestPage from "@/components/account/ContractRequestPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return {
    title: t("contractTitle"),
    description: t("contractDescription"),
    alternates: { canonical: `https://trytoone.com/${locale}/cancel-contract` },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function CancelContract({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountMessages><ContractRequestPage /></AccountMessages>;
}
