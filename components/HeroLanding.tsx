import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import CreateAccountLink from "@/components/CreateAccountLink";
import MagneticPull from "@/components/MagneticPull";
import { CLAUDE_SPARK } from "@/components/SupportBand";
import type { LandingAudience } from "@/components/LandingAudienceBar";
import { linksBusinessLanding } from "@/lib/page-indexing";

/**
 * Light landing hero: two-line headline (plain line, then a dotted accent
 * line), one short line under it, one button, and a short trust row
 * (Product Hunt rank, Claude for Startups, "Ask AI about us").
 *
 * The background is CSS only: a warm off-white ground and a very faint
 * field of the headline's dots around the content. No video, no client JS
 * here beyond the account button.
 */

type Props = {
  audience?: LandingAudience;
};

const PRODUCT_HUNT_URL =
  "https://www.producthunt.com/products/toone?utm_source=trytoone&utm_medium=hero";
const CLAUDE_STARTUPS_URL = "https://claude.com/programs/startups";

const ASSISTANTS = [
  { id: "chatgpt", name: "ChatGPT", url: (q: string) => `https://chatgpt.com/?q=${q}` },
  { id: "claude", name: "Claude", url: (q: string) => `https://claude.ai/new?q=${q}` },
  { id: "perplexity", name: "Perplexity", url: (q: string) => `https://www.perplexity.ai/search?q=${q}` },
] as const;

const AUDIENCES = [
  { id: "personal", href: "/", labelKey: "audiencePersonal" },
  { id: "business", href: "/business", labelKey: "audienceBusiness" },
] as const;

/** #3 medal, drawn so it needs no third-party image: ink tones at rest, its bronze on hover. */
function MedalIcon() {
  return (
    <svg className="hl-badge-icon" viewBox="0 0 28 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hl-medal" x1="0" y1="0" x2="1" y2="1">
          <stop className="hl-m0" offset="0" />
          <stop className="hl-m1" offset="0.55" />
          <stop className="hl-m2" offset="1" />
        </linearGradient>
      </defs>
      <path className="hl-r0" d="M8 18 4.5 30l5-2.4L12.6 31l2.2-9.6Z" />
      <path className="hl-r1" d="M20 18l3.5 12-5-2.4-3.1 3.4-2.2-9.6Z" />
      <circle cx="14" cy="12" r="11" fill="url(#hl-medal)" />
      <circle cx="14" cy="12" r="8.2" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <text x="14" y="16.2" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
        3
      </text>
    </svg>
  );
}

function ClaudeSpark() {
  return (
    <svg className="hl-badge-icon hl-badge-icon--claude" viewBox="0 0 148.18 148.18" aria-hidden="true" focusable="false">
      <g transform="translate(-75.96,-223.53)">
        <path className="hl-spark" d={CLAUDE_SPARK} />
      </g>
    </svg>
  );
}

/** Longer emphasised phrases wrap, so they get a highlight instead of the chip. */
const ACCENT_CHIP_MAX = 18;

export default async function HeroLanding({ audience = "business" }: Props) {
  const t = await getTranslations("landing");
  const locale = await getLocale();
  const prompt = encodeURIComponent(t("trust.askAiPrompt"));

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hl {
              position: relative; z-index: 5; isolation: isolate; overflow: hidden;
              display: grid; place-items: center;
              padding: 168px 20px 72px;
              color: #1d1c19;
              /* Ends on the statement section's cream so the two read as one surface. */
              background: linear-gradient(180deg, #f9f8f5 0%, #f5f3ee 55%, #f0ede6 100%);
            }

            /* --- dot field: the headline's dots, very faint, framing the
               content on the sides and along the bottom. Two masks are
               intersected: the dot grid, an ellipse that clears the centre
               where the text sits, and a fade into the next section. --- */
            .hl-dots {
              position: absolute; inset: 0; z-index: -1; pointer-events: none;
              opacity: 0.15;
              background: linear-gradient(95deg, #2b2a27 0%, #6b6862 100%);
              -webkit-mask-image:
                radial-gradient(circle closest-side, #000 55%, transparent 66%),
                radial-gradient(ellipse 42% 60% at 50% 44%, transparent 65%, #000 100%),
                linear-gradient(180deg, #000 0%, #000 calc(100% - 200px), transparent 100%);
              -webkit-mask-size: 6px 6px, 100% 100%, 100% 100%;
              -webkit-mask-repeat: repeat, no-repeat, no-repeat;
              -webkit-mask-composite: source-in;
                      mask-image:
                radial-gradient(circle closest-side, #000 55%, transparent 66%),
                radial-gradient(ellipse 42% 60% at 50% 44%, transparent 65%, #000 100%),
                linear-gradient(180deg, #000 0%, #000 calc(100% - 200px), transparent 100%);
                      mask-size: 6px 6px, 100% 100%, 100% 100%;
                      mask-repeat: repeat, no-repeat, no-repeat;
                      mask-composite: intersect;
            }

            .hl-inner {
              display: flex; flex-direction: column; align-items: center;
              text-align: center; max-width: 1120px;
            }

            /* Phones have no room for the audience links in the header; they sit here. */
            .hl-audience { display: none; }

            .hl-title {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.03em; line-height: 1.08;
              font-size: clamp(38px, 4.7vw, 72px);
              color: #1d1c19; text-wrap: balance;
              margin-bottom: 26px;
            }
            /* The emphasised phrase sits in a dark chip with a repeat icon,
               tilted slightly, and a small straight routine graph branches off it:
               two step cards on dashed edges. The graph hangs outside the
               chip (absolute), so the phrase stays centred; it is hidden
               where there is no room beside the chip. */
            .hl-accent-node {
              /* Its own line, shrunk to the chip and centred. */
              position: relative; display: table; margin: 0.1em auto 0;
            }
            .hl-accent {
              display: inline-flex; align-items: center; gap: 0.22em;
              padding: 0.02em 0.32em 0.06em 0.26em; border-radius: 0.24em;
              background: #1d1c19; color: #f9f8f5;
              transform: rotate(-1.5deg);
            }
            .hl-accent-icon { width: 0.62em; height: 0.62em; flex: none; }
            .hl-accent-graph {
              /* Straight, not tilted with the chip. The tilt lifts the chip's
                 right edge a little, so the graph sits slightly higher. */
              position: absolute; left: 100%; top: calc(50% - 0.07em); transform: translateY(-50%);
              width: 1.6em; height: 1.1em; overflow: visible; pointer-events: none;
            }
            @media (max-width: 900px) { .hl-accent-graph { display: none; } }
            /* A long phrase (other languages) wraps: a chip would stretch to
               the full width, so it gets a plain dark highlight per line. */
            .hl-accent-long {
              background: #1d1c19; color: #f9f8f5;
              padding: 0 0.18em 0.04em; border-radius: 0.18em;
              -webkit-box-decoration-break: clone; box-decoration-break: clone;
            }

            .hl-tag {
              color: rgba(29,28,25,0.66); font-size: clamp(17px, 1.45vw, 20px); line-height: 1.55;
              max-width: 40ch; margin-bottom: 34px; text-wrap: balance;
              white-space: pre-line;
            }
            /* No second accent: the dotted line is the only emphasis. */
            .hl-tag strong { color: inherit; font-weight: inherit; }
            .hl-language {
              max-width: 46ch; margin: -18px 0 28px; color: rgba(29,28,25,0.6);
              font-size: 12.5px; line-height: 1.5;
            }

            /* The one button: .holo-btn (app/globals.css), hero size. */
            .hl-cta { will-change: translate; }

            /* --- trust row --- */
            .hl-badges {
              display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
              list-style: none; margin: 30px 0 0; padding: 0;
            }
            .hl-badge {
              display: flex; align-items: center; gap: 11px;
              padding: 9px 18px 9px 13px; border-radius: 11px; text-decoration: none;
              background: rgba(255,255,255,0.78);
              border: 1px solid rgba(29,28,25,0.12);
              box-shadow: 0 1px 2px rgba(29,28,25,0.04);
              transition: border-color 0.2s ease, transform 0.2s ease;
            }
            .hl-badge:hover { border-color: rgba(29,28,25,0.3); transform: translateY(-1px); }
            .hl-badge-icon { width: 24px; height: 28px; flex: none; }
            .hl-badge-icon--claude { width: 22px; height: 22px; }
            /* The icons rest in ink and take their own colours on hover or focus:
               Claude's clay spark, the medal's bronze and red ribbons. */
            .hl-spark { fill: rgba(29,28,25,0.75); transition: fill .25s ease; }
            .hl-m0 { stop-color: #8a8780; transition: stop-color .25s ease; }
            .hl-m1 { stop-color: #5c5a55; transition: stop-color .25s ease; }
            .hl-m2 { stop-color: #3b3a37; transition: stop-color .25s ease; }
            .hl-r0 { fill: #6b6862; transition: fill .25s ease; }
            .hl-r1 { fill: #4a4844; transition: fill .25s ease; }
            .hl-badge:is(:hover, :focus-visible) .hl-spark { fill: #d97757; }
            .hl-badge:is(:hover, :focus-visible) .hl-m0 { stop-color: #e7b58a; }
            .hl-badge:is(:hover, :focus-visible) .hl-m1 { stop-color: #c98a5a; }
            .hl-badge:is(:hover, :focus-visible) .hl-m2 { stop-color: #9c623a; }
            .hl-badge:is(:hover, :focus-visible) .hl-r0 { fill: #d9654b; }
            .hl-badge:is(:hover, :focus-visible) .hl-r1 { fill: #b84a36; }
            .hl-badge-text { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
            .hl-badge-kicker {
              color: #6f6b64; font-size: 10px; font-weight: 600;
              letter-spacing: 0.03em; text-transform: uppercase; line-height: 1;
            }
            .hl-badge-value {
              color: #5c5852; font-size: 15px; font-weight: 600; letter-spacing: -0.005em; line-height: 1.15;
            }

            .hl-ask {
              display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
              gap: 8px; margin-top: 26px;
            }
            .hl-ask-label { color: rgba(29,28,25,0.6); font-size: 14.5px; margin-right: 6px; }
            .hl-ask a {
              display: inline-flex; align-items: center;
              padding: 6px 13px; border-radius: 999px; text-decoration: none;
              color: #1d1c19; font-size: 13.5px; font-weight: 600;
              background: rgba(255,255,255,0.7);
              border: 1px solid rgba(29,28,25,0.14);
              transition: border-color 0.2s ease, background-color 0.2s ease;
            }
            .hl-ask a:hover { border-color: rgba(29,28,25,0.34); background: #fff; }

            @media (max-width: 720px) {
              .hl { padding: 132px 18px 72px; min-height: auto; }
              .hl-audience {
                display: inline-flex; gap: 2px; padding: 3px; margin-bottom: 26px;
                border-radius: 999px; background: rgba(29,28,25,0.06);
              }
              .hl-audience a, .hl-audience span {
                padding: 6px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 500;
                color: rgba(29,28,25,0.6); text-decoration: none;
              }
              .hl-audience [aria-current="page"] { background: #fff; color: #1d1c19; font-weight: 600; }
              .hl-tag { font-size: 16.5px; }
              .hl-cta { width: 100%; max-width: 340px; }
              .hl-badges li { width: min(100%, 320px); }
              .hl-badge { width: 100%; }
              .hl-ask-label { flex-basis: 100%; text-align: center; margin: 0 0 2px; }
              .hl-ask a { padding: 6px 12px; font-size: 13px; }
            }
            /* the business headline is longer: keep it to four lines on small phones */
            @media (max-width: 420px) { .hl[data-audience="business"] .hl-title { font-size: 34px; } }
          `,
        }}
      />

      <section className="hl" data-audience={audience}>
        <div className="hl-dots" aria-hidden="true" />

        <div className="hl-inner">
          {/* Not while the page may not link the Business landing (lib/page-indexing.ts). */}
          {linksBusinessLanding(locale, audience) && (
            <nav className="hl-audience" aria-label={t("audienceLabel")}>
              {AUDIENCES.map((a) =>
                a.id === audience ? (
                  <span key={a.id} aria-current="page">{t(a.labelKey)}</span>
                ) : (
                  <Link key={a.id} href={a.href}>{t(a.labelKey)}</Link>
                ),
              )}
            </nav>
          )}

          <h1 className="hl-title">
            {t.rich(audience === "personal" ? "personal.heroTitle" : "heroTitle", {
              accent: (chunks) => [chunks].flat().join("").length > ACCENT_CHIP_MAX ? (
                <span className="hl-accent-long">{chunks}</span>
              ) : (
                <span className="hl-accent-node">
                  <span className="hl-accent">
                    <svg className="hl-accent-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                      <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
                    </svg>
                    {chunks}
                  </span>
                  <svg className="hl-accent-graph" viewBox="0 0 64 44" fill="none" stroke="#1d1c19"
                    strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M0 22h8c6 0 7-12 14-12h10M8 22c6 0 7 12 14 12h10" strokeDasharray="3.5 3.5" />
                    <rect x="34" y="4" width="28" height="12" rx="3.6" fill="#f9f8f5" />
                    <rect x="34" y="28" width="28" height="12" rx="3.6" fill="#1d1c19" />
                  </svg>
                </span>
              ),
            })}
          </h1>
          <p className="hl-tag">
            {audience === "personal"
              ? t.rich("personal.heroTag", { b: (chunks) => <strong>{chunks}</strong> })
              : t("heroTag2")}
          </p>
          {locale !== "en" && (
            <p className="hl-language">{t("productLanguageDisclosure")}</p>
          )}

          <CreateAccountLink className="hl-cta holo-btn" placement="hero">
            {t("heroCreate")}
          </CreateAccountLink>

          <ul className="hl-badges">
            <li>
              <a
                className="hl-badge"
                href={PRODUCT_HUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="hero-trust"
                data-umami-event-badge="product-hunt"
              >
                <MedalIcon />
                <span className="hl-badge-text">
                  <span className="hl-badge-kicker">{t("trust.productHunt")}</span>
                  <span className="hl-badge-value">{t("trust.productHuntRank")}</span>
                </span>
              </a>
            </li>
            <li>
              <a
                className="hl-badge"
                href={CLAUDE_STARTUPS_URL}
                target="_blank"
                rel="noopener"
                data-umami-event="hero-trust"
                data-umami-event-badge="claude-startups"
              >
                <ClaudeSpark />
                <span className="hl-badge-text">
                  <span className="hl-badge-kicker">{t("trust.supportedBy")}</span>
                  <span className="hl-badge-value">{t("trust.claudeStartups")}</span>
                </span>
              </a>
            </li>
          </ul>

          <div className="hl-ask">
            <span className="hl-ask-label">{t("trust.askAi")}</span>
            {ASSISTANTS.map((a) => (
              <a
                key={a.id}
                href={a.url(prompt)}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="ask-ai"
                data-umami-event-assistant={a.id}
              >
                {a.name}
              </a>
            ))}
          </div>
        </div>
        <MagneticPull selector=".hl-cta" />
      </section>
    </>
  );
}
