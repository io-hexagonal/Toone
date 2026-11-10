"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import {
  billingFailure,
  checkCode,
  redeemCode,
  type CodeBenefit,
  type Entitlement,
} from "@/lib/billing/api";
import { forgetPendingCode } from "@/lib/billing/pending-code";
import { fieldErrorProps } from "@/lib/field-error";
import { benefitCopy, normalizeCode, redeemDoneCopy, redeemErrorKey } from "./redeem-code";
import styles from "./account.module.css";

type Step =
  | { name: "enter" }
  | { name: "preview"; code: string; benefit: CodeBenefit }
  | { name: "done"; benefit: CodeBenefit; entitlement: Entitlement };

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Check a code (nothing is used up), show what it gives, then redeem it.
 * `initialCode` (from a link) is checked straight away.
 */
export default function RedeemForm({
  token,
  initialCode = "",
  onSessionEnded,
  onRedeemed,
  headingLevel = 2,
}: {
  token: string;
  initialCode?: string;
  onSessionEnded: () => void;
  onRedeemed?: (entitlement: Entitlement) => void;
  headingLevel?: 2 | 3;
}) {
  const t = useTranslations("account.redeem");
  const locale = useLocale();
  const [code, setCode] = useState(initialCode);
  const [step, setStep] = useState<Step>({ name: "enter" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** True when the error is about the code itself (not a rate limit or an outage). */
  const [codeInvalid, setCodeInvalid] = useState(false);
  const busyRef = useRef(false);
  const autoChecked = useRef(false);

  function fail(caught: unknown) {
    const failure = billingFailure(caught);
    if (failure.kind === "unauthenticated") {
      onSessionEnded();
      return;
    }
    const key = redeemErrorKey(failure);
    setCodeInvalid(key === "errInvalid" || key === "errUsed");
    setError(t(key));
  }

  async function check(value: string) {
    if (busyRef.current) return;
    const canonical = normalizeCode(value);
    if (!canonical) {
      setCodeInvalid(true);
      setError(t("errInvalid"));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    setCodeInvalid(false);
    try {
      const result = await checkCode(token, canonical);
      setStep({ name: "preview", code: canonical, benefit: result.benefit });
    } catch (caught) {
      fail(caught);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function redeem(canonical: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await redeemCode(token, canonical);
      forgetPendingCode();
      setStep({ name: "done", benefit: result.benefit, entitlement: result.entitlement });
      onRedeemed?.(result.entitlement);
    } catch (caught) {
      fail(caught);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!initialCode || autoChecked.current) return;
    autoChecked.current = true;
    void check(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void check(code);
  }

  function reset() {
    setStep({ name: "enter" });
    setError("");
    setCodeInvalid(false);
    setCode("");
  }

  const Heading = headingLevel === 2 ? "h2" : "h3";

  if (step.name === "done") {
    const done = redeemDoneCopy(step.benefit, step.entitlement);
    const line = done.key === "doneProUntil"
      ? t("doneProUntil", { date: formatDate(done.date, locale) })
      : done.key === "doneCreations"
        ? t("doneCreations", done.values)
        : t(done.key);
    return (
      <div aria-live="polite">
        <Heading>{t("doneTitle")}</Heading>
        <p className={styles.ok} role="status">{line}</p>
        <p className={styles.notice}>{t("doneNote")}</p>
        <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.primary}`} href="/downloads">{t("download")}</Link>
          <button type="button" onClick={reset}>{t("another")}</button>
        </div>
      </div>
    );
  }

  if (step.name === "preview") {
    const copy = benefitCopy(step.benefit);
    const benefit = "values" in copy ? t(copy.key, copy.values) : t(copy.key);
    return (
      <div aria-live="polite">
        <Heading>{t("previewTitle")}</Heading>
        <p>{t("preview", { benefit })}</p>
        <p className={`${styles.summary} ${styles.code}`}>{step.code}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button className={styles.primary} type="button" disabled={busy} onClick={() => void redeem(step.code)}>
            {busy ? t("redeeming") : t("redeem")}
          </button>
          <button type="button" disabled={busy} onClick={reset}>{t("change")}</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="redeem-code">{t("label")}</label>
      <div className={styles.inline}>
        <input
          id="redeem-code"
          className={styles.code}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t("placeholder")}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={80}
          disabled={busy}
          required
          {...fieldErrorProps(codeInvalid && Boolean(error), "redeem-code-error", "redeem-code-help")}
        />
        <button className={styles.primary} type="submit" disabled={busy || !code.trim()}>
          {busy ? t("checking") : t("check")}
        </button>
      </div>
      <small id="redeem-code-help">{t("help")}</small>
      {error && <p id="redeem-code-error" className={styles.error} role="alert">{error}</p>}
    </form>
  );
}
