import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import LandingCanvas from "@/components/LandingCanvas";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #141622; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

            .overlay {
              position: fixed; left: 50%; top: 50%;
              transform: translate(-50%, 0);
              z-index: 10; display: flex; flex-direction: column;
              align-items: center; pointer-events: none;
              margin-top: 160px;
            }
            .actions { pointer-events: auto; display: flex; flex-direction: column; gap: 12px; align-items: center; }

            .dl-btn {
              display: flex; align-items: center; justify-content: center; gap: 10px;
              padding: 16px 32px; border-radius: 12px; min-width: 240px;
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.9); text-decoration: none;
              font-size: 14px; font-weight: 500; letter-spacing: 0.02em;
              transition: background 0.2s, border-color 0.2s, transform 0.15s;
              cursor: pointer; user-select: none;
            }
            .dl-btn:hover {
              background: rgba(255,255,255,0.14);
              border-color: rgba(255,255,255,0.25);
              transform: translateY(-1px);
            }
            .dl-btn:active { transform: translateY(0); }
            .dl-btn svg { width: 22px; height: 22px; fill: currentColor; flex-shrink: 0; margin-left: -2px; }
            .dl-btn .label { display: flex; flex-direction: column; line-height: 1.2; }
            .dl-btn .label small { font-size: 10px; opacity: 0.6; font-weight: 400; }

            .tooltip {
              position: absolute; top: 50%; left: calc(100% + 12px); transform: translateY(-50%);
              background: rgba(20,22,34,0.95); backdrop-filter: blur(16px);
              border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
              padding: 14px 18px; min-width: 220px;
              color: rgba(255,255,255,0.8); font-size: 12px; line-height: 1.6;
              opacity: 0; pointer-events: none;
              transition: opacity 0.2s;
              white-space: nowrap;
            }
            .tooltip::after {
              content: ''; position: absolute; top: 50%; right: 100%; transform: translateY(-50%);
              border: 6px solid transparent; border-right-color: rgba(255,255,255,0.12);
            }
            .dl-btn-wrap:hover .tooltip { opacity: 1; }

            .tooltip .req { display: flex; align-items: center; gap: 6px; }
            .tooltip .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.3); flex-shrink: 0; }
            .tooltip .title { font-weight: 600; margin-bottom: 6px; color: rgba(255,255,255,0.95); font-size: 13px; }

            .dl-btn-wrap { position: relative; overflow: hidden; border-radius: 12px; }
            .soon-ribbon {
              position: absolute; top: 10px; right: -28px;
              background: rgba(255,255,255,0.12);
              color: rgba(255,255,255,0.7);
              font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
              padding: 3px 32px;
              transform: rotate(35deg);
              pointer-events: none;
              z-index: 2;
            }

            .desktop-only { display: flex; }
            @media (max-width: 640px) {
              .desktop-only { display: none !important; }
              .overlay { padding-bottom: 15vh; }
              .actions { flex-direction: column; }
            }
          `,
        }}
      />

      <LandingCanvas />

      <Navigation />

      <div className="overlay">
        <div className="actions">
          {/* App Store (mobile) */}
          <div className="dl-btn-wrap">
            <span
              className="dl-btn"
              style={{ cursor: "default" }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="label">
                <small>{t("downloadOn")}</small>
                {t("appStore")}
              </span>
            </span>
            <span className="soon-ribbon">{t("soon")}</span>
          </div>

          {/* macOS Desktop */}
          <div className="dl-btn-wrap desktop-only">
            <a
              className="dl-btn"
              href="/Toone-1.0.3.dmg"
              target="_blank"
              rel="noopener"
            >
              <svg viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="label">
                <small>{t("downloadFor")}</small>
                {t("macOS")}
              </span>
            </a>
            <div className="tooltip">
              <div className="title">{t("requirements")}</div>
              <div className="req">
                <span className="dot" />
                {t("req1")}
              </div>
              <div className="req">
                <span className="dot" />
                {t("req2")}
              </div>
            </div>
          </div>

          {/* Product Hunt */}
          <div style={{ marginTop: 16 }}>
            <a
              href="https://www.producthunt.com/products/toone?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-toone"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                alt="Toone - AI teams that run your work | Product Hunt"
                width={250}
                height={54}
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1106020&theme=dark&t=1774512921035"
              />
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
