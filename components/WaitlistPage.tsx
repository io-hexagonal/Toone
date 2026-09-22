"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import AccessAvatar from "@/components/AccessAvatar";
import { Link } from "@/lib/navigation";
import { accessAttribution } from "@/lib/explore/presentation";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const locale = useLocale();
  const t = useTranslations("landing");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const submitting = useRef(false);

  // The announcement card sends non-Mac visitors here with #notify: land them in the field.
  useEffect(() => {
    if (window.location.hash !== "#notify") return;
    window.history.replaceState(null, "", window.location.pathname);
    document.querySelector<HTMLInputElement>("[data-early-access-input]")?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !event.currentTarget.checkValidity()) return;

    submitting.current = true;
    setStatus("loading");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "web" }),
      });
      if (!response.ok) throw new Error("waitlist request failed");
      const outcome = await response.json();
      const params = new URLSearchParams(window.location.search);
      const attribution = accessAttribution(params.get("from"), params.get("item"));
      if (outcome.outcome_state === "created" && outcome.outcome_id) {
        (window as unknown as { umami?: { track: (name: string, data: Record<string, string>) => void } }).umami?.track(
          "waitlist-signup", { source: "web", locale, outcome_id: outcome.outcome_id, ...attribution },
        );
      }
      setStatus("success");
    } catch {
      submitting.current = false;
      setStatus("error");
    }
  }

  return (
    <main className="waitlist-page">
      <style>{`
        .waitlist-page {
          min-height: 100svh; background: #141413; padding: 48px 20px 64px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .waitlist-brand {
          display: inline-flex; align-items: center; gap: 10px; margin-bottom: 34px;
          color: rgba(255,255,255,.92); text-decoration: none;
        }
        .waitlist-brand img { width: 30px; height: 30px; }
        .waitlist-brand span {
          font-family: var(--font-wordmark), system-ui, sans-serif; font-size: 20px;
          font-weight: 600; letter-spacing: -.03em; text-transform: lowercase;
        }
        .waitlist-title {
          color: rgba(255,255,255,.95); font-family: var(--font-wordmark), system-ui, sans-serif;
          font-size: 32px; font-weight: 600; letter-spacing: -.025em; line-height: 1.1;
          margin: 0 0 10px; text-align: center;
        }
        .waitlist-sub {
          color: rgba(255,255,255,.56); font-size: 15px; line-height: 1.55;
          margin: 0 0 26px; max-width: 42ch; text-align: center;
        }
        .waitlist-card {
          width: 100%; max-width: 400px; border: 1px solid rgba(255,255,255,.11);
          border-radius: 16px; background: rgba(255,255,255,.03); padding: 22px;
        }
        .waitlist-form { display: flex; flex-direction: column; gap: 12px; }
        .waitlist-input {
          width: 100%; padding: 12px 14px; border: 1px solid rgba(255,255,255,.13);
          border-radius: 10px; background: rgba(255,255,255,.05);
          color: rgba(255,255,255,.92); font-size: 14px; outline: none;
        }
        .waitlist-input::placeholder { color: rgba(255,255,255,.62); }
        .waitlist-input:focus { border-color: rgba(255,255,255,.35); }
        .waitlist-submit {
          width: 100%; padding: 12px; border: 0; border-radius: 10px;
          background: #f0ede6; color: #1d1c19; cursor: pointer;
          font-family: var(--font-wordmark), system-ui, sans-serif; font-size: 14.5px;
          font-weight: 600;
        }
        .waitlist-submit:disabled { cursor: default; opacity: .65; }
        .waitlist-message { margin: 0; font-size: 13px; line-height: 1.5; text-align: center; }
        .waitlist-message.success { color: rgba(179,232,194,.92); }
        .waitlist-message.error { color: rgba(255,138,122,.95); }
        /* Explainer under the form: same width as the card, quiet type, a
           hairline above so it reads as supporting copy, not the page itself. */
        .waitlist-intro {
          width: 100%; max-width: 400px; margin: 40px 0 0; padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,.09);
        }
        .waitlist-intro p {
          color: rgba(255,255,255,.6); font-size: 14px; line-height: 1.65; margin: 0 0 24px;
        }
        .waitlist-intro-cols { display: grid; gap: 24px; grid-template-columns: 1fr; }
        .waitlist-intro h2 {
          color: rgba(255,255,255,.88); font-family: var(--font-wordmark), system-ui, sans-serif;
          font-size: 14px; font-weight: 600; letter-spacing: -.01em; margin: 0 0 8px;
        }
        .waitlist-intro ul, .waitlist-intro ol {
          color: rgba(255,255,255,.6); font-size: 14px; line-height: 1.55;
          margin: 0; padding-left: 18px;
        }
        .waitlist-intro li { margin: 0 0 6px; padding-left: 2px; }
        .waitlist-intro li::marker { color: rgba(255,255,255,.35); }
        .waitlist-intro li:last-child { margin-bottom: 0; }
        .waitlist-language {
          color: rgba(255,255,255,.5); font-size: 13px; line-height: 1.5;
          margin: 0 0 14px; text-align: center; max-width: 42ch;
        }
        .waitlist-existing { color: rgba(255,255,255,.65); font-size: 13.5px; margin: 20px 0 0; text-align: center; }
        .waitlist-existing + .waitlist-existing { margin-top: 8px; }
        .waitlist-existing a { color: rgba(255,255,255,.9); text-decoration: none; }
        .waitlist-existing a:hover { text-decoration: underline; }
      `}</style>

      <Link href="/" aria-label="Toone" className="waitlist-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" />
        <span>toone</span>
      </Link>

      <AccessAvatar />

      <h1 className="waitlist-title">{t("waitlistTitle")}</h1>
      <p className="waitlist-sub">{t("waitlistSub")}</p>

      {/* Product-language disclosure, stated before the conversion action on
          every locale (technical baseline: product-language row). */}
      <p className="waitlist-language">{t("productLanguageDisclosure")}</p>

      <div className="waitlist-card">
        {status === "success" ? (
          <p className="waitlist-message success" role="status">{t("authJoined")}</p>
        ) : (
          <form className="waitlist-form" onSubmit={handleSubmit}>
            <input
              className="waitlist-input"
              data-early-access-input=""
              type="email"
              autoComplete="email"
              placeholder={t("authEmailPh")}
              aria-label={t("authEmailPh")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button className="waitlist-submit" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "…" : t("authContinue")}
            </button>
            {status === "error" && (
              <p className="waitlist-message error" role="alert">{t("authError")}</p>
            )}
          </form>
        )}
      </div>

      <p className="waitlist-existing">
        {t("waitlistExisting")} <Link href="/signin">{t("waitlistSignIn")}</Link>
      </p>
      <p className="waitlist-existing"><Link href="/invite">{t("haveInvitation")}</Link></p>

      {/* Supporting copy for search and for people who want the details; every
          locale carries it now that the strings are translated. */}
      <section className="waitlist-intro">
        <p>{t("eaIntro")}</p>
        <div className="waitlist-intro-cols">
          <div>
            <h2>{t("eaBeforeTitle")}</h2>
            <ul>
              <li>{t("eaBefore1")}</li>
              <li>{t("eaBefore2")}</li>
              <li>{t("eaBefore3")}</li>
            </ul>
          </div>
          <div>
            <h2>{t("eaHowTitle")}</h2>
            <ol>
              <li>{t("eaStep1")}</li>
              <li>{t("eaStep2")}</li>
              <li>{t("eaStep3")}</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
