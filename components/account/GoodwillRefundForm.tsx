"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fieldErrorProps } from "@/lib/field-error";
import { TOONE_PRO_WITHDRAWAL_DAYS } from "@/lib/legal/terms";
import {
  GOODWILL_ERROR_FIELD,
  GOODWILL_NAME_MAX,
  GOODWILL_REASON_MAX_LENGTH,
  GOODWILL_REASON_MIN_LENGTH,
  goodwillRefundFrom,
  reasonLength,
  type GoodwillInputError,
  type GoodwillRefundRequest,
} from "@/lib/billing/goodwill-refund";
import { HONEYPOT_FIELD } from "@/lib/contact-guard";
import HoneypotField from "../HoneypotField";
import { ORDER_REF_MAX } from "./contract-request";
import styles from "./account.module.css";

const SUPPORT_EMAIL = "hello@trytoone.com";
const ERROR_ID = "goodwill-error";

/**
 * "Ask for a goodwill refund (Lifetime)": a voluntary request, separate from
 * the statutory withdrawal (which never needs a reason). The purchase email,
 * the order reference and a reason of at least 20 characters go to
 * `/api/contact` (`kind: "goodwill_refund"`), which posts them to the team;
 * the owner reviews the request and answers by email.
 */
export default function GoodwillRefundForm() {
  const t = useTranslations("account.contract");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [reason, setReason] = useState("");
  const [person, setPerson] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<GoodwillInputError | "send" | null>(null);
  const [sent, setSent] = useState<GoodwillRefundRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const length = reasonLength(reason);
  const errorField = error && error !== "send" ? GOODWILL_ERROR_FIELD[error] : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    const checked = goodwillRefundFrom({ email, orderRef, reason, name: person, locale });
    if (!checked.ok) {
      setError(checked.error);
      document.getElementById(GOODWILL_ERROR_FIELD[checked.error])?.focus();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...checked.request, [HONEYPOT_FIELD]: honeypot }),
      });
      if (res.ok) {
        setSent(checked.request);
        setOrderRef("");
        setReason("");
      } else {
        setError("send");
      }
    } catch {
      setError("send");
    }
    busyRef.current = false;
    setBusy(false);
  }

  function message(key: GoodwillInputError) {
    switch (key) {
      case "goodwillErrEmail": return t("errEmail");
      case "goodwillErrOrderRef": return t("errOrderRef");
      case "goodwillErrName": return t("errName", { max: GOODWILL_NAME_MAX });
      case "goodwillErrReason": return t("goodwillErrReason", { min: GOODWILL_REASON_MIN_LENGTH, max: GOODWILL_REASON_MAX_LENGTH });
    }
  }

  return (
    <section id="goodwill-refund" className={styles.panel} aria-labelledby="goodwill-refund-title" style={{ marginTop: 16 }}>
      <h2 id="goodwill-refund-title">{t("goodwillTitle")}</h2>
      <p>{t("goodwillBody", { days: TOONE_PRO_WITHDRAWAL_DAYS })}</p>
      <p className={styles.notice}>{t("goodwillEarlier")}</p>
      {sent ? (
        <div aria-live="polite">
          <p className={styles.ok} role="status">{t("goodwillSent", { email: sent.email })}</p>
          <p className={styles.notice}>{t("goodwillNote")}</p>
          <div className={styles.actions} style={{ marginTop: 12 }}>
            <button type="button" onClick={() => setSent(null)}>{t("another")}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} noValidate>
          <label htmlFor="goodwill-email">{t("email")}</label>
          <input id="goodwill-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)}
            autoComplete="email" maxLength={254} required
            {...fieldErrorProps(errorField === "goodwill-email", ERROR_ID)} />
          <label htmlFor="goodwill-order">{t("orderRef")}</label>
          <input id="goodwill-order" value={orderRef} onChange={(event) => setOrderRef(event.target.value)}
            autoComplete="off" spellCheck={false} maxLength={ORDER_REF_MAX} required
            {...fieldErrorProps(errorField === "goodwill-order", ERROR_ID, "goodwill-order-help")} />
          <small id="goodwill-order-help">{t("orderRefHelp")}</small>
          <label htmlFor="goodwill-reason">{t("goodwillReason")}</label>
          <textarea id="goodwill-reason" value={reason} rows={4} maxLength={GOODWILL_REASON_MAX_LENGTH} required
            minLength={GOODWILL_REASON_MIN_LENGTH} onChange={(event) => setReason(event.target.value)}
            {...fieldErrorProps(errorField === "goodwill-reason", ERROR_ID, "goodwill-reason-help")} />
          <small id="goodwill-reason-help" aria-live="polite">
            {length < GOODWILL_REASON_MIN_LENGTH
              ? t("goodwillReasonHelp", { min: GOODWILL_REASON_MIN_LENGTH, count: length })
              : t("goodwillReasonOk")}
          </small>
          <label htmlFor="goodwill-name">{t("name")}</label>
          <input id="goodwill-name" value={person} onChange={(event) => setPerson(event.target.value)}
            autoComplete="name" maxLength={GOODWILL_NAME_MAX}
            {...fieldErrorProps(errorField === "goodwill-name", ERROR_ID)} />
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          {error && (
            <p id={ERROR_ID} className={styles.error} role="alert">
              {error === "send"
                ? t.rich("goodwillErrSend", {
                  email: SUPPORT_EMAIL,
                  link: (chunks) => <a href={`mailto:${SUPPORT_EMAIL}`}>{chunks}</a>,
                })
                : message(error)}
            </p>
          )}
          <div className={styles.actions} style={{ marginTop: 18 }}>
            <button className={styles.primary} type="submit" disabled={busy}>
              {busy ? t("sending") : t("goodwillSubmit")}
            </button>
          </div>
          <p className={styles.notice}>{t("goodwillNote")}</p>
        </form>
      )}
    </section>
  );
}
