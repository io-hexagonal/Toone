import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingPlans from "@/components/billing/PricingPlans";
import { PRICING_CSS } from "@/components/billing/pricing-styles";
import { checkoutAvailable } from "@/components/billing/PricingPlans.helpers";
import { getBillingFeaturesOrOff, getPrices, type Price } from "@/lib/billing/api";
import { TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS, TOONE_PRO_FREE_ROUTINE_CREATIONS } from "@/lib/legal/terms";
import { pricingMetadata } from "./pricing-metadata";

/**
 * Prices and the checkout switch come from the API and are cached for five
 * minutes, so turning payments on or changing a price needs no redeploy.
 * The page never reads the query on the server; the plan cards do, in the
 * browser.
 */
export const revalidate = 300;
const CACHE = { next: { revalidate } } as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "billing.pricing" });
  return pricingMetadata(locale, t("metaTitle"), t("metaDescription", { free: TOONE_PRO_FREE_ROUTINE_CREATIONS }));
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "billing.pricing" });
  const [prices, features] = await Promise.all([
    getPrices(CACHE).catch((): Price[] => []),
    getBillingFeaturesOrOff(CACHE),
  ]);
  const checkoutEnabled = checkoutAvailable(features.stripe_pro_checkout, prices);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: PRICING_CSS,
        }}
      />
      <Navigation />
      <main className="pricing-page" data-page="pricing">
        <header className="pricing-head">
          <div className="pricing-eyebrow">{t("eyebrow")}</div>
          <h1>{t("title")}</h1>
          <p>{t("sub", { free: TOONE_PRO_FREE_ROUTINE_CREATIONS })}</p>
        </header>
        <ul className="pricing-includes">
          <li>{t("includeUnlimited")}</li>
          <li>{t("includeExplore")}</li>
          <li>{t("includeRuns")}</li>
        </ul>
        <PricingPlans
          prices={prices}
          checkoutEnabled={checkoutEnabled}
          paidEntry={features.paid_entry}
          freeCreations={TOONE_PRO_FREE_ROUTINE_CREATIONS}
          refundDays={TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS}
        />
      </main>
      <Footer />
    </>
  );
}
