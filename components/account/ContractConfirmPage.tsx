"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { confirmContractRequest, type ContractConfirmation } from "@/lib/billing/api";
import { confirmFailure, outcomeCopy, takeContractToken, type ConfirmFailure } from "./contract-confirm";
import styles from "./account.module.css";

const SUPPORT_EMAIL = "hello@trytoone.com";

type Step =
  /** Before the browser has read the address (also the server HTML). */
  | { name: "reading" }
  /** No usable token in the link. */
  | { name: "missing" }
  | { name: "ready"; token: string; error: Exclude<ConfirmFailure, "expired"> | null }
  | { name: "confirming"; token: string }
  | { name: "done"; confirmation: ContractConfirmation; at: Date }
  | { name: "expired" };

/**
 * Finishes a withdrawal or cancellation from the emailed link. Opening the
 * page changes nothing; only the Confirm button sends the token.
 */
export default function ContractConfirmPage() {
  const t = useTranslations("account.contractConfirm");
  const locale = useLocale();
  const [step, setStep] = useState<Step>({ name: "reading" });
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // Taking the token consumes it, so it is taken once per page (effects may run twice in development).
  const taken = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (taken.current === undefined) taken.current = takeContractToken(window);
    const token = taken.current;
    setStep(token ? { name: "ready", token, error: null } : { name: "missing" });
  }, []);

  useEffect(() => {
    if (step.name === "done" || step.name === "expired") heading.current?.focus();
  }, [step.name]);

  async function confirm(token: string) {
    if (busy.current) return;
    busy.current = true;
    setStep({ name: "confirming", token });
    try {
      const confirmation = await confirmContractRequest(token);
      setStep({ name: "done", confirmation, at: new Date() });
    } catch (caught) {
      const failure = confirmFailure(caught);
      setStep(failure === "expired" ? { name: "expired" } : { name: "ready", token, error: failure });
    } finally {
      busy.current = false;
    }
  }

  const copy = step.name === "done" ? outcomeCopy(step.confirmation) : null;
  const title = step.name === "done" && copy ? t(copy.title)
    : step.name === "missing" ? t("missingTitle")
      : step.name === "expired" ? t("expiredTitle")
        : t("title");

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
          <h1 ref={heading} tabIndex={-1}>{title}</h1>
        </div>

        <section className={styles.panel} aria-live="polite">
          {step.name === "reading" && <p role="status">{t("reading")}</p>}

          {(step.name === "ready" || step.name === "confirming") && <>
            <p>{t("body")}</p>
            <p className={styles.notice}>{t("safety")}</p>
            {step.name === "ready" && step.error && (
              <p className={styles.error} role="alert">
                {step.error === "errUnavailable" ? t("errUnavailable", { email: SUPPORT_EMAIL }) : t(step.error)}
              </p>
            )}
            <div className={styles.actions}>
              <button className={styles.primary} type="button" disabled={step.name === "confirming"}
                onClick={() => void confirm(step.token)} data-umami-event="contract-confirm">
                {step.name === "confirming" ? t("confirming") : t("confirm")}
              </button>
            </div>
          </>}

          {step.name === "done" && copy && <>
            <p className={styles.ok} role="status">{t(copy.body)}</p>
            <p>{t("doneAt", { at: step.at.toLocaleString(locale, { dateStyle: "long", timeStyle: "short" }) })}</p>
            <p className={styles.notice}>{t("doneEmail")}</p>
            {copy.offerWithdraw && (
              <p className={styles.notice}>
                {t.rich("nothingWithdraw", { link: (chunks) => <Link href="/cancel-contract?kind=withdraw">{chunks}</Link> })}
              </p>
            )}
          </>}

          {step.name === "missing" && <>
            <p>{t("missingBody")}</p>
            <div className={styles.actions}>
              <Link className={styles.button} href="/cancel-contract">{t("startAgain")}</Link>
            </div>
          </>}

          {step.name === "expired" && <>
            <p>{t("expiredBody")}</p>
            <div className={styles.actions}>
              <Link className={`${styles.button} ${styles.primary}`} href="/cancel-contract">{t("startAgain")}</Link>
            </div>
          </>}
        </section>

        <div className={styles.stack} style={{ marginTop: 16 }}>
          <p className={styles.notice}>
            {t.rich("terms", { link: (chunks) => <Link href="/terms#withdrawal">{chunks}</Link> })}
          </p>
        </div>
      </div>
    </main>
  );
}
