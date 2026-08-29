"use client";

import { FormEvent, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const t = useTranslations("landing");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const submitting = useRef(false);

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
        .waitlist-existing { color: rgba(255,255,255,.65); font-size: 13.5px; margin-top: 20px; }
        .waitlist-existing a { color: rgba(255,255,255,.9); text-decoration: none; }
        .waitlist-existing a:hover { text-decoration: underline; }
      `}</style>

      <Link href="/" aria-label="Toone" className="waitlist-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" />
        <span>toone</span>
      </Link>

      <h1 className="waitlist-title">{t("waitlistTitle")}</h1>
      <p className="waitlist-sub">{t("waitlistSub")}</p>

      <div className="waitlist-card">
        {status === "success" ? (
          <p className="waitlist-message success" role="status">{t("authJoined")}</p>
        ) : (
          <form className="waitlist-form" onSubmit={handleSubmit}>
            <input
              className="waitlist-input"
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
    </main>
  );
}
