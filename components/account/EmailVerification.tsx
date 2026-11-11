"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  EMAIL_CODE_DIGITS,
  billingFailure,
  confirmEmailVerification,
  sendEmailVerification,
  type Entitlement,
} from "@/lib/billing/api";
import { fieldErrorProps } from "@/lib/field-error";
import { normalizeEmailCode, verifyFailure } from "./email-verification";
import styles from "./account.module.css";

/**
 * Confirm the account's email address: email a 6-digit code, then enter it.
 * `onVerified` gets the new entitlement (or null when the address was
 * already confirmed and the caller should reload it).
 */
export default function EmailVerification({
  token,
  email,
  onVerified,
  onSessionEnded,
}: {
  token: string;
  email: string;
  onVerified: (entitlement: Entitlement | null) => void;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("account.verify");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const busyRef = useRef(false);
  const id = useId();
  const inputId = `verify-code-${id}`;
  const errorId = `${inputId}-error`;

  async function run(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setCodeInvalid(false);
    try {
      await action();
    } catch (caught) {
      const outcome = verifyFailure(billingFailure(caught));
      if (outcome === "session") onSessionEnded();
      else if (outcome === "verified") onVerified(null);
      else {
        setCodeInvalid(outcome === "errCode");
        setError(t(outcome));
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function send() {
    void run(async () => {
      await sendEmailVerification(token);
      setSent(true);
      setCode("");
    });
  }

  function confirm(event: FormEvent) {
    event.preventDefault();
    const digits = normalizeEmailCode(code);
    if (!digits) {
      setCodeInvalid(true);
      setError(t("errFormat", { digits: EMAIL_CODE_DIGITS }));
      document.getElementById(inputId)?.focus();
      return;
    }
    void run(async () => onVerified(await confirmEmailVerification(token, digits)));
  }

  if (!sent) {
    return (
      <div className={styles.verify}>
        <p>{t("body", { email })}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button className={styles.primary} type="button" disabled={busy} onClick={send}>
            {busy ? t("sending") : t("send")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.verify} onSubmit={confirm} noValidate aria-live="polite">
      <p role="status">{t("sent", { email, digits: EMAIL_CODE_DIGITS })}</p>
      <label htmlFor={inputId}>{t("codeLabel", { digits: EMAIL_CODE_DIGITS })}</label>
      <div className={styles.inline}>
        <input
          id={inputId}
          className={styles.code}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={12}
          disabled={busy}
          required
          {...fieldErrorProps(codeInvalid && Boolean(error), errorId)}
        />
        <button className={styles.primary} type="submit" disabled={busy || !code.trim()}>
          {busy ? t("confirming") : t("confirm")}
        </button>
      </div>
      {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="button" disabled={busy} onClick={send}>{t("resend")}</button>
      </div>
    </form>
  );
}
