"use client";

import { useRef, useState, FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import HeroGlitter from "@/components/HeroGlitter";
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
              margin-bottom: 14px; text-wrap: balance;
            }
            .ha-tag {
              color: rgba(255,255,255,0.62); font-size: 19px; line-height: 1.45;
              max-width: 30ch; margin-bottom: 30px; text-wrap: balance;
            }
            .ha-language {
              max-width: 42ch; margin: -16px 0 20px; color: rgba(255,255,255,0.72);
              font-size: 12.5px; line-height: 1.5;
            }

            /* Glass card. The interior is a dark frosted fill; a thin ring along
               the edge samples the raw light loop behind it, brighter and more
               saturated, so the colour appears to refract through the rim. */
            .ha-card {
              --ha-rim: 7px;
              position: relative; isolation: isolate;
              width: 100%; max-width: 400px;
              border: 1px solid rgba(255,255,255,0.16); border-radius: 16px;
              background: transparent;
              box-shadow:
                inset 0 1px 0 rgba(255,255,255,0.22),
                inset 0 -1px 0 rgba(255,255,255,0.05),
                0 24px 70px rgba(0,0,0,0.45);
              padding: 22px; display: flex; flex-direction: column; gap: 12px;
            }
            .ha-card::before {
              /* the refracting rim */
              content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit;
              padding: var(--ha-rim); pointer-events: none;
              -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
              -webkit-mask-composite: xor; mask-composite: exclude;
              backdrop-filter: blur(3px) saturate(2.4) brightness(1.7) contrast(1.15);
              -webkit-backdrop-filter: blur(3px) saturate(2.4) brightness(1.7) contrast(1.15);
              background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.06));
            }
            .ha-card::after {
              /* the frosted interior */
              content: ""; position: absolute; inset: var(--ha-rim); z-index: -1;
              border-radius: calc(16px - var(--ha-rim) + 2px); pointer-events: none;
              background: rgba(20,20,19,0.58);
              backdrop-filter: blur(22px) saturate(1.25);
              -webkit-backdrop-filter: blur(22px) saturate(1.25);
              box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
            }
            .ha-google {
              display: flex; align-items: center; justify-content: center; gap: 10px;
              width: 100%; padding: 12px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.15); background: transparent;
              color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500;
              cursor: default; position: relative;
            }
            .ha-google svg { width: 17px; height: 17px; }
            .ha-google.live {
              cursor: pointer; text-decoration: none;
              transition: border-color 0.2s ease, background 0.2s ease;
            }
            .ha-google.live:hover {
              border-color: rgba(255,255,255,0.35);
              background: rgba(255,255,255,0.05);
            }
            .ha-or {
              text-align: center; color: rgba(255,255,255,0.66);
              font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
            }
            .ha-email {
              width: 100%; padding: 12px 14px; border-radius: 10px;
              border: 1px solid rgba(255,255,255,0.13);
              background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.92);
              font-size: 14px; outline: none;
            }
            .ha-email::placeholder { color: rgba(255,255,255,0.62); }
            .ha-email:focus { border-color: rgba(255,255,255,0.35); }
            .ha-continue {
              width: 100%; padding: 12px; border-radius: 10px; border: none;
              background: #f0ede6; color: #1d1c19; cursor: pointer;
              font-family: var(--font-wordmark), system-ui, sans-serif;
              font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em;
              transition: transform 0.15s ease;
            }
            .ha-continue:hover { transform: scale(1.015); }
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

          <div className="ha-card">
            {status === "success" ? (
              <p className="ha-joined">{t("authJoined")}</p>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
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
                  <button
                    className="ha-continue"
                    type="submit"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "…" : t("authContinue")}
                  </button>
                </form>
                <p className="ha-note">
                  {status === "error" ? t("authError") : t("authNote")}
                </p>
              </>
            )}
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
