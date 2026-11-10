import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { CHECKOUT_RETURN_STYLES } from "@/components/billing/CheckoutReturn.styles";
import { checkoutReturnMetadata } from "../success/return-metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "billing.cancel" });
  return checkoutReturnMetadata(locale, "/cancel", t("metaTitle"));
}

/** Where a buyer lands after leaving Stripe Checkout without paying. */
export default async function CancelPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "billing.cancel" });
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CHECKOUT_RETURN_STYLES }} />
      <main className="pro-return">
        <Link href="/" aria-label="Toone" className="pro-return-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/brand/toone-mark.svg" alt="" />
          <span className="wm">toone</span>
        </Link>
        <div className="pro-return-card">
          <h1>{t("title")}</h1>
          <p>{t("sub")}</p>
          <Link className="pro-return-button" href="/pricing">{t("backToPricing")}</Link>
          <p className="pro-return-muted">
            {t("questions")} <Link href="/contact">{t("contact")}</Link>
          </p>
        </div>
      </main>
    </>
  );
}
