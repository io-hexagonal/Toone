"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { submitContractRequest } from "@/lib/billing/api";
import { APPLE_REPORT_A_PROBLEM_URL } from "@/lib/legal/terms";
import { ORDER_REF_MAX, contractOutcome, contractRequestFrom, type ContractKind } from "./contract-request";
import styles from "./account.module.css";

type Step =
  | { name: "choose" }
  | { name: "details"; kind: ContractKind }
  | { name: "confirm"; kind: ContractKind; email: string; orderRef: string }
  | { name: "sent"; kind: ContractKind; email: string; at: Date };

const SUPPORT_EMAIL = "hello@trytoone.com";

/**
 * "Withdraw from contract here" and "Cancel contract here", without signing
 * in: (1) the purchase email and order reference, (2) an explicit confirm
 * button, then the same acknowledgement for every request. The emailed link
 * is what changes anything.
 */
export default function ContractRequestPage() {
  const t = useTranslations("account.contract");
  const locale = useLocale();
  const [step, setStep] = useState<Step>({ name: "choose" });
  const [email, setEmail] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // A link from the account page may preselect the function (`?kind=withdraw|cancel`).
  useEffect(() => {
    const kind = new URLSearchParams(window.location.search).get("kind");
    if (kind === "withdraw" || kind === "cancel") setStep({ name: "details", kind });
  }, []);

  useEffect(() => {
    if (step.name !== "choose") heading.current?.focus();
  }, [step.name]);

  function choose(kind: ContractKind) {
    setError("");
    setStep({ name: "details", kind });
  }

  function review(event: FormEvent, kind: ContractKind) {
    event.preventDefault();
    const checked = contractRequestFrom(kind, email, orderRef);
    if (!checked.ok) {
      setError(t(checked.error));
      return;
    }
    setError("");
    setStep({ name: "confirm", kind, email: checked.request.email, orderRef: checked.request.order_ref });
  }

  async function confirm(kind: ContractKind, confirmedEmail: string, confirmedRef: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    let caught: unknown;
    try {
      await submitContractRequest({ kind, email: confirmedEmail, order_ref: confirmedRef });
    } catch (failure) {
      caught = failure ?? new Error("failed");
    }
    const outcome = contractOutcome(caught);
    if (outcome.state === "sent") {
      setStep({ name: "sent", kind, email: confirmedEmail, at: new Date() });
      setOrderRef("");
    } else {
      setError(outcome.key === "errUnavailable" ? t("errUnavailable", { email: SUPPORT_EMAIL }) : t(outcome.key));
    }
    busyRef.current = false;
    setBusy(false);
  }

  function restart() {
    setError("");
    setStep({ name: "choose" });
  }

  const title = step.name === "choose"
    ? t("title")
    : step.name === "sent"
      ? t("sentTitle")
      : step.name === "confirm"
        ? step.kind === "withdraw" ? t("confirmWithdrawTitle") : t("confirmCancelTitle")
        : step.kind === "withdraw" ? t("withdrawTitle") : t("cancelTitle");

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
          {step.name === "choose" && <p className={styles.sub}>{t("sub")}</p>}
        </div>

        {step.name === "choose" && (
          <div className={styles.choices}>
            <section className={styles.panel} aria-labelledby="contract-withdraw">
              <h2 id="contract-withdraw">{t("withdrawTitle")}</h2>
              <p>{t("withdrawBody")}</p>
              <button className={styles.primary} type="button" onClick={() => choose("withdraw")}>{t("withdrawTitle")}</button>
            </section>
            <section className={styles.panel} aria-labelledby="contract-cancel">
              <h2 id="contract-cancel">{t("cancelTitle")}</h2>
              <p>{t("cancelBody")}</p>
              <button className={styles.primary} type="button" onClick={() => choose("cancel")}>{t("cancelTitle")}</button>
            </section>
          </div>
        )}

        {step.name === "details" && (
          <section className={styles.panel}>
            <p>{step.kind === "withdraw" ? t("withdrawBody") : t("cancelBody")}</p>
            <form onSubmit={(event) => review(event, step.kind)} noValidate>
              <label htmlFor="contract-email">{t("email")}</label>
              <input id="contract-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                autoComplete="email" maxLength={254} required />
              <label htmlFor="contract-order">{t("orderRef")}</label>
              <input id="contract-order" value={orderRef} onChange={(event) => setOrderRef(event.target.value)}
                autoComplete="off" spellCheck={false} maxLength={ORDER_REF_MAX} required aria-describedby="contract-order-help" />
              <small id="contract-order-help">{t("orderRefHelp")}</small>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.actions} style={{ marginTop: 18 }}>
                <button className={styles.primary} type="submit">{t("continue")}</button>
                <button type="button" onClick={restart}>{t("back")}</button>
              </div>
            </form>
          </section>
        )}

        {step.name === "confirm" && (
          <section className={styles.panel}>
            <p>{step.kind === "withdraw" ? t("confirmWithdrawBody") : t("confirmCancelBody")}</p>
            <dl className={styles.summary}>
              <dt>{t("email")}</dt><dd>{step.email}</dd>
              <dt>{t("orderRef")}</dt><dd>{step.orderRef}</dd>
            </dl>
            <p className={styles.notice}>{t("confirmNote")}</p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.actions}>
              <button className={styles.primary} type="button" disabled={busy}
                onClick={() => void confirm(step.kind, step.email, step.orderRef)}>
                {busy ? t("sending") : step.kind === "withdraw" ? t("confirmWithdraw") : t("confirmCancel")}
              </button>
              <button type="button" disabled={busy} onClick={() => setStep({ name: "details", kind: step.kind })}>{t("edit")}</button>
            </div>
          </section>
        )}

        {step.name === "sent" && (
          <section className={styles.panel} aria-live="polite">
            <p className={styles.ok} role="status">{t("sent", { email: step.email })}</p>
            <p>{t("sentAt", { at: step.at.toLocaleString(locale, { dateStyle: "long", timeStyle: "short" }) })}</p>
            <p className={styles.notice}>{t("sentNote")}</p>
            <div className={styles.actions}>
              <button type="button" onClick={restart}>{t("another")}</button>
            </div>
          </section>
        )}

        <div className={styles.stack} style={{ marginTop: 16 }}>
          <p className={styles.notice}>
            {t.rich("appStore", { link: (chunks) => <a href={APPLE_REPORT_A_PROBLEM_URL} rel="noopener noreferrer">{chunks}</a> })}
          </p>
          <p className={styles.notice}>
            {t.rich("signedIn", { link: (chunks) => <Link href="/account">{chunks}</Link> })}
            {" "}
            {t.rich("terms", { link: (chunks) => <Link href="/terms#withdrawal">{chunks}</Link> })}
          </p>
        </div>
      </div>
    </main>
  );
}
