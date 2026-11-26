import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { PrivacyChoicesButton } from "@/components/PrivacyChoices";
import LocalePicker from "@/components/LocalePicker";
import CreateAccountLink from "@/components/CreateAccountLink";
import SignedInLink from "@/components/SignedInLink";
import SignedOutLink from "@/components/SignedOutLink";
import PricingLink from "@/components/billing/PricingLink";
import { TRADER_DETAILS_COMPLETE } from "@/lib/legal/trader";

/**
 * Site footer — dark ground closing the dark–cream–dark rhythm.
 * Brand lockup + legal on the left, three link columns on the right.
 * Anchor links return to the active Personal or Business landing route.
 */
type Props = {
  landingPath?: "/" | "/business";
};

export default async function Footer({
  landingPath = "/",
}: Props) {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const nav = await getTranslations("nav");
  const billing = await getTranslations("billing");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ftr {
              position: relative; z-index: 5;
              background: #1d1c19; color: rgba(255,255,255,0.55);
              border-top: 1px solid rgba(255,255,255,0.08);
              padding: 60px 24px 72px;
            }
            .ftr-wrap {
              max-width: var(--site-max, 1080px); margin: 0 auto;
              display: flex; justify-content: space-between; gap: 48px; flex-wrap: wrap;
            }
            .ftr-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
            .ftr-brand img { width: 26px; height: 26px; display: block; }
            .ftr-brand .wm {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.03em; text-transform: lowercase;
              color: rgba(255,255,255,0.92); font-size: 19px;
            }
            .ftr-legal { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.64); }

            .ftr-lang { margin-top: 16px; }
            .ftr-cols { display: flex; gap: 64px; flex-wrap: wrap; }
            @media (max-width: 720px) { .ftr-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px 24px; } }
            .ftr-heading {
              font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5);
              margin-bottom: 14px;
            }
            .ftr-cols a {
              display: block; color: rgba(255,255,255,0.62); text-decoration: none;
              font-size: 13.5px; margin-bottom: 9px; transition: color 0.2s;
            }
            .ftr-cols a:hover { color: rgba(255,255,255,0.95); }
            .ftr-privacy-choice {
              display: block; padding: 0; border: 0; background: none;
              color: rgba(255,255,255,0.62); font: inherit;
              font-size: 13.5px; cursor: pointer; margin-bottom: 9px; text-align: left;
            }
            .ftr-privacy-choice:hover, .ftr-privacy-choice:focus-visible {
              color: rgba(255,255,255,0.95); text-decoration: underline;
            }
            @media (max-width: 640px) {
              .ftr-wrap { flex-direction: column; }
              .ftr-cols { gap: 40px; }

            }
          `,
        }}
      />
      <footer className="ftr">
        <div className="ftr-wrap">
          <div>
            <Link href={landingPath} aria-label="Toone" className="ftr-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/brand/toone-mark.svg" alt="" />
              <span className="wm">toone</span>
            </Link>
            <div className="ftr-legal">
              © {new Date().getFullYear()} Toone. {t("rights")}
            </div>

            <div className="ftr-lang">
              <LocalePicker placement="footer" />
            </div>
          </div>
          <div className="ftr-cols">
            <div>
              <p className="ftr-heading">{t("product")}</p>
              <Link href={`${landingPath}#how-it-works`}>{t("how")}</Link>
              <Link href="/compare">{t("compare")}</Link>
              <Link href={`${landingPath}#faq`}>FAQ</Link>
              <PricingLink href="/pricing">{billing("nav")}</PricingLink>
              <CreateAccountLink className="ftr-download" placement="footer">{nav("download")}</CreateAccountLink>
            </div>
            <div>
              <p className="ftr-heading">{t("proof")}</p>
              <Link href="/explore">{nav("explore")}</Link>
              <Link href="/resources">{nav("resources")}</Link>
              <Link href="/journal">{nav("journal")}</Link>
              <a href="/en/governance">{nav("governance")}</a>
              <SignedInLink href="/how-to">{nav("howTo")}</SignedInLink>
            </div>
            <div>
              <p className="ftr-heading">{t("company")}</p>
              <Link href="/about">{t("about")}</Link>
              <Link href="/editorial-policy">{t("editorialPolicy")}</Link>
              <SignedOutLink href="/signin">{nav("signin")}</SignedOutLink>
              <Link href="/contact">{t("contact")}</Link>
            </div>
            <div>
              <p className="ftr-heading">{t("legal")}</p>
              <Link href="/privacy">{t("privacy")}</Link>
              <PrivacyChoicesButton className="ftr-privacy-choice" />
              <Link href="/terms">{t("terms")}</Link>
              {/* German pages: the withdrawal function and the cancel button (§312k BGB) on every page,
                  signed in or not, whatever the billing flags say. Other locales link the same page
                  from the pricing page, the account page and the purchase email. */}
              {locale === "de" && <Link href="/cancel-contract?kind=withdraw">{t("withdrawContract")}</Link>}
              {locale === "de" && <Link href="/cancel-contract?kind=cancel">{t("cancelContract")}</Link>}
              {/* English-only page; its label stays English in every locale. Hidden until the trader details are complete. */}
              {TRADER_DETAILS_COMPLETE && <Link href="/legal-notice">Legal notice</Link>}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
