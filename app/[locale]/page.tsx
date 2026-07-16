import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import HeroAuth from "@/components/HeroAuth";
import StatementSection from "@/components/StatementSection";
import FaqSection from "@/components/FaqSection";
import TechStrip from "@/components/TechStrip";
import PartnerBand from "@/components/PartnerBand";
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
            html, body { width: 100%; overflow-x: hidden; background: #141413; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

            /* --- tech strip (substrate credibility) --- */
            .ts-wrap { position: relative; text-align: center; padding: 78px 0 0; }
            .ts-label {
              color: rgba(29,28,25,0.42); font-size: 10.5px; font-weight: 600;
              letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 24px;
            }
            .ts-row {
              display: flex; align-items: center; justify-content: center;
              gap: 14px 32px; flex-wrap: wrap; list-style: none;
            }
            .ts-item {
              display: flex; align-items: center; gap: 9px;
              color: rgba(29,28,25,0.55); font-size: 14.5px; font-weight: 500;
              letter-spacing: 0.01em; white-space: nowrap;
              text-decoration: none;
              transition: color 0.2s, opacity 0.2s;
            }
            .ts-item:hover { color: rgba(29,28,25,0.95); }
            .ts-icon {
              width: 19px; height: 19px; flex-shrink: 0; display: block;
            }
            /* Context7 ships only a full-colour raster tile; greyscale it so it
               sits with the monochrome marks, and it is a filled square so it
               reads heavier than the line marks at equal size. */
            .ts-raster {
              width: 17px; height: 17px; border-radius: 3px;
              filter: grayscale(1) brightness(0.4);
              opacity: 0.72; transition: filter 0.2s, opacity 0.2s;
            }
            .ts-item:hover .ts-raster { filter: none; opacity: 1; }
            @media (max-width: 640px) {
              .ts-row { gap: 12px 18px; }
              .ts-item { font-size: 12.5px; gap: 7px; }
              .ts-icon { width: 16px; height: 16px; }
              .ts-raster { width: 15px; height: 15px; }
            }
            /* The light editorial world: everything between the dark hero and
               the dark footer sits on cream with ink text. */
            .sections {
              position: relative; z-index: 5; background: #f0ede6; color: #1d1c19;
              padding: 0 24px 120px;
              overflow: hidden;
            }
            /* lantern wash — stops the section reading as one flat slab */
            .sections::before {
              content: ''; position: absolute; left: 50%; top: 300px;
              transform: translateX(-50%);
              width: 1200px; height: 760px; pointer-events: none;
              background: radial-gradient(ellipse at center,
                rgba(29,28,25,0.045) 0%, rgba(29,28,25,0.015) 42%, transparent 70%);
            }
            /* --- partner band (static: two real partners, no loop) --- */
            .pb-wrap { position: relative; text-align: center; padding: 66px 0 4px; }
            .pb-label {
              color: rgba(29,28,25,0.42); font-size: 11px; font-weight: 600;
              letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 36px;
            }
            .pb-row {
              display: flex; align-items: center; justify-content: center;
              gap: 54px; flex-wrap: wrap;
            }
            .pb-item {
              display: flex; align-items: center; justify-content: center; gap: 13px;
              height: 34px; text-decoration: none;
              opacity: 0.62; transition: opacity 0.25s;
              /* the partner marks are white-on-transparent assets; on cream
                 they render as ink silhouettes */
              filter: brightness(0);
            }
            a.pb-item:hover { opacity: 1; }
            .pb-sep { width: 1px; height: 26px; background: rgba(29,28,25,0.16); }
            .pb-foot { margin-top: 38px; }
            .pb-cta {
              display: inline-block; color: rgba(29,28,25,0.55); font-size: 13px;
              text-decoration: none; border-bottom: 1px solid rgba(29,28,25,0.2);
              padding-bottom: 2px; transition: color 0.2s, border-color 0.2s;
            }
            .pb-cta:hover { color: #1d1c19; border-color: rgba(29,28,25,0.5); }
            @media (max-width: 640px) {
              .pb-row { gap: 26px; }
              .pb-sep { display: none; }
              .pb-label { font-size: 10px; letter-spacing: 0.14em; }
            }

            .section { position: relative; max-width: 1000px; margin: 0 auto; padding-top: 104px; }
            .section h2 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              color: #1d1c19; font-size: 27px; font-weight: 600;
              letter-spacing: -0.02em; margin-bottom: 9px;
            }
            .section .sub { color: rgba(29,28,25,0.55); font-size: 14.5px; margin-bottom: 40px; }

            /* The pillars, as a numbered rail. A wrapping card grid left a hole
               and gave equal-weight boxes no reading order; the rail is ordered,
               ragged-free, and scales as the list grows. */
            .pillars { display: flex; flex-direction: column; gap: 10px; }
            .pillar {
              display: grid; grid-template-columns: 46px 1fr 1.25fr; gap: 26px;
              align-items: center; padding: 19px 26px 19px 20px;
              border: 1px solid rgba(29,28,25,0.1); border-radius: 14px;
              background: rgba(255,255,255,0.45);
              transition: border-color 0.28s, transform 0.28s;
            }
            .pillar:hover { border-color: rgba(29,28,25,0.32); transform: translateX(4px); }
            /* hexagon + lantern gradient: the mark's own geometry, reused */
            .phex {
              width: 40px; height: 44px;
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              background: rgba(29,28,25,0.08);
              display: flex; align-items: center; justify-content: center;
              color: rgba(29,28,25,0.6); font-size: 12.5px; font-weight: 700;
              transition: background 0.28s, color 0.28s;
            }
            .pillar:hover .phex {
              background: #141311;
              color: #f0ede6;
            }
            .pillar h3 {
              color: rgba(29,28,25,0.92); font-size: 15.5px; font-weight: 600;
              letter-spacing: -0.005em;
            }
            .pillar p { color: rgba(29,28,25,0.6); font-size: 14px; line-height: 1.6; }

            @media (max-width: 760px) {
              .pillar { grid-template-columns: 40px 1fr; gap: 14px 18px; padding: 18px; }
              .pillar p { grid-column: 2; }
              .phex { width: 34px; height: 38px; font-size: 11px; }
            }
          `,
        }}
      />

      <SiteHeader />

      <HeroAuth />

      <StatementSection />

      <div className="sections">
        <TechStrip />
        <PartnerBand />

        <section className="section" id="how">
          <h2>{t("pillarsTitle")}</h2>
          <p className="sub">{t("pillarsSub")}</p>
          <div className="pillars">
            {(
              [
                ["p1t", "p1d"],
                ["p2t", "p2d"],
                ["p3t", "p3d"],
                ["p4t", "p4d"],
                ["p5t", "p5d"],
                ["p6t", "p6d"],
                ["p7t", "p7d"],
              ] as const
            ).map(([titleKey, descKey], i) => (
              <div className="pillar" key={titleKey}>
                <div className="phex">{String(i + 1).padStart(2, "0")}</div>
                <h3>{t(titleKey)}</h3>
                <p>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <FaqSection />

      </div>

      <Footer />
    </>
  );
}
