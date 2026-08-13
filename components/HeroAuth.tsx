"use client";

import { useRef, useState, FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import HeroCosmos from "@/components/HeroCosmos";

/** Real Google auth lives on /signin; the hero button routes there once a client id is configured. */
const GOOGLE_AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
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
 * Full-screen hero. Left column centered (claude.ai-style): headline, one
 * short line, auth card, one download button. Right: a quiet ASCII galaxy
 * (see HeroCosmos.tsx) that blends into the page background: no border,
 * no shadow, no fill.
 */

export default function HeroAuth() {
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
              /* film's right edge aligns with the header's last element (10vw
                 inset, same as the flat header); auth column centres in the rest */
              grid-template-columns: 1fr auto;
              gap: 32px; padding: 0 10vw 0 22px;
            }
            @media (max-width: 980px) {
              .hero-auth { grid-template-columns: 1fr; padding: 0 20px; }
            }

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

            .ha-card {
              width: 100%; max-width: 400px;
              border: 1px solid rgba(255,255,255,0.11); border-radius: 16px;
              background: rgba(255,255,255,0.03);
              padding: 22px; display: flex; flex-direction: column; gap: 12px;
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

            .ha-film {
              position: relative; justify-self: end; align-self: end;
              /* top edge meets the header (~90px), bottom keeps a 22px margin */
              width: min(48vw, calc((100svh - 112px) * 0.8), 640px);
              height: auto;
              margin-bottom: 22px;
              aspect-ratio: 4 / 5;
              min-width: 0; overflow: hidden; contain: layout paint style;
              /* no border, no shadow, no fill — the cosmos fades into the
                 page background (#141413) at its own edges */
            }
            @media (max-width: 980px) {
              .ha-film {
                width: min(86vw, calc(52svh * 0.8), 440px);
                height: auto; margin: 0 auto 24px; align-self: center;
              }
            }
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
        <div className="ha-left">
          <h1 className="ha-title">{t("heroTitle")}</h1>
          <p className="ha-tag">{t("heroTag2")}</p>
          {locale !== "en" && (
            <p className="ha-language">{t("productLanguageDisclosure")}</p>
          )}

          <div className="ha-card">
            {status === "success" ? (
              <p className="ha-joined">{t("authJoined")}</p>
            ) : (
              <>
                {(() => {
                  const googleMark = (
                    <svg viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  );
                  return GOOGLE_AUTH_ENABLED ? (
                    <Link
                      className="ha-google live"
                      href="/signin"
                      data-umami-event="hero-google-signin"
                    >
                      {googleMark}
                      {t("authGoogle")}
                    </Link>
                  ) : (
                    <button
                      className="ha-google"
                      type="button"
                      aria-disabled="true"
                    >
                      {googleMark}
                      {t("authGoogle")}
                    </button>
                  );
                })()}
                <div className="ha-or">{t("authOr")}</div>
                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <input
                    className="ha-email"
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

          <Link
            className="ha-dl"
            href="/download"
            data-umami-event="open-download-chooser"
            data-umami-event-placement="hero"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            {t("downloadFor")} {t("macOS")}
          </Link>

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

        <div className="ha-film" aria-hidden="true">
          <HeroCosmos />
        </div>
      </section>
    </>
  );
}
