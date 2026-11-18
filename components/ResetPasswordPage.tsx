"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ApiError, requestPasswordReset, resetPassword } from "@/lib/api";
import { AUTH_PAGE_CSS } from "@/components/AuthPage";

/** Forgot password: email → emailed 6-digit code + new password → signed in. */
export default function ResetPasswordPage() {
  const t = useTranslations("auth.reset");
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const match = /(?:^|&)email=([^&]*)/.exec(window.location.hash.slice(1));
    if (match) setEmail(decodeURIComponent(match[1]));
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  function message(e: unknown): string {
    if (e instanceof ApiError) {
      if (e.code === "unauthorized") return t("errCode");
      if (e.code === "rate_limit_exceeded") return t("errRate");
      if (e.code === "invalid_input") return t("errPassword");
    }
    return t("errUnavailable");
  }

  async function sendCode(again: boolean) {
    setError(null); setResent(false); setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStep("code");
      if (again) setResent(true);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step === "email") return sendCode(false);
    setError(null); setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), password);
      setStep("done");
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_PAGE_CSS }} />
      <main className="auth-page">
        <Link href="/" aria-label="Toone" className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/brand/toone-mark.svg" alt="" />
          <span className="wm">toone</span>
        </Link>
        <h1 className="auth-title">{step === "done" ? t("doneTitle") : t("title")}</h1>
        <p className="auth-sub">{step === "email" ? t("sub") : step === "code" ? t("sentNote") : t("doneSub")}</p>
        <div className="auth-card">
          {step === "done" ? (
            <div style={{ textAlign: "center" }}>
              <Link className="auth-submit" href="/account" style={{ display: "block", textDecoration: "none" }}>{t("toAccount")}</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <input className="auth-input" type="email" aria-label={t("emailPh")} placeholder={t("emailPh")}
                autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required readOnly={step === "code"} autoFocus={step === "email"} />
              {step === "code" && <>
                <input className="auth-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
                  aria-label={t("codeLabel")} placeholder={t("codeLabel")} maxLength={6} required autoFocus
                  value={code} onChange={(e) => setCode(e.target.value)} />
                <input className="auth-input" type={showPassword ? "text" : "password"} autoComplete="new-password"
                  aria-label={t("newPasswordPh")} placeholder={t("newPasswordPh")} minLength={8} maxLength={72} required
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="auth-signout" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? t("hide") : t("show")}
                </button>
              </>}
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "…" : step === "email" ? t("sendBtn") : t("submitBtn")}
              </button>
            </form>
          )}
          {error && <p className="auth-error">{error}</p>}
          {step === "code" && (
            <div style={{ textAlign: "center" }}>
              {resent && <p className="auth-sub" role="status" style={{ margin: "4px 0" }}>{t("resent")}</p>}
              <button className="auth-signout" type="button" disabled={loading} onClick={() => void sendCode(true)}>{t("resend")}</button>
              {" · "}
              <button className="auth-signout" type="button" disabled={loading}
                onClick={() => { setError(null); setCode(""); setStep("email"); }}>{t("changeEmail")}</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
