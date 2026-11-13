"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { billingFailure, checkInvitationBenefit, type CodeBenefit } from "@/lib/billing/api";
import { rememberPendingCode } from "@/lib/billing/pending-code";
import { fieldErrorProps } from "@/lib/field-error";
import { benefitCopy, codeCampaign, normalizeCode, redeemErrorKey, type CodeCampaign } from "./redeem-code";
import styles from "./account.module.css";

/** A code the public check accepted, and what the visitor can do with it. */
export type CheckedCode = {
  /** As typed (trimmed, upper case); the server matches it like the canonical form. */
  code: string;
  benefit: CodeBenefit;
  /** False for a code that only works on an existing account. */
  admitsSignup: boolean;
  campaign: CodeCampaign | null;
};

type Step = { name: "enter" } | { name: "valid"; checked: CheckedCode };

/**
 * /redeem, signed out: the code comes first. It is checked with the public
 * invitation check (nothing is used up), then the visitor creates an account
 * with it or signs in to redeem it. The code stays in memory and in this
 * tab's sessionStorage (for a redirect sign-in), never in the address, and is
 * never sent to analytics.
 */
export default function RedeemCodeGate({
  initialCode,
  refCampaign,
  onCreateAccount,
  onSignIn,
}: {
  initialCode: string | null;
  /** A campaign the link named (`?ref=producthunt`), shown before any code is checked. */
  refCampaign: CodeCampaign | null;
  onCreateAccount: (checked: CheckedCode) => void;
  /** Sign in, then redeem the checked code (null: sign in without one). */
  onSignIn: (checked: CheckedCode | null) => void;
}) {
  const t = useTranslations("account.redeem");
  const tAccount = useTranslations("account");
  const [code, setCode] = useState(initialCode ?? "");
  const [step, setStep] = useState<Step>({ name: "enter" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const busyRef = useRef(false);
  const autoChecked = useRef(false);

  async function check(value: string) {
    if (busyRef.current) return;
    const typed = value.trim().toUpperCase();
    if (!normalizeCode(typed)) {
      setCodeInvalid(true);
      setError(t("errInvalid"));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    setCodeInvalid(false);
    try {
      const result = await checkInvitationBenefit(typed);
      if (!result.valid) {
        setCodeInvalid(true);
        setError(t("errInvalid"));
        return;
      }
      rememberPendingCode(typed);
      setStep({
        name: "valid",
        checked: {
          code: typed,
          benefit: result.benefit,
          admitsSignup: result.admits_signup,
          campaign: codeCampaign(typed, result.label),
        },
      });
    } catch (caught) {
      const key = redeemErrorKey(billingFailure(caught));
      setCodeInvalid(key === "errInvalid" || key === "errUsed");
      setError(t(key === "errInvalid" || key === "errRate" ? key : "errGeneric"));
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

  const campaign = step.name === "valid" ? step.checked.campaign ?? refCampaign : refCampaign;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
        </header>
        <div className={styles.title}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("gateTitle")}</h1>
          <p className={styles.sub}>{t("gateSub")}</p>
        </div>
        <section className={styles.panel} aria-live="polite">
          {campaign && <CampaignWelcome campaign={campaign} benefit={step.name === "valid" ? step.checked.benefit : null} />}
          {step.name === "valid" ? (
            <ValidCode checked={step.checked} onCreateAccount={onCreateAccount} onSignIn={onSignIn} onChange={reset} />
          ) : (
            <form onSubmit={submit} noValidate>
              <label htmlFor="redeem-gate-code">{t("label")}</label>
              <div className={styles.inline}>
                <input
                  id="redeem-gate-code"
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
                  autoFocus
                  {...fieldErrorProps(codeInvalid && Boolean(error), "redeem-gate-code-error", "redeem-gate-code-help")}
                />
                <button className={styles.primary} type="submit" disabled={busy || !code.trim()}>
                  {busy ? t("checking") : t("gateContinue")}
                </button>
              </div>
              <small id="redeem-gate-code-help">{t("help")}</small>
              {error && <p id="redeem-gate-code-error" className={styles.error} role="alert">{error}</p>}
            </form>
          )}
        </section>
        {step.name === "enter" && (
          <p className={`${styles.notice} ${styles.gateFoot}`}>
            {t("gateHaveAccount")}{" "}
            <button type="button" className={styles.linkButton} onClick={() => onSignIn(null)}>{t("gateSignIn")}</button>
          </p>
        )}
        <nav className={styles.footerLinks} aria-label={tAccount("page.moreLinks")}>
          <Link href="/terms#codes">{tAccount("common.terms")}</Link>
        </nav>
      </div>
    </main>
  );
}

/** The welcome for a campaign: a text badge for AppSumo, the launch kitty for Product Hunt. */
export function CampaignWelcome({ campaign, benefit }: { campaign: CodeCampaign; benefit: CodeBenefit | null }) {
  const t = useTranslations("account.redeem");
  if (campaign === "appsumo") {
    return (
      <div className={styles.welcome} data-campaign="appsumo">
        <div>
          <p className={styles.badge}>{t("appsumoBadge")}</p>
          <h2>{t("appsumoTitle")}</h2>
          <p>{benefit && benefit.kind !== "pro_lifetime" ? t("appsumoSubOther") : t("appsumoSub")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.welcome} data-campaign="producthunt">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.kitty} src="/assets/launch/ph-kitty.png" alt="" width={72} height={72} />
      <div>
        <h2>{t("launchTitle")}</h2>
        <p>{t("launchSub")}</p>
      </div>
    </div>
  );
}

export function ValidCode({
  checked,
  onCreateAccount,
  onSignIn,
  onChange,
}: {
  checked: CheckedCode;
  onCreateAccount: (checked: CheckedCode) => void;
  onSignIn: (checked: CheckedCode | null) => void;
  onChange: () => void;
}) {
  const t = useTranslations("account.redeem");
  const copy = benefitCopy(checked.benefit);
  const benefit = checked.benefit.kind === "none" ? null : "values" in copy ? t(copy.key, copy.values) : t(copy.key);
  // The AppSumo welcome already says "lifetime Toone Pro".
  const sayBenefit = benefit && !(checked.campaign === "appsumo" && checked.benefit.kind === "pro_lifetime");
  return (
    <div className={styles.validCode}>
      {!checked.campaign && <h2>{t("gateValidTitle")}</h2>}
      {sayBenefit && <p>{t("preview", { benefit })}</p>}
      <p className={`${styles.summary} ${styles.code}`}>{checked.code}</p>
      {!checked.admitsSignup && <p className={styles.notice}>{t("gateExistingOnly")}</p>}
      <div className={styles.actions}>
        {checked.admitsSignup && (
          <button className={styles.primary} type="button" onClick={() => onCreateAccount(checked)}>{t("gateCreateAccount")}</button>
        )}
        <button className={checked.admitsSignup ? undefined : styles.primary} type="button" onClick={() => onSignIn(checked)}>
          {t("gateSignInRedeem")}
        </button>
      </div>
      <button type="button" className={styles.linkButton} onClick={onChange}>{t("change")}</button>
    </div>
  );
}
