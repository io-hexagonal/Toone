"use client";

import { useRef, useState, FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import HeroGlitter from "@/components/HeroGlitter";
import AppleLogo from "@/components/AppleLogo";
import type { LandingAudience } from "@/components/LandingAudienceBar";

/** Real Google auth lives on /signin; the hero button routes there once a client id is configured. */

const WAITLIST_SOURCE = "hero-auth";

type WaitlistOutcome =
  | {
      outcome_id: string;
      outcome_state: "created";
      source: typeof WAITLIST_SOURCE;
    }
  | {
      outcome_state: "already_registered";
      source: typeof WAITLIST_SOURCE;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isWaitlistOutcome(value: unknown): value is WaitlistOutcome {
  if (!value || typeof value !== "object") return false;
  const outcome = value as Record<string, unknown>;
  if (outcome.source !== WAITLIST_SOURCE) return false;
  if (outcome.outcome_state === "already_registered") return true;
  return (
    outcome.outcome_state === "created" &&
    typeof outcome.outcome_id === "string" &&
    UUID_PATTERN.test(outcome.outcome_id)
  );
}

/**
 * Full-screen hero. Centred column (claude.ai-style): headline, one short
 * line, auth card, one download button, over the treated light loop in
 * HeroGlitter.tsx.
 */

type Props = {
  audience?: LandingAudience;
};

export default function HeroAuth({ audience = "business" }: Props) {
  const t = useTranslations("landing");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const submissionRef = useRef(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || submissionRef.current || !e.currentTarget.checkValidity()) {
      return;
    }
    submissionRef.current = true;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: WAITLIST_SOURCE }),
      });
      const outcome: unknown = await res.json().catch(() => null);
      if (res.ok && isWaitlistOutcome(outcome)) {
        setStatus("success");
        if (outcome.outcome_state === "created") {
          (
            window as unknown as {
              umami?: {
                track: (name: string, data?: Record<string, string>) => void;
              };
            }
          ).umami?.track("waitlist-signup", {
            outcome_id: outcome.outcome_id,
            outcome_state: outcome.outcome_state,
            source: outcome.source,
            locale,
            page_url: `https://trytoone.com/${locale}`,
          });
        }
      } else {
        submissionRef.current = false;
        setStatus("error");
      }
    } catch {
      submissionRef.current = false;
      setStatus("error");
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .hero-auth {
              position: relative; z-index: 5;
              min-height: 100svh; background: #141413;
              display: grid; align-items: center;
              grid-template-columns: 1fr;
              padding: 0 20px;
            }

            .hero-auth > .ha-left { position: relative; z-index: 1; }
            .ha-left {
              text-align: center; display: flex; flex-direction: column; align-items: center;
              justify-self: center; max-width: 460px; padding: 96px 12px 40px;
            }
            .ha-title {
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; letter-spacing: -0.02em; line-height: 1.06;
              color: rgba(255,255,255,0.95);
              font-size: clamp(34px, 3.6vw, 48px);
              margin-bottom: 20px; text-wrap: balance;
            }
            .ha-tag {
              color: rgba(255,255,255,0.62); font-size: 19px; line-height: 1.45;
              max-width: 30ch; margin-bottom: 40px; text-wrap: balance;
            }
            .ha-language {
              max-width: 42ch; margin: -16px 0 20px; color: rgba(255,255,255,0.72);
              font-size: 12.5px; line-height: 1.5;
            }

            /* Glass card.
               .ha-card::after    the frosted interior, fading IN from the edge over
                                  --ha-fade so the rim never sits on a dark step
               .ha-card::before   the refracting rim, fading OUT toward the centre
               .ha-card-fringe    a 2px chromatic fringe on the outermost edge
               A top bevel of light and a bottom bevel of shadow give the pane thickness. */
            .ha-glass {
              /* Eased ramps: a straight-line fade that stops dead reads as a crease
                 (Mach band), so both ramps taper off gradually, and they end at
                 different distances so no two transitions share a line. */
              --ha-fade: 48px;   /* rim: bright at the edge, gone by here */
              --ha-fill: 64px;   /* interior: absent at the edge, full by here */
              --ha-rim-stops: #000,
                rgba(0,0,0,0.78) calc(var(--ha-fade) * 0.18),
                rgba(0,0,0,0.5) calc(var(--ha-fade) * 0.38),
                rgba(0,0,0,0.26) calc(var(--ha-fade) * 0.58),
                rgba(0,0,0,0.1) calc(var(--ha-fade) * 0.78),
                rgba(0,0,0,0.02) calc(var(--ha-fade) * 0.92),
                transparent var(--ha-fade);
              --ha-fill-stops: transparent,
                rgba(0,0,0,0.03) calc(var(--ha-fill) * 0.1),
                rgba(0,0,0,0.12) calc(var(--ha-fill) * 0.26),
                rgba(0,0,0,0.3) calc(var(--ha-fill) * 0.44),
                rgba(0,0,0,0.55) calc(var(--ha-fill) * 0.64),
                rgba(0,0,0,0.82) calc(var(--ha-fill) * 0.84),
                #000 var(--ha-fill);
              --ha-glass-filter: blur(6px) saturate(2.2) brightness(1.55) contrast(1.08);
              position: relative; width: 100%; max-width: 400px;
            }
            .ha-card {
              position: relative; z-index: 1; isolation: isolate; overflow: hidden;
              width: 100%;
              border: 1px solid transparent; border-radius: 16px;
              background: transparent;
              box-shadow:
                inset 0 1px 0 rgba(255,255,255,0.16),
                inset 0 -1px 0 rgba(0,0,0,0.35);
              padding: 22px; display: flex; flex-direction: column; gap: 12px;
            }
            .ha-card::after {
              content: ""; position: absolute; inset: 0; z-index: -2; border-radius: inherit;
              pointer-events: none;
              background:
                linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.04) 100%),
                rgba(20,20,19,0.6);
              backdrop-filter: blur(22px) saturate(1.25);
              -webkit-backdrop-filter: blur(22px) saturate(1.25);
              /* fade in from the edge so the glass edge is not a dark step */
              -webkit-mask:
                linear-gradient(to bottom, var(--ha-fill-stops)),
                linear-gradient(to top, var(--ha-fill-stops)),
                linear-gradient(to right, var(--ha-fill-stops)),
                linear-gradient(to left, var(--ha-fill-stops));
              -webkit-mask-composite: source-in;
              mask:
                linear-gradient(to bottom, var(--ha-fill-stops)),
                linear-gradient(to top, var(--ha-fill-stops)),
                linear-gradient(to right, var(--ha-fill-stops)),
                linear-gradient(to left, var(--ha-fill-stops));
              mask-composite: intersect;
            }
            .ha-card::before {
              content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
              pointer-events: none;
              /* union of four eased edge fades = a rim that dissolves toward the centre */
              -webkit-mask:
                linear-gradient(to bottom, var(--ha-rim-stops)),
                linear-gradient(to top, var(--ha-rim-stops)),
                linear-gradient(to right, var(--ha-rim-stops)),
                linear-gradient(to left, var(--ha-rim-stops));
              mask:
                linear-gradient(to bottom, var(--ha-rim-stops)),
                linear-gradient(to top, var(--ha-rim-stops)),
                linear-gradient(to right, var(--ha-rim-stops)),
                linear-gradient(to left, var(--ha-rim-stops));
              backdrop-filter: var(--ha-glass-filter);
              -webkit-backdrop-filter: var(--ha-glass-filter);
            }
            .ha-card-fringe {
              position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
              padding: 2px;
              -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              -webkit-mask-composite: xor; mask-composite: exclude;
              backdrop-filter: hue-rotate(28deg) saturate(2.6) brightness(1.6);
              -webkit-backdrop-filter: hue-rotate(28deg) saturate(2.6) brightness(1.6);
              opacity: 0.7;
            }
            /* The email field wears the same glass as the card at a smaller scale:
               a refracting rim fading inward and a frosted interior fading in. */
            .ha-field {
              --hf-fade: 16px;
              --hf-fill: 22px;
              --hf-rim-stops: #000,
                rgba(0,0,0,0.78) calc(var(--hf-fade) * 0.18),
                rgba(0,0,0,0.5) calc(var(--hf-fade) * 0.38),
                rgba(0,0,0,0.26) calc(var(--hf-fade) * 0.58),
                rgba(0,0,0,0.1) calc(var(--hf-fade) * 0.78),
                rgba(0,0,0,0.02) calc(var(--hf-fade) * 0.92),
                transparent var(--hf-fade);
              --hf-fill-stops: transparent,
                rgba(0,0,0,0.03) calc(var(--hf-fill) * 0.1),
                rgba(0,0,0,0.12) calc(var(--hf-fill) * 0.26),
                rgba(0,0,0,0.3) calc(var(--hf-fill) * 0.44),
                rgba(0,0,0,0.55) calc(var(--hf-fill) * 0.64),
                rgba(0,0,0,0.82) calc(var(--hf-fill) * 0.84),
                #000 var(--hf-fill);
              position: relative; isolation: isolate; overflow: hidden;
              display: block; width: 100%; border-radius: 10px;
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.3);
            }
            .ha-field::after {
              content: ""; position: absolute; inset: 0; z-index: -2; border-radius: inherit; pointer-events: none;
              background: rgba(20,20,19,0.55);
              backdrop-filter: blur(14px) saturate(1.2);
              -webkit-backdrop-filter: blur(14px) saturate(1.2);
              -webkit-mask:
                linear-gradient(to bottom, var(--hf-fill-stops)),
                linear-gradient(to top, var(--hf-fill-stops)),
                linear-gradient(to right, var(--hf-fill-stops)),
                linear-gradient(to left, var(--hf-fill-stops));
              -webkit-mask-composite: source-in;
              mask:
                linear-gradient(to bottom, var(--hf-fill-stops)),
                linear-gradient(to top, var(--hf-fill-stops)),
                linear-gradient(to right, var(--hf-fill-stops)),
                linear-gradient(to left, var(--hf-fill-stops));
              mask-composite: intersect;
            }
            .ha-field::before {
              content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none;
              -webkit-mask:
                linear-gradient(to bottom, var(--hf-rim-stops)),
                linear-gradient(to top, var(--hf-rim-stops)),
                linear-gradient(to right, var(--hf-rim-stops)),
                linear-gradient(to left, var(--hf-rim-stops));
              mask:
                linear-gradient(to bottom, var(--hf-rim-stops)),
                linear-gradient(to top, var(--hf-rim-stops)),
                linear-gradient(to right, var(--hf-rim-stops)),
                linear-gradient(to left, var(--hf-rim-stops));
              backdrop-filter: var(--ha-glass-filter);
              -webkit-backdrop-filter: var(--ha-glass-filter);
            }
            .ha-field:focus-within { box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.18); }
            .ha-email {
              position: relative; z-index: 1;
              width: 100%; padding: 12px 14px; border-radius: 10px;
              border: 1px solid transparent;
              background: transparent; color: rgba(255,255,255,0.92);
              font-size: 14px; outline: none;
            }
            .ha-email::placeholder { color: rgba(255,255,255,0.62); }
            .ha-email:focus { border-color: transparent; }
            .ha-continue {
              width: 100%; padding: 12px; border-radius: 10px; border: none;
              display: inline-flex; align-items: center; justify-content: center; gap: 9px;
              background: #f0ede6; color: #1d1c19; cursor: pointer;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em;
              transition: transform 0.15s ease;
            }
            .ha-continue:hover { transform: scale(1.015); }
            .ha-continue svg { width: 16px; height: 16px; fill: currentColor; margin-top: -2px; flex: none; }
            .ha-continue:disabled { opacity: 0.6; transform: none; cursor: default; }
            .ha-note { color: rgba(255,255,255,0.66); font-size: 12px; text-align: center; }
            .ha-existing { margin-top: 22px; font-size: 13px; }
            .ha-existing a { color: rgba(255,255,255,0.9); text-decoration: none; }
            .ha-existing a:hover { text-decoration: underline; }
            .ha-joined { color: rgba(255,255,255,0.85); font-size: 14.5px; text-align: center; padding: 16px 0; }

            .ha-dl {
              display: inline-flex; align-items: center; gap: 9px;
              margin-top: 20px; padding: 12px 22px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.13); color: rgba(255,255,255,0.85);
              text-decoration: none; font-size: 14px; font-weight: 500;
              transition: background 0.2s, border-color 0.2s;
            }
            .ha-dl:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.28); }
            .ha-dl svg { width: 18px; height: 18px; fill: currentColor; }

            .ha-product-hunt {
              position: fixed; z-index: 35; left: 24px; bottom: 24px;
              display: inline-flex; align-items: center; gap: 9px;
              min-height: 48px; padding: 8px 12px; border-radius: 12px; overflow: hidden;
              border: 1px solid rgba(255,255,255,0.12); background: #201e1d;
              color: rgba(255,255,255,0.9); text-decoration: none;
              opacity: 0.8; box-shadow: 0 10px 30px rgba(0,0,0,0.22);
              transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
            }
            .ha-product-hunt:hover {
              opacity: 1; transform: translateY(-2px);
              box-shadow: 0 14px 36px rgba(0,0,0,0.32);
            }
            .ha-product-hunt:focus-visible {
              outline: 2px solid rgba(255,255,255,0.9);
              outline-offset: 4px; opacity: 1;
            }
            .ha-product-hunt-mark {
              display: grid; place-items: center; width: 28px; height: 28px;
              border-radius: 50%; background: #ff6154; color: #fff;
              font-size: 15px; font-weight: 750;
            }
            .ha-product-hunt-copy { display: flex; flex-direction: column; text-align: left; }
            .ha-product-hunt-copy small { font-size: 8px; letter-spacing: 0.12em; color: rgba(255,255,255,0.66); }
            .ha-product-hunt-copy strong { font-size: 12.5px; line-height: 1.25; }

            @media (max-width: 720px) {
              .ha-dl { display: none; }
              .ha-product-hunt {
                position: static; margin-top: 20px;
                transform: none; opacity: 0.82;
              }
              .ha-product-hunt:hover { transform: translateY(-2px); }
            }
          `,
        }}
      />

      <section className="hero-auth">
        <HeroGlitter />
        <div className="ha-left">
          <h1 className="ha-title">
            {t(audience === "personal" ? "personal.heroTitle" : "heroTitle")}
          </h1>
          <p className="ha-tag">
            {t(audience === "personal" ? "personal.heroTag" : "heroTag2")}
          </p>
          {locale !== "en" && (
            <p className="ha-language">{t("productLanguageDisclosure")}</p>
          )}

          <div className="ha-glass">
          <div className="ha-card">
            <span className="ha-card-fringe" aria-hidden="true" />
            {status === "success" ? (
              <p className="ha-joined">{t("authJoined")}</p>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <span className="ha-field">
                    <input
                      className="ha-email"
                      data-early-access-input=""
                      type="email"
                      aria-label={t("authEmailPh")}
                      placeholder={t("authEmailPh")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </span>
                  <button
                    className="ha-continue"
                    type="submit"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "…" : <><AppleLogo />{t("authContinue")}</>}
                  </button>
                </form>
                <p className="ha-note">
                  {status === "error" ? t("authError") : t("authNote")}
                </p>
              </>
            )}
          </div>
          </div>

          <p className="ha-note ha-existing">
            {t("waitlistExisting")} <Link href="/signin">{t("waitlistSignIn")}</Link>
          </p>

          <a
            className="ha-product-hunt"
            href="https://www.producthunt.com/products/toone?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-toone"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Toone on Product Hunt"
          >
            <span className="ha-product-hunt-mark" aria-hidden="true">P</span>
            <span className="ha-product-hunt-copy">
              <small>FEATURED ON</small>
              <strong>Product Hunt</strong>
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
