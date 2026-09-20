import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AuthenticatedDownloadGrid from "@/components/AuthenticatedDownloadGrid";
import { locales } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "downloadPage" });
  const url = `https://trytoone.com/${locale}/downloads`;
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((language) => [
      language,
      `https://trytoone.com/${language}/downloads`,
    ]),
  );
  languages["x-default"] = "https://trytoone.com/en/downloads";

  return {
    robots: { index: false, follow: false },
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: url, languages },
    // og:url follows the canonical (R7) instead of inheriting the locale home.
    openGraph: { type: "website", url, siteName: "Toone" },
  };
}

export default async function DownloadPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "downloadPage" });
  const landing = await getTranslations({ locale, namespace: "landing" });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .download-page {
              min-height: 100vh; max-width: 980px; margin: 0 auto;
              padding: 132px 24px 120px; color: rgba(255,255,255,0.94);
            }
            .download-head { text-align: center; margin: 0 auto 54px; max-width: 700px; }
            .download-eyebrow {
              color: rgba(255,255,255,0.34); font-size: 11px; font-weight: 650;
              letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 16px;
            }
            .download-head h1 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: clamp(38px, 5vw, 58px); line-height: 1.04;
              letter-spacing: -0.035em; margin: 0 0 16px;
            }
            .download-head p {
              color: rgba(255,255,255,0.5); font-size: 17px;
              line-height: 1.6; margin: 0 auto; max-width: 58ch;
            }
            .download-language {
              max-width: 62ch; margin: -28px auto 32px; text-align: center;
              color: rgba(255,255,255,0.72); font-size: 13px; line-height: 1.55;
            }
            .download-grid {
              display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 20px;
            }
            .download-card {
              display: flex; flex-direction: column; min-height: 330px;
              border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
              background: rgba(255,255,255,0.035); padding: 32px;
            }
            .download-card.liquid {
              background:
                radial-gradient(circle at 75% 5%, rgba(124,190,255,0.18), transparent 42%),
                rgba(255,255,255,0.045);
              border-color: rgba(174,219,255,0.24);
            }
            .download-badge {
              align-self: flex-start; border-radius: 999px; padding: 6px 10px;
              background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.58);
              font-size: 10px; font-weight: 650; letter-spacing: 0.11em;
              text-transform: uppercase; margin-bottom: 24px;
            }
            .download-card-head {
              display: flex; align-items: center; gap: 16px; margin-bottom: 12px;
            }
            .download-appicon {
              width: 56px; height: 56px; border-radius: 13px;
              box-shadow: 0 4px 18px rgba(0,0,0,0.35);
            }
            .download-card h2 {
              font-size: 27px; letter-spacing: -0.025em; margin: 0;
            }
            .download-requirement {
              display: flex; align-items: center; gap: 7px;
              color: rgba(255,255,255,0.42); font-size: 13px; margin-bottom: 20px;
            }
            .download-requirement svg {
              width: 13px; height: 13px; flex-shrink: 0;
              fill: rgba(255,255,255,0.42);
            }
            .download-card p {
              color: rgba(255,255,255,0.54); font-size: 15px; line-height: 1.6;
              margin: 0 0 28px;
            }
            .download-button {
              margin-top: auto; display: flex; justify-content: center;
              align-items: center; border-radius: 12px; padding: 14px 18px;
              border: 0; background: #f0ede6; color: #1d1c19; text-decoration: none;
              font-weight: 650; transition: transform 0.16s ease;
              cursor: pointer; font: inherit;
            }
            .download-button:hover { transform: translateY(-2px); }
            .download-button:disabled { cursor: default; opacity: .65; transform: none; }
            .download-card.liquid .download-button {
              background: rgba(206,232,255,0.94);
            }
            .download-note {
              color: rgba(255,255,255,0.58); text-align: center;
              font-size: 12px; line-height: 1.6; margin-top: 28px;
            }
            .download-access {
              max-width: 430px; margin: 0 auto; padding: 30px;
              border: 1px solid rgba(255,255,255,.11); border-radius: 20px;
              background: rgba(255,255,255,.035); text-align: center;
            }
            .download-access h2 { margin: 0 0 8px; font-size: 24px; }
            .download-access p { margin: 0 0 22px; color: rgba(255,255,255,.56); }
            .download-access .download-button { width: 100%; }
            .download-waitlist-link {
              display: inline-block; margin-top: 17px; color: rgba(255,255,255,.72);
              font-size: 13px; text-decoration: none;
            }
            .download-waitlist-link:hover { text-decoration: underline; }
            .download-error { color: rgba(255,138,122,.95); text-align: center; margin: 20px 0 0; }
            @media (max-width: 720px) {
              .download-page { padding-top: 110px; }
              .download-grid { grid-template-columns: 1fr; }
              .download-card { min-height: 290px; }
            }
          `,
        }}
      />
      <Navigation />
      <main className="download-page">
        <header className="download-head">
          <div className="download-eyebrow">{t("eyebrow")}</div>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </header>


        {locale !== "en" && (
          <p className="download-language">{landing("productLanguageDisclosure")}</p>
        )}

        <AuthenticatedDownloadGrid
          copy={{
            choicesLabel: t("choicesLabel"),
            standardBadge: t("standardBadge"),
            standardTitle: t("standardTitle"),
            standardRequirement: t("standardRequirement"),
            standardDescription: t("standardDescription"),
            standardButton: t("standardButton"),
            liquidBadge: t("liquidBadge"),
            liquidTitle: t("liquidTitle"),
            liquidRequirement: t("liquidRequirement"),
            liquidDescription: t("liquidDescription"),
            liquidButton: t("liquidButton"),
          }}
        />

        <p className="download-note">{t("compatibilityNote")}</p>

      </main>
      <Footer />
    </>
  );
}
