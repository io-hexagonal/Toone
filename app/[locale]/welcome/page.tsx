import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OnboardingForm from "@/components/OnboardingForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.onboarding" });
  return {
    robots: { index: false, follow: false },
    title: t("metaTitle"),
    alternates: { canonical: `https://trytoone.com/${locale}/welcome` },
  };
}

export default async function WelcomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth.onboarding" });
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ob-page {
              min-height: 100vh; max-width: 640px; margin: 0 auto;
              padding: var(--site-hero-top) 24px 120px; color: rgba(255,255,255,0.94);
            }
            .ob-head { text-align: center; margin: 0 0 40px; }
            .ob-head h1 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-size: clamp(34px, 5vw, 48px); line-height: 1.05; letter-spacing: -0.035em; margin: 0 0 12px;
            }
            .ob-head p { margin: 0; color: rgba(255,255,255,0.55); font-size: 17px; line-height: 1.6; }
            .ob-form {
              display: flex; flex-direction: column; gap: 28px; padding: 32px;
              border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; background: rgba(255,255,255,0.035);
            }
            .ob-form fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
            .ob-form legend { padding: 0; margin: 0 0 12px; font-size: 16px; font-weight: 600; }
            .ob-form legend span { margin-left: 8px; color: rgba(255,255,255,0.42); font-size: 13px; font-weight: 400; }
            .ob-chips { display: flex; flex-wrap: wrap; gap: 8px; }
            .ob-chip {
              height: 36px; padding: 0 15px; border-radius: 999px; cursor: pointer;
              border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.03);
              color: rgba(255,255,255,0.78); font: inherit; font-size: 14px; font-weight: 500;
              transition: background-color .15s ease, border-color .15s ease, color .15s ease;
            }
            .ob-chip:hover { border-color: rgba(255,255,255,0.36); color: #fff; }
            .ob-chip[aria-pressed="true"] { background: #f0ede6; border-color: #f0ede6; color: #1d1c19; }
            .ob-chip:focus-visible, .ob-continue:focus-visible, .ob-skip:focus-visible { outline: 2px solid #f0ede6; outline-offset: 2px; }
            .ob-actions { display: flex; align-items: center; gap: 18px; margin-top: 4px; }
            .ob-continue {
              border: 0; border-radius: 12px; padding: 13px 26px; cursor: pointer;
              background: #f0ede6; color: #1d1c19; font: inherit; font-weight: 650;
            }
            .ob-continue:disabled { opacity: .45; cursor: default; }
            .ob-skip { border: 0; background: none; padding: 0; cursor: pointer; color: rgba(255,255,255,0.6); font: inherit; font-size: 14px; }
            .ob-skip:hover { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
          `,
        }}
      />
      <Navigation />
      <main className="ob-page" data-page="welcome">
        <header className="ob-head">
          <h1>{t("title")}</h1>
          <p>{t("sub")}</p>
        </header>
        <OnboardingForm />
      </main>
      <Footer />
    </>
  );
}
