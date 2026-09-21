import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import HeroAuth from "@/components/HeroAuth";
import StatementSection from "@/components/StatementSection";
import FaqSection from "@/components/FaqSection";
import PartnerBand from "@/components/PartnerBand";
import Footer from "@/components/Footer";
import ResourcesSection from "@/components/ResourcesSection";
import LandingAudienceBar, {
  type LandingAudience,
} from "@/components/LandingAudienceBar";
import CollaborationPresence from "@/components/CollaborationPresence";

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

type TooneLandingPageProps = Props & {
  audience: LandingAudience;
};

/** Shared presentation shell. Business keeps today's landing verbatim while
 * Personal can be replaced independently as its product story is written. */
export async function TooneLandingPage({
  params,
  audience,
}: TooneLandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });
  const landingPath = audience === "business" ? "/business" : "/";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; overflow-x: hidden; background: #141413; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

            /* --- tech strip (substrate credibility) --- */
            .ts-wrap {
              position: relative; text-align: center;
              padding: clamp(36px, 4vw, 48px) 0 0;
            }
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
            /* --- partner band (static: real partners, no loop) --- */
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
            .pb-more {
              color: rgba(29,28,25,0.45); font-size: 13.5px; font-style: italic;
            }
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

            /* The highlighted collaboration row makes shared presence tangible
               without letting the decorative cursors take control of the page. */
            .ai-native-section { isolation: isolate; }
            .ai-native-section > h2,
            .ai-native-section > .sub,
            .ai-native-section > .pillars {
              position: relative; z-index: 2;
            }
            .collab-presence {
              position: absolute; z-index: 4; inset: -18px -48px;
              pointer-events: none;
            }
            .collab-cursor {
              position: absolute; width: 34px; height: 42px;
              filter: drop-shadow(0 7px 13px rgba(20,19,17,0.2));
              will-change: transform;
            }
            .collab-cursor svg { display: block; width: 100%; height: 100%; }
            .collab-cursor--one {
              left: 4%; top: 6px;
              color: #5c7c72;
              animation: cursor-one-path 12s ease-in-out infinite;
            }
            .collab-cursor--two {
              right: 7%; top: 86px;
              color: #76687f;
              animation: cursor-two-path 13.5s ease-in-out -3.4s infinite;
            }
            .collab-tooltip {
              position: absolute; left: 25px; top: 28px;
              display: flex; align-items: center; gap: 7px;
              width: max-content; padding: 7px 8px 7px 10px;
              border: 1px solid rgba(29,28,25,0.14); border-radius: 9px;
              background: rgba(250,248,243,0.94); color: #292721;
              box-shadow: 0 10px 28px rgba(29,28,25,0.12);
              font-size: 11.5px; font-weight: 600; letter-spacing: -0.005em;
              backdrop-filter: blur(10px);
            }
            .collab-tooltip-beta,
            .pillar-beta {
              border-radius: 999px; background: rgba(118,104,127,0.12);
              color: #62556b; font-size: 9px; font-weight: 750;
              letter-spacing: 0.08em; line-height: 1;
              padding: 5px 7px 4px; text-transform: uppercase;
            }
            @keyframes cursor-one-path {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(-4deg); }
              27% { transform: translate3d(154px, 46px, 0) rotate(1deg); }
              56% { transform: translate3d(294px, 20px, 0) rotate(-2deg); }
              78% { transform: translate3d(214px, 88px, 0) rotate(2deg); }
            }
            @keyframes cursor-two-path {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(3deg); }
              24% { transform: translate3d(-112px, -54px, 0) rotate(-2deg); }
              54% { transform: translate3d(-246px, -22px, 0) rotate(2deg); }
              78% { transform: translate3d(-166px, 38px, 0) rotate(-1deg); }
            }

            /* --- built-on (the substrate, stated in plain words) ---
               Reuses the .section rhythm above; the marker is the wordmark
               hexagon at list scale, so it belongs to the same family as the
               .phex counters in the pillars rail. */
            .built-on .built-on-lead {
              color: rgba(29,28,25,0.78); font-size: 16.5px; line-height: 1.65;
              max-width: 62ch;
            }
            .built-on .built-on-facts {
              list-style: none; margin-top: 18px;
              display: flex; flex-direction: column; gap: 9px;
            }
            .built-on .built-on-facts li {
              position: relative; padding-left: 19px;
              color: rgba(29,28,25,0.6); font-size: 14.5px; line-height: 1.6;
            }
            .built-on .built-on-facts li::before {
              content: ''; position: absolute; left: 0; top: 0.58em;
              width: 7px; height: 8px;
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              background: rgba(29,28,25,0.34);
            }

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
            .pillar-governance-link {
              display: inline-block; margin-top: 6px; color: rgba(29,28,25,0.72);
              text-underline-offset: 3px;
            }
            .pillar-governance-link:hover { color: #1d1c19; }
            .pillar--collaboration {
              position: relative;
              border-color: rgba(92,124,114,0.3);
              background:
                linear-gradient(100deg, rgba(92,124,114,0.1), rgba(255,255,255,0.5) 42%),
                rgba(255,255,255,0.45);
              box-shadow: 0 14px 40px rgba(29,28,25,0.055);
            }
            .pillar-heading {
              display: flex; align-items: center; gap: 9px; min-width: 0;
            }
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
              .collab-presence { inset: -12px; }
              .collab-cursor { width: 29px; height: 36px; }
              .collab-cursor--one { left: 2%; }
              .collab-cursor--two { right: 8%; top: 76px; }
              .collab-tooltip { left: auto; right: 21px; top: 27px; }
              @keyframes cursor-one-path {
                0%, 100% { transform: translate3d(0, 0, 0) rotate(-4deg); }
                50% { transform: translate3d(92px, 52px, 0) rotate(2deg); }
              }
              @keyframes cursor-two-path {
                0%, 100% { transform: translate3d(0, 0, 0) rotate(3deg); }
                50% { transform: translate3d(-102px, -48px, 0) rotate(-2deg); }
              }
              .pillar { grid-template-columns: 40px 1fr; gap: 14px 18px; padding: 18px; }
              .pillar p { grid-column: 2; }
              .phex { width: 34px; height: 38px; font-size: 11px; }
            }
            @media (prefers-reduced-motion: reduce) {
              .collab-cursor { animation: none; }
              .collab-cursor--one { transform: translate3d(104px, 54px, 0); }
              .collab-cursor--two { transform: translate3d(-84px, -34px, 0); }
            }
          `,
        }}
      />

      <LandingAudienceBar activeAudience={audience} />
      <SiteHeader
        landingPath={landingPath}
        showcasesPath={audience === "business" ? "/business/showcases" : "/how-to"}
      />

      <main>
        <HeroAuth audience={audience} />

        <StatementSection audience={audience} />

        <div className="sections">
          {audience === "business" && <PartnerBand />}

          <section className="section ai-native-section" id="how">
            <h2>{t(audience === "personal" ? "personal.featuresTitle" : "pillarsTitle")}</h2>
            <p className="sub">
              {t(audience === "personal" ? "personal.featuresSub" : "pillarsSub")}
            </p>
            <div className="pillars">
              {(
                audience === "personal"
                  ? [
                    ["personal.features.spotlight.title", "personal.features.spotlight.description"],
                    ["personal.features.windows.title", "personal.features.windows.description"],
                    ["personal.features.browser.title", "personal.features.browser.description"],
                    ["personal.features.routines.title", "personal.features.routines.description"],
                    ["personal.features.liveShare.title", "personal.features.liveShare.description"],
                    ["personal.features.orchestration.title", "personal.features.orchestration.description"],
                    ["personal.features.voice.title", "personal.features.voice.description"],
                    ["personal.features.providers.title", "personal.features.providers.description"],
                  ] as const
                  : [
                    ["collaborationTitle", "collaborationDescription"],
                    ["p1t", "p1d"],
                    ["p2t", "p2d"],
                    ["p8t", "p8d"],
                    ["p3t", "p3d"],
                    ["p4t", "p4d"],
                    ["p5t", "p5d"],
                    ["p6t", "p6d"],
                    ["p7t", "p7d"],
                  ] as const
              ).map(([titleKey, descKey], i) => {
                const isCollaboration = audience === "personal" ? i === 4 : i === 0;

                return (
                  <div
                    className={`pillar${isCollaboration ? " pillar--collaboration" : ""}`}
                    key={titleKey}
                  >
                    {isCollaboration && (
                      <CollaborationPresence tooltip={t("collaborationTooltip")} />
                    )}
                    <div className="phex">{String(i + 1).padStart(2, "0")}</div>
                    <div className="pillar-heading">
                      <h3>{t(titleKey)}</h3>
                      {isCollaboration && <span className="pillar-beta">Beta</span>}
                    </div>
                    <p>
                      {t(descKey)}
                      {audience === "business" && locale === "en" && titleKey === "p6t" && (
                        <>
                          {" "}
                          <a className="pillar-governance-link" href="/en/governance">
                            Read the practical AI agent governance model.
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* The substrate, stated on-page. English literals for now, on the
              same reasoning as /business: these strings are not translated,
              and putting them under a `landing.*` key would force the English
              copy onto all eight locales. */}
          {locale === "en" && (
            <section className="section built-on" id="built-on">
              <h2>Built on</h2>
              <p className="built-on-lead">
                Toone runs on Claude Code and OpenAI Codex with your own provider
                access, and connects to your tools through MCP.
              </p>
              <ul className="built-on-facts">
                <li>You bring your own Anthropic or OpenAI account.</li>
                <li>Your organization&rsquo;s files stay on your Mac.</li>
              </ul>
            </section>
          )}

          <ResourcesSection />
          <FaqSection />
        </div>
      </main>

      <Footer
        landingPath={landingPath}
        showcasesPath={audience === "business" ? "/business/showcases" : "/how-to"}
      />
    </>
  );
}

export default async function PersonalLandingPage(props: Props) {
  return TooneLandingPage({ ...props, audience: "personal" });
}
