"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  billingFailure,
  checkCode,
  redeemCode,
  type CodeBenefit,
  type Entitlement,
} from "@/lib/billing/api";
import { forgetPendingCode } from "@/lib/billing/pending-code";
import { fieldErrorProps } from "@/lib/field-error";
import {
  benefitCopy,
  isAlreadyProError,
  normalizeCode,
  redeemErrorKey,
  type RedeemErrorKey,
} from "./redeem-code";
import EmailVerification from "./EmailVerification";
import RedeemDone from "./RedeemDone";
import styles from "./account.module.css";

type Step =
  | { name: "enter" }
  | { name: "preview"; code: string; benefit: CodeBenefit }
  | { name: "done"; benefit: CodeBenefit; entitlement: Entitlement };

/** Where a buyer whose code cannot be used asks for help with a reseller refund. */
const CONTACT = "hello@trytoone.com";

/**
 * Check a code (nothing is used up), show what it gives, then redeem it.
 * `initialCode` (from a link) is checked straight away. When the server asks
 * for a confirmed email address first, the confirmation step appears here,
 * and the code is checked or redeemed again once the address is confirmed.
 */
export default function RedeemForm({
  token,
  email,
  initialCode = "",
  onSessionEnded,
  onRedeemed,
  headingLevel = 2,
}: {
  token: string;
  /** The account's address, named by the email-confirmation step. */
  email: string;
  initialCode?: string;
  onSessionEnded: () => void;
  onRedeemed?: (entitlement: Entitlement) => void;
  headingLevel?: 2 | 3;
}) {
  const t = useTranslations("account.redeem");
  const [code, setCode] = useState(initialCode);
  const [step, setStep] = useState<Step>({ name: "enter" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** Which refusal `error` is, for the help that goes with it. */
  const [errorKey, setErrorKey] = useState<RedeemErrorKey | null>(null);
  /** True when the error is about the code itself (not a rate limit or an outage). */
  const [codeInvalid, setCodeInvalid] = useState(false);
  /** The server refused with `email_verification_required`: offer the confirmation step. */
  const [needsVerify, setNeedsVerify] = useState(false);
  const busyRef = useRef(false);
  const autoChecked = useRef(false);

  function fail(caught: unknown) {
    const failure = billingFailure(caught);
    if (failure.kind === "unauthenticated") {
      onSessionEnded();
      return;
    }
    const key = redeemErrorKey(failure);
    setErrorKey(key);
    setCodeInvalid(key === "errInvalid" || key === "errUsed");
    setNeedsVerify(key === "errVerify");
    setError(t(key));
  }

  /** The address is confirmed: try the step that asked for it again. */
  function verified() {
    setNeedsVerify(false);
    setError("");
    if (step.name === "preview") void redeem(step.code);
    else if (code.trim()) void check(code);
  }

  // Already Pro (409): the code is not used up, so a reseller can still refund it.
  const refundHelp = error && isAlreadyProError(errorKey) && (
    <p className={styles.notice}>
      {t.rich("errAlreadyProRefund", { link: (chunks) => <a href={`mailto:${CONTACT}`}>{chunks}</a> })}
    </p>
  );

  const verification = needsVerify && (
    <EmailVerification token={token} email={email} onVerified={verified} onSessionEnded={onSessionEnded} />
  );

  async function check(value: string) {
    if (busyRef.current) return;
    const canonical = normalizeCode(value);
    if (!canonical) {
      setCodeInvalid(true);
      setErrorKey("errInvalid");
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
    setNeedsVerify(false);
    setCode("");
  }

  const Heading = headingLevel === 2 ? "h2" : "h3";

  if (step.name === "done") {
    return (
      <RedeemDone benefit={step.benefit} entitlement={step.entitlement} email={email} title={t("doneTitle")} headingLevel={headingLevel}>
        <button type="button" onClick={reset}>{t("another")}</button>
      </RedeemDone>
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
        {refundHelp}
        {verification}
        <div className={styles.actions}>
          <button className={styles.primary} type="button" disabled={busy} onClick={() => void redeem(step.code)}>
            {busy ? t("redeeming") : t("redeem")}
          </button>
          <button type="button" disabled={busy} onClick={reset}>{t("change")}</button>
        </div>
      </div>
    );
  }

  const form = (
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
      {refundHelp}
    </form>
  );
  // The confirmation step is its own form, so it sits next to the code form, not inside it.
  return verification ? <>{form}{verification}</> : form;
}
