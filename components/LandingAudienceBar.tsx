"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export type LandingAudience = "personal" | "business";

type Props = {
  activeAudience: LandingAudience;
};

const AUDIENCES = [
  { id: "personal", href: "/", labelKey: "audiencePersonal" },
  { id: "business", href: "/business", labelKey: "audienceBusiness" },
] as const;

/**
 * A slim product-audience rail modelled on Truleaf's Botanics / Academia /
 * Biologicals R&D switcher. Each audience owns a real route so its landing
 * content and metadata can evolve independently.
 */
export default function LandingAudienceBar({ activeAudience }: Props) {
  const t = useTranslations("landing");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .landing-audience-bar {
              position: relative; z-index: 50;
              width: 100%; height: 36px;
              border-bottom: 1px solid rgba(29,28,25,0.12);
              background: #f0ede6;
            }
            .landing-audience-inner {
              width: min(1080px, calc(100% - 32px)); height: 100%;
              margin: 0 auto; display: flex; align-items: center;
            }
            .landing-audience-tabs {
              display: flex; align-items: center; gap: 4px;
            }
            .landing-audience-tab {
              display: inline-flex; align-items: center;
              border-radius: 999px; padding: 5px 12px;
              color: rgba(29,28,25,0.52); font-size: 12px;
              font-weight: 500; line-height: 1; text-decoration: none;
              transition: color 0.2s ease, background-color 0.2s ease;
            }
            a.landing-audience-tab:hover {
              color: #1d1c19; background: rgba(29,28,25,0.06);
            }
            .landing-audience-tab[aria-selected="true"] {
              color: #1d1c19; font-weight: 600;
              background: rgba(29,28,25,0.09);
            }
            @media (max-width: 640px) {
              .landing-audience-inner { width: calc(100% - 24px); }
              .landing-audience-tab { padding-inline: 10px; font-size: 11.5px; }
            }
          `,
        }}
      />

      <div className="landing-audience-bar">
        <div className="landing-audience-inner">
          <nav
            className="landing-audience-tabs"
            role="tablist"
            aria-label={t("audienceLabel")}
          >
            {AUDIENCES.map((audience) => {
              const selected = activeAudience === audience.id;

              if (selected) {
                return (
                  <span
                    key={audience.id}
                    className="landing-audience-tab"
                    role="tab"
                    aria-selected="true"
                  >
                    {t(audience.labelKey)}
                  </span>
                );
              }

              return (
                <Link
                  key={audience.id}
                  className="landing-audience-tab"
                  href={audience.href}
                  role="tab"
                  aria-selected="false"
                >
                  {t(audience.labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
