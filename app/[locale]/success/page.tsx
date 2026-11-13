import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutReturn from "@/components/billing/CheckoutReturn";
import { STRIP_SESSION_ID_SCRIPT } from "@/components/billing/CheckoutReturn.helpers";
import { CHECKOUT_RETURN_STYLES } from "@/components/billing/CheckoutReturn.styles";
import { checkoutReturnMetadata } from "./return-metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "billing.success" });
  return checkoutReturnMetadata(locale, "/success", t("metaTitle"));
}

/**
 * Stripe returns here with `?session_id=`. The page is static and never reads
 * the query on the server; the inline script removes the id from the address
 * before any bundle or analytics runs, and the client confirms the purchase
 * from the account's entitlement.
 */
export default async function SuccessPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: STRIP_SESSION_ID_SCRIPT }} />
      <style dangerouslySetInnerHTML={{ __html: CHECKOUT_RETURN_STYLES }} />
      <CheckoutReturn />
    </>
  );
}
