"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { AccountHeader } from "./AccountPage";
import RedeemForm from "./RedeemForm";
import { codeFromFragment, locationWithoutCode } from "./redeem-code";
import styles from "./account.module.css";

/**
 * /redeem: the code arrives in the fragment (`#code=`), is read once and
 * removed from the address bar, survives the sign-in step in memory, then is
 * checked and redeemed for the signed-in account.
 */
export default function RedeemPage() {
  const t = useTranslations("account");
  const { session, ready, setSession, endSession } = useStoredSession();
  const [linkedCode, setLinkedCode] = useState<string | null>(null);
  const [read, setRead] = useState(false);
  const consumed = useRef(false);

  useEffect(() => {
    // Once per page load: the fragment is gone after the first read (and
    // effects may run twice in development).
    if (consumed.current) return;
    consumed.current = true;
    const code = codeFromFragment(window.location.hash);
    if (window.location.hash || new URLSearchParams(window.location.search).has("code")) {
      window.history.replaceState(null, "", locationWithoutCode(window.location.pathname, window.location.search));
    }
    setLinkedCode(code);
    setRead(true);
  }, []);

  if (!ready || !read) return <main className={`${styles.page} ${styles.centered}`}><p role="status">{t("common.checking")}</p></main>;
  if (!session) return <AuthPage mode="signin" onAuthenticated={setSession} />;
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AccountHeader session={session} onSessionEnded={endSession} />
        <div className={styles.title}>
          <p className={styles.eyebrow}>{t("redeem.eyebrow")}</p>
          <h1>{t("redeem.title")}</h1>
          <p className={styles.sub}>{t("redeem.sub", { email: session.user.email })}</p>
        </div>
        <section className={styles.panel}>
          <RedeemForm key={session.token} token={session.token} initialCode={linkedCode ?? ""} onSessionEnded={endSession} />
        </section>
        <nav className={styles.footerLinks} aria-label={t("page.moreLinks")}>
          <Link href="/account">{t("redeem.viewAccount")}</Link>
          <Link href="/terms#codes">{t("common.terms")}</Link>
        </nav>
      </div>
    </main>
  );
}
