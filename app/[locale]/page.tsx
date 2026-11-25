import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import { localeVersions } from "@/i18n/indexing";
import SiteHeader from "@/components/SiteHeader";
import HeroLanding from "@/components/HeroLanding";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";
import ResourcesSection from "@/components/ResourcesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BuiltDifferentlySection from "@/components/BuiltDifferentlySection";
import OutcomesSection from "@/components/OutcomesSection";
import ClosingCtaBand from "@/components/ClosingCtaBand";
import type { LandingAudience } from "@/components/LandingAudienceBar";
import BlackFridayMarquee from "@/components/BlackFridayMarquee";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
    // The home exists in every locale; the language links use this map.
    other: localeVersions(""),
  };
}

/**
 * Safari (and Chrome where it tints) colours its toolbar from theme-color.
 * The landing opens with the Black Friday strip in the page's ink, so the
 * bar matches it; once the strip retires, its script switches the colour to
 * the light hero's (#f9f8f5).
 */
export const viewport: Viewport = { themeColor: "#1d1c19" };

type TooneLandingPageProps = Props & {
  audience: LandingAudience;
};

/**
 * Shared landing for Personal and Business (only the hero copy differs).
 * Each section answers the next question a visitor has, in order:
 *
 *   hero            what is it?
 *   how it works    what does it look like on my work? (scripts + agents, live)
 *   built different why automate this way, and not with node automation
 *                   or an agent on a timer?
 *   what you get    what changes for me?
 *   resources       where do I learn more?
 *   start small     how risky is it to try?
 *   FAQ             the objections left
 */
export async function TooneLandingPage({
  params,
  audience,
}: TooneLandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const landingPath = audience === "business" ? "/business" : "/";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; overflow-x: hidden; overflow-x: clip; }
            /* The shared layout puts the system font and the old dark ground
               on <body> as an inline style; on the landing (the only page that
               loads this sheet) Hanken and the page's ink win over it. */
            html body {
              background: #1d1c19 !important;
              font-family: var(--font-ui), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            }

            /* The light editorial world: everything between the hero and the
               dark footer sits on cream with ink text. */
            .sections {
              position: relative; z-index: 5; background: #f0ede6; color: #1d1c19;
              padding: 0 24px clamp(80px, 9vw, 120px);
              /* clip, not hidden: hidden makes a scroll container and breaks the FAQ's sticky heading */
              overflow: clip;
            }
            /* lantern wash — stops the section reading as one flat slab */
            .sections::before {
              content: ''; position: absolute; left: 50%; top: 300px;
              transform: translateX(-50%);
              width: 1200px; height: 760px; pointer-events: none;
              background: radial-gradient(ellipse at center,
                rgba(29,28,25,0.045) 0%, rgba(29,28,25,0.015) 42%, transparent 70%);
            }

            /* One rhythm for every editorial section: the same top space, the
               same title → sub stack, the same gap into the content. No
               labels above the headings: the headings carry the meaning. */
            /* The homepage runs wider than the other pages; the shared header
               and footer read --site-max so their edges line up with it. */
            :root:has(.sections) { --site-max: 1300px; --site-gutter: 48px; }
            .section {
              position: relative; max-width: var(--site-max, 1300px); margin: 0 auto;
              padding-top: clamp(72px, 8vw, 104px);
            }
            .section h2 {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              color: #1d1c19; font-size: clamp(32px, 3.4vw, 46px); font-weight: 500;
              line-height: 1.08; letter-spacing: -0.028em; margin-bottom: 16px;
              max-width: 22ch; text-wrap: balance;
            }
            .section .sub {
              color: rgba(29,28,25,0.62); font-size: 17.5px; line-height: 1.55;
              max-width: 60ch; margin-bottom: clamp(32px, 3.4vw, 48px); text-wrap: pretty;
            }
            /* Plain text links on the page: underlined, never an arrow. */
            .text-link {
              color: #1d1c19; font-size: 15.5px; font-weight: 500; text-decoration: underline;
              text-decoration-thickness: 1px; text-underline-offset: 4px;
              text-decoration-color: rgba(29,28,25,0.3); transition: text-decoration-color .2s;
            }
            .text-link:hover { text-decoration-color: #1d1c19; }
          `,
        }}
      />

      {/* Black Friday Week: a strip above the header until BLACKFRIDAY ends. */}
      <BlackFridayMarquee />
      <SiteHeader
        landingPath={landingPath}
        tone="light"
        audience={audience}
      />

      <main>
        <HeroLanding audience={audience} />

        <div className="sections">
          <HowItWorksSection />
          <BuiltDifferentlySection />
          <OutcomesSection />
          <ResourcesSection />
          <ClosingCtaBand />
          <FaqSection />
        </div>
      </main>

      <Footer
        landingPath={landingPath}
      />
    </>
  );
}

export default async function PersonalLandingPage(props: Props) {
  return TooneLandingPage({ ...props, audience: "personal" });
}
