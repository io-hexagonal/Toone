import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingPlans from "@/components/billing/PricingPlans";
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
          __html: `
            .pricing-page {
              min-height: 100vh; max-width: 1040px; margin: 0 auto;
              padding: var(--site-hero-top) 24px 120px; color: rgba(255,255,255,0.94);
            }
            .pricing-head { text-align: center; margin: 0 auto 48px; max-width: 700px; }
            .pricing-eyebrow {
              color: rgba(255,255,255,0.34); font-size: 11px; font-weight: 650;
              letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 16px;
            }
            .pricing-head h1 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: clamp(36px, 5vw, 56px); line-height: 1.04;
              letter-spacing: -0.035em; margin: 0 0 16px; text-wrap: balance;
            }
            .pricing-head p {
              color: rgba(255,255,255,0.55); font-size: 17px;
              line-height: 1.6; margin: 0 auto; max-width: 58ch;
            }
            .pricing-includes {
              display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 22px;
              list-style: none; padding: 0; margin: 0 auto 40px; max-width: 820px;
              color: rgba(255,255,255,0.7); font-size: 14px;
            }
            .pricing-includes li::before { content: "✓"; margin-right: 8px; color: rgba(174,219,255,0.9); }
            .pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
            .pricing-card {
              position: relative; display: flex; flex-direction: column; min-height: 280px;
              border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
              background: rgba(255,255,255,0.035); padding: 30px;
            }
            .pricing-card.selected {
              border-color: rgba(174,219,255,0.36);
              background:
                radial-gradient(circle at 75% 5%, rgba(124,190,255,0.16), transparent 45%),
                rgba(255,255,255,0.045);
            }
            .pricing-badge {
              position: absolute; top: 18px; right: 18px; border-radius: 999px; padding: 5px 10px;
              background: rgba(206,232,255,0.14); color: rgba(206,232,255,0.92);
              font-size: 10px; font-weight: 650; letter-spacing: 0.11em; text-transform: uppercase;
            }
            .pricing-card h2 { font-size: 22px; letter-spacing: -0.02em; margin: 0 0 14px; }
            .pricing-price { margin: 0 0 10px; }
            .pricing-amount {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: 38px; font-weight: 600; letter-spacing: -0.03em;
            }
            .pricing-per { color: rgba(255,255,255,0.5); font-size: 14px; }
            .pricing-desc { color: rgba(255,255,255,0.56); font-size: 15px; line-height: 1.55; margin: 0 0 26px; }
            .pricing-button {
              margin-top: auto; display: flex; justify-content: center; align-items: center;
              border-radius: 12px; padding: 14px 18px; border: 0;
              background: #f0ede6; color: #1d1c19; text-decoration: none;
              font: inherit; font-weight: 650; cursor: pointer; transition: transform 0.16s ease;
            }
            .pricing-button:hover { transform: translateY(-2px); }
            .pricing-button:disabled { cursor: default; opacity: .6; transform: none; }
            .pricing-owned {
              margin: auto 0 0; padding: 13px 16px; border-radius: 12px; text-align: center;
              border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.62); font-size: 14px;
            }
            .pricing-account, .pricing-notice, .pricing-soon, .pricing-error {
              max-width: 640px; margin: 28px auto 0; text-align: center; font-size: 14px; line-height: 1.6;
            }
            .pricing-account p { margin: 0 0 6px; color: rgba(255,255,255,0.8); }
            .pricing-notice {
              margin: 0 auto 28px; padding: 12px 16px; border-radius: 12px;
              background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.82);
            }
            .pricing-soon {
              margin: 0 auto 32px; padding: 26px; border-radius: 20px;
              border: 1px solid rgba(255,255,255,.11); background: rgba(255,255,255,.035);
            }
            .pricing-soon h2 { margin: 0 0 8px; font-size: 22px; }
            .pricing-soon p { margin: 0; color: rgba(255,255,255,.56); }
            .pricing-error { color: rgba(255,138,122,.95); }
            .pricing-muted, .pricing-account .pricing-muted { color: rgba(255,255,255,0.5); }
            .pricing-link {
              background: none; border: 0; padding: 0; font: inherit; cursor: pointer;
              color: rgba(255,255,255,0.9); text-decoration: underline; text-underline-offset: 3px;
            }
            .pricing-terms {
              list-style: none; padding: 0; margin: 40px auto 0; max-width: 680px; text-align: center;
              color: rgba(255,255,255,0.48); font-size: 12.5px; line-height: 1.7;
            }
            .pricing-terms a { color: rgba(255,255,255,0.8); text-underline-offset: 3px; }
            @media (max-width: 860px) {
              .pricing-grid { grid-template-columns: 1fr; }
              .pricing-card { min-height: 0; }
            }
          `,
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
          freeCreations={TOONE_PRO_FREE_ROUTINE_CREATIONS}
          refundDays={TOONE_PRO_FIRST_PAYMENT_REFUND_DAYS}
        />
      </main>
      <Footer />
    </>
  );
}
