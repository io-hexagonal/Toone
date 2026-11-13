"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import AuthPage, { type InvitationOutcome } from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { AccountHeader } from "./AccountPage";
import RedeemForm from "./RedeemForm";
import RedeemSignupResult from "./RedeemSignupResult";
import RedeemCodeGate, { type CheckedCode } from "./RedeemCodeGate";
import { forgetPendingCode, pendingCode, rememberPendingCode } from "@/lib/billing/pending-code";
import { campaignFromRef, codeFromFragment, locationWithoutCode, type CodeCampaign } from "./redeem-code";
import styles from "./account.module.css";

/**
 * /redeem: the code arrives in the fragment (`#code=`), is read once and
 * removed from the address bar, then is checked and redeemed for the
 * signed-in account. It survives the sign-in step in memory and, for a
 * redirect sign-in that reloads the page, in this tab's sessionStorage
 * (lib/billing/pending-code.ts), never in the address.
 *
 * Signed out, the code comes first ("Redeem your code", RedeemCodeGate):
 * once the public check accepts it, the visitor creates an account with it
 * (the invite sign-up with the code in hand, which gives the new account what
 * the code gives, then shows it here) or signs in to redeem it. An AppSumo
 * code (`APPSUMO-…`) or a Product Hunt context (the code's label, or
 * `?ref=producthunt`) gets its own welcome.
 */
export default function RedeemPage() {
  const t = useTranslations("account");
  const { session, ready, setSession, endSession } = useStoredSession();
  const [linkedCode, setLinkedCode] = useState<string | null>(null);
  const [read, setRead] = useState(false);
  const consumed = useRef(false);
  /** Signed out: the code first, then sign in or create an account with it. */
  const [authMode, setAuthMode] = useState<"code" | "signin" | "invite">("code");
  /** The checked code can create an account (false: it only works on an existing one). */
  const [admitsSignup, setAdmitsSignup] = useState(true);
  /** `?ref=producthunt`: the launch welcome, before any code is checked. */
  const [refCampaign, setRefCampaign] = useState<CodeCampaign | null>(null);
  /** Set when this page's sign-up with a code signed the visitor in. */
  const [signup, setSignup] = useState<InvitationOutcome | null>(null);
  const sessionEnded = useCallback(() => {
    setSignup(null);
    setAuthMode("code");
    endSession();
  }, [endSession]);

  useEffect(() => {
    // Once per page load: the fragment is gone after the first read (and
    // effects may run twice in development).
    if (consumed.current) return;
    consumed.current = true;
    let code = codeFromFragment(window.location.hash);
    if (code) rememberPendingCode(code);
    else code = pendingCode();
    if (window.location.hash || new URLSearchParams(window.location.search).has("code")) {
      window.history.replaceState(null, "", locationWithoutCode(window.location.pathname, window.location.search));
    }
    setLinkedCode(code);
    setRefCampaign(campaignFromRef(window.location.search));
    setRead(true);
  }, []);

  if (!ready || !read) return <main className={`${styles.page} ${styles.centered}`}><p role="status">{t("common.checking")}</p></main>;
  if (!session) {
    if (authMode === "code") {
      return (
        <RedeemCodeGate
          initialCode={linkedCode}
          refCampaign={refCampaign}
          onCreateAccount={(checked: CheckedCode) => {
            setLinkedCode(checked.code);
            setAdmitsSignup(true);
            setAuthMode("invite");
          }}
          onSignIn={(checked: CheckedCode | null) => {
            if (checked) {
              setLinkedCode(checked.code);
              setAdmitsSignup(checked.admitsSignup);
            } else {
              // "Have an account? Sign in" without a checked code: nothing to carry.
              forgetPendingCode();
              setLinkedCode(null);
              setAdmitsSignup(false);
            }
            setAuthMode("signin");
          }}
        />
      );
    }
    return authMode === "invite" ? (
      <AuthPage
        key="invite"
        mode="invite"
        initialCode={linkedCode ?? undefined}
        onInvitationAccepted={setSignup}
        onAuthenticated={setSession}
        onSwitchMode={() => setAuthMode("signin")}
      />
    ) : (
      <AuthPage
        key="signin"
        mode="signin"
        onAuthenticated={setSession}
        onSwitchMode={linkedCode && admitsSignup ? () => setAuthMode("invite") : undefined}
      />
    );
  }
  const justSignedUp = signup !== null && signup.session.token === session.token;
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AccountHeader session={session} onSessionEnded={sessionEnded} />
        <div className={styles.title}>
          <p className={styles.eyebrow}>{t("redeem.eyebrow")}</p>
          <h1>{t("redeem.title")}</h1>
          <p className={styles.sub}>{t("redeem.sub", { email: session.user.email })}</p>
        </div>
        <section className={styles.panel}>
          {justSignedUp ? (
            <RedeemSignupResult key={session.token} outcome={signup} onSessionEnded={sessionEnded} />
          ) : (
            <RedeemForm key={session.token} token={session.token} email={session.user.email} initialCode={linkedCode ?? ""} onSessionEnded={sessionEnded} />
          )}
        </section>
        <nav className={styles.footerLinks} aria-label={t("page.moreLinks")}>
          <Link href="/account">{t("redeem.viewAccount")}</Link>
          <Link href="/terms#codes">{t("common.terms")}</Link>
        </nav>
      </div>
    </main>
  );
}
