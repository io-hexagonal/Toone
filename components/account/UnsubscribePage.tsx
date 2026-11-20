"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { takeUnsubscribeToken, unsubscribeProductEmails } from "@/lib/email-preferences";
import styles from "./account.module.css";

const SUPPORT_EMAIL = "hello@trytoone.com";

type Step =
  /** Before the browser has read the address (also the server HTML). */
  | { name: "reading" }
  /** No token in the link. */
  | { name: "missing" }
  | { name: "ready"; token: string; failed: boolean }
  | { name: "sending"; token: string }
  | { name: "done" };

/**
 * The unsubscribe link in product emails (`/unsubscribe?t=…`). Opening the
 * page changes nothing, so link scanners cannot unsubscribe anyone; only the
 * button sends the token. Mail clients' one-click unsubscribe posts to the
 * API directly and never opens this page.
 */
export default function UnsubscribePage() {
  const t = useTranslations("account.unsubscribe");
  const [step, setStep] = useState<Step>({ name: "reading" });
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // Taking the token removes it from the address, so take it once per page (effects may run twice in development).
  const taken = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (taken.current === undefined) taken.current = takeUnsubscribeToken(window);
    const token = taken.current;
    setStep(token ? { name: "ready", token, failed: false } : { name: "missing" });
  }, []);

  useEffect(() => {
    if (step.name === "done") heading.current?.focus();
  }, [step.name]);

  async function unsubscribe(token: string) {
    if (busy.current) return;
    busy.current = true;
    setStep({ name: "sending", token });
    try {
      await unsubscribeProductEmails(token);
      setStep({ name: "done" });
    } catch {
      setStep({ name: "ready", token, failed: true });
    } finally {
      busy.current = false;
    }
  }

  const title = step.name === "done" ? t("doneTitle") : step.name === "missing" ? t("missingTitle") : t("title");

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

          {(step.name === "ready" || step.name === "sending") && <>
            <p>{t("body")}</p>
            {step.name === "ready" && step.failed && (
              <p className={styles.error} role="alert">{t("error", { email: SUPPORT_EMAIL })}</p>
            )}
            <div className={styles.actions}>
              <button className={styles.primary} type="button" disabled={step.name === "sending"}
                onClick={() => void unsubscribe(step.token)} data-umami-event="email-unsubscribe">
                {step.name === "sending" ? t("sending") : t("button")}
              </button>
            </div>
          </>}

          {step.name === "done" && <>
            <p className={styles.ok} role="status">{t("done")}</p>
            <p className={styles.notice}>
              {t.rich("turnBackOn", { link: (chunks) => <Link href="/account">{chunks}</Link> })}
            </p>
          </>}

          {step.name === "missing" && <>
            <p>{t("missingBody", { email: SUPPORT_EMAIL })}</p>
            <div className={styles.actions}>
              <Link className={styles.button} href="/account">{t("openAccount")}</Link>
            </div>
          </>}
        </section>
      </div>
    </main>
  );
}
