import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AccountMessages from "@/components/account/AccountMessages";
import ContractConfirmPage from "@/components/account/ContractConfirmPage";
import { STRIP_CONTRACT_TOKEN_SCRIPT } from "@/components/account/contract-confirm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return {
    title: t("contractConfirmTitle"),
    alternates: { canonical: `https://trytoone.com/${locale}/cancel-contract/confirm` },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

/**
 * The emailed link lands here with `#token=…`. The page is static: the token
 * never reaches the server, the inline script removes it from the address
 * before any bundle or analytics runs, and nothing happens until the visitor
 * clicks Confirm (mail scanners open links).
 */
export default async function CancelContractConfirm({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: STRIP_CONTRACT_TOKEN_SCRIPT }} />
      <AccountMessages><ContractConfirmPage /></AccountMessages>
    </>
  );
}
