"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { lookupAffiliate, rememberAffiliate, type PublicAffiliate } from "@/lib/affiliates";
import styles from "@/components/account/account.module.css";

type State = { kind: "loading" } | { kind: "ready"; affiliate: PublicAffiliate } | { kind: "missing" } | { kind: "failed" };

/**
 * /r/{slug}: a creator's vanity link. It looks the creator up (which counts
 * the visit), keeps their checkout code in this browser for the attribution
 * window, and sends the visitor on to the plans or the download.
 */
export default function AffiliateLanding({ slug }: { slug: string }) {
  const t = useTranslations("affiliate");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    lookupAffiliate(slug, controller.signal)
      .then((affiliate) => {
        if (!affiliate) { setState({ kind: "missing" }); return; }
        rememberAffiliate(affiliate);
        setState({ kind: "ready", affiliate });
      })
      .catch(() => { if (!controller.signal.aborted) setState({ kind: "failed" }); });
    return () => controller.abort();
  }, [slug]);

  return (
    <main className={styles.page}>
      <div className={`${styles.container} ${styles.gate}`}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
        </header>
        {state.kind === "loading" && <div className={styles.title}><p role="status" className={styles.sub}>{t("checking", { slug })}</p></div>}
        {state.kind === "ready" && <>
          <div className={styles.title}>
            <h1>{t("title", { name: state.affiliate.name })}</h1>
            <p className={styles.sub}>{t("sub")}</p>
          </div>
          <section className={styles.panel}>
            <p>
              {state.affiliate.discount
                ? t(state.affiliate.discount.scope === "lifetime" ? "offerLifetime" : "offerAll", { percent: state.affiliate.discount.percent })
                : t("offerCode", { code: state.affiliate.promotion_code })}
            </p>
            <p className={styles.code}>{t("code", { code: state.affiliate.promotion_code })}</p>
            <div className={styles.actions}>
              <Link href="/pricing" className={`${styles.button} ${styles.primary}`}>{t("seePlans")}</Link>
              <Link href="/download" className={styles.button}>{t("download")}</Link>
            </div>
          </section>
        </>}
        {(state.kind === "missing" || state.kind === "failed") && <>
          <div className={styles.title}>
            <h1>{state.kind === "missing" ? t("missingTitle") : t("error")}</h1>
            {state.kind === "missing" && <p className={styles.sub}>{t("missingSub")}</p>}
          </div>
          <div className={styles.actions} style={{ justifyContent: "center" }}>
            <Link href="/pricing" className={`${styles.button} ${styles.primary}`}>{t("seePlans")}</Link>
            <Link href="/download" className={styles.button}>{t("download")}</Link>
          </div>
        </>}
      </div>
    </main>
  );
}
