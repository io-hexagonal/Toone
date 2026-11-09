"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { syncSiteSession } from "@/lib/api";
import styles from "./HowToSignInGate.module.css";

/**
 * What a visitor without a server-side session sees on /how-to. A browser
 * that is already signed in (session in localStorage from before the cookie
 * existed, or a cookie that expired first) hands its token to /api/session
 * and reloads the page; everyone else gets the sign-in card, which returns
 * here after signing in.
 */
export default function HowToSessionGate({ path }: { path: string }) {
  const router = useRouter();
  const { session, ready, endSession } = useStoredSession();
  const [syncFailed, setSyncFailed] = useState(false);

  useEffect(() => {
    if (!ready || !session || syncFailed) return;
    let cancelled = false;
    void syncSiteSession(session).then((ok) => {
      if (cancelled) return;
      if (ok) {
        router.refresh();
      } else {
        // The API no longer accepts this session: sign in again.
        setSyncFailed(true);
        endSession();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, session, syncFailed, router, endSession]);

  if (!ready || (session && !syncFailed)) {
    return (
      <div className={styles.card} aria-busy="true">
        <p className={styles.sub}>Checking your account…</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>Product guide</p>
      <h1 className={styles.title}>Sign in to read the guides</h1>
      <p className={styles.sub}>
        The how-to guides are available to Toone accounts. Sign in and you&apos;ll come straight back here.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primary} href={`/signin?next=${encodeURIComponent(path)}`}>
          Sign in
        </Link>
        <Link className={styles.secondary} href="/request-access">
          Request access
        </Link>
      </div>
    </div>
  );
}
