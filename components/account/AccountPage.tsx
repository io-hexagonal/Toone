"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import AuthPage from "@/components/AuthPage";
import InvitationAdminLink from "@/components/InvitationAdminLink";
import { Link } from "@/lib/navigation";
import { logout, type ToneSession } from "@/lib/api";
import {
  billingFailure,
  getBillingFeaturesOrOff,
  getCheckoutStatus,
  getEntitlement,
  startPortal,
  type BillingFeatures,
  type Entitlement,
  type LegalInvoice,
} from "@/lib/billing/api";
import { recallCheckoutSession, recallOrderRef } from "@/lib/billing/order-ref";
import { APPLE_MANAGE_SUBSCRIPTIONS_URL } from "@/lib/legal/terms";
import { legalInvoiceCopy } from "@/components/billing/legal-invoice";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { describePlan, type PlanView } from "./plan-view";
import RedeemForm from "./RedeemForm";
import ReturnToToone from "@/components/billing/ReturnToToone";
import { takeAppReturn } from "./app-return";
import styles from "./account.module.css";

/**
 * Signed-in gate: checking → sign in → the account workspace. A 401 ends the
 * session. Opened from the desktop app's billing page (`?return=app`), it
 * offers "Return to Toone" first and the sign-in only on request.
 */
export default function AccountPage() {
  const t = useTranslations("account.common");
  const { session, ready, setSession, endSession } = useStoredSession();
  const [fromApp, setFromApp] = useState(false);
  const [signInRequested, setSignInRequested] = useState(false);
  // Read once: the parameter is removed from the address.
  const appReturn = useRef<boolean | null>(null);
  useEffect(() => {
    appReturn.current ??= takeAppReturn(window);
    setFromApp(appReturn.current);
  }, []);
  if (!ready) return <main className={`${styles.page} ${styles.centered}`}><p role="status">{t("checking")}</p></main>;
  if (!session) {
    if (fromApp && !signInRequested) return <AppReturnPage onSignIn={() => setSignInRequested(true)} />;
    return <AuthPage mode="signin" onAuthenticated={setSession} />;
  }
  return <AccountWorkspace key={session.token} session={session} onSessionEnded={endSession} fromApp={fromApp} />;
}

/** "Back to Toone": the deep link only asks the app to refresh its plan, so no web session is needed. */
function AppReturnPanel() {
  const t = useTranslations("account.page");
  return (
    <section className={styles.panel} aria-labelledby="account-app-return">
      <h2 id="account-app-return">{t("appReturnTitle")}</h2>
      <p>{t("appReturnSub")}</p>
      <div className={styles.actions}>
        <ReturnToToone label={t("returnToApp")} note={t("returnNote")} hint={t("returnHint")}
          buttonClassName={styles.primary} noteClassName={styles.notice} />
      </div>
    </section>
  );
}

function AppReturnPage({ onSignIn }: { onSignIn: () => void }) {
  const t = useTranslations("account.page");
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Toone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
          </Link>
        </header>
        <div className={styles.stack}>
          <AppReturnPanel />
          <div className={styles.actions}>
            <button type="button" onClick={onSignIn}>{t("appSignIn")}</button>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

export function AccountHeader({ session, onSessionEnded }: { session: ToneSession; onSessionEnded: () => void }) {
  const t = useTranslations("account.common");
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    await logout(session.token);
    onSessionEnded();
  }
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Toone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" width={26} height={26} />toone
      </Link>
      <div className={styles.who}>
        <span>{session.user.email}</span>
        <button type="button" onClick={() => void signOut()} disabled={signingOut}>
          {signingOut ? t("signingOut") : t("signOut")}
        </button>
      </div>
    </header>
  );
}

/** The legal invoice of the last web purchase made in this browser, if any. */
async function lastPurchaseInvoice(session: ToneSession): Promise<LegalInvoice | null> {
  const sessionId = recallCheckoutSession(session.user.id);
  if (!sessionId) return null;
  try {
    return (await getCheckoutStatus(session.token, sessionId)).legal_invoice;
  } catch {
    return null; // the plan still shows; the line is optional
  }
}

function AccountWorkspace({ session, onSessionEnded, fromApp }: { session: ToneSession; onSessionEnded: () => void; fromApp: boolean }) {
  const t = useTranslations("account.page");
  const common = useTranslations("account.common");
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [features, setFeatures] = useState<BillingFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Only this browser knows it (the success page saw it); read after mount.
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const active = useRef(true);

  useEffect(() => { setOrderRef(recallOrderRef(session.user.id)); }, [session.user.id]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [next, flags, invoice] = await Promise.all([
        getEntitlement(session.token), getBillingFeaturesOrOff(), lastPurchaseInvoice(session),
      ]);
      if (!active.current) return;
      // The entitlement carries no legal invoice (billing.md); the last
      // purchase's checkout status does.
      setEntitlement({ ...next, legal_invoice: next.legal_invoice ?? invoice });
      setFeatures(flags);
    } catch (caught) {
      if (!active.current) return;
      if (billingFailure(caught).kind === "unauthenticated") onSessionEnded();
      else setLoadError(true);
    } finally {
      if (active.current) setLoading(false);
    }
  }, [session.token, onSessionEnded]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; };
  }, [refresh]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AccountHeader session={session} onSessionEnded={onSessionEnded} />
        <div className={styles.title}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className={styles.sub}>{t("sub")}</p>
        </div>
        <div className={styles.stack}>
          {fromApp && <AppReturnPanel />}
          {entitlement ? (
            <PlanPanel entitlement={entitlement} session={session} features={features} onSessionEnded={onSessionEnded} />
          ) : (
            <section className={styles.panel} aria-busy={loading}>
              {loadError ? <>
                <p role="alert" className={styles.error}>{t("loadError")}</p>
                <button type="button" onClick={() => void refresh()} disabled={loading}>{common("tryAgain")}</button>
              </> : <p role="status">{t("loading")}</p>}
            </section>
          )}

          {features?.pro_codes && (
            <section className={styles.panel} aria-labelledby="account-redeem">
              <h2 id="account-redeem">{t("redeemTitle")}</h2>
              <p>{t("redeemSub")}</p>
              <RedeemForm token={session.token} onSessionEnded={onSessionEnded} onRedeemed={setEntitlement} headingLevel={3} />
            </section>
          )}

          <section className={styles.panel} aria-labelledby="account-contract">
            <h2 id="account-contract">{t("contractTitle")}</h2>
            <p>{t("contractSub")}</p>
            {orderRef && <>
              <dl className={styles.summary}>
                <dt>{t("orderRef")}</dt><dd><code className={styles.orderRef}>{orderRef}</code></dd>
              </dl>
              <p className={styles.notice}>{t("orderRefNote")}</p>
            </>}
            <div className={styles.actions}>
              <Link className={styles.button} href="/cancel-contract?kind=withdraw">{t("withdrawLink")}</Link>
              <Link className={styles.button} href="/cancel-contract?kind=cancel">{t("cancelLink")}</Link>
            </div>
          </section>
        </div>
        <nav className={styles.footerLinks} aria-label={t("moreLinks")}>
          <Link href="/downloads">{common("downloads")}</Link>
          <Link href="/terms#toone-pro">{common("terms")}</Link>
          <InvitationAdminLink token={session.token} />
        </nav>
      </div>
    </main>
  );
}

function PlanPanel({ entitlement, session, features, onSessionEnded }: {
  entitlement: Entitlement;
  session: ToneSession;
  features: BillingFeatures | null;
  onSessionEnded: () => void;
}) {
  const t = useTranslations("account.page");
  const locale = useLocale();
  const view: PlanView = describePlan(entitlement);
  const invoice = legalInvoiceCopy(entitlement.legal_invoice);
  const [opening, setOpening] = useState(false);
  const [manageError, setManageError] = useState("");
  const busy = useRef(false);

  async function openPortal() {
    if (busy.current) return;
    busy.current = true;
    setOpening(true);
    setManageError("");
    try {
      const { url } = await startPortal(session.token, { locale, return: "web" });
      window.location.assign(url);
      return; // keep the button busy while the browser leaves
    } catch (caught) {
      const failure = billingFailure(caught);
      if (failure.kind === "unauthenticated") { onSessionEnded(); return; }
      if (failure.kind === "payments_unavailable") setManageError(t("manageUnavailable"));
      else if (failure.kind === "unknown" && failure.status === 404) setManageError(t("manageMissing"));
      else if (failure.kind === "rate_limited") setManageError(t("manageRate"));
      else setManageError(t("manageError"));
    }
    busy.current = false;
    setOpening(false);
  }

  const facts: string[] = [];
  if (view.provider) facts.push(t(`provider_${view.provider}`));
  if (view.guestOf) facts.push(t("guestOf", { name: view.guestOf }));
  if (view.interval) facts.push(t(`interval_${view.interval}`));
  const line = view.dateLine;
  const dateText = !line ? null
    : line.key === "renews" || line.key === "ends" || line.key === "until"
      ? t(line.key, { date: formatDate(line.date, locale) })
      : t(line.key);

  return (
    <section className={styles.panel} aria-labelledby="account-plan" data-plan={view.tier} data-provider={view.provider ?? "none"}>
      <p className={styles.eyebrow}>{t("planEyebrow")}</p>
      <h2 id="account-plan" className={styles.planName}>{view.tier === "pro" ? t("planPro") : t("planFree")}</h2>
      {facts.length > 0 && <ul className={styles.facts}>{facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
      {dateText && <p className={line?.key === "grace" ? styles.error : undefined}>{dateText}</p>}
      {invoice && <p className={styles.notice} data-invoice={entitlement.legal_invoice?.status}>
        {"values" in invoice ? t(invoice.key, invoice.values) : t(invoice.key)}
      </p>}

      {view.creations && <>
        <p>{t("creations", { used: view.creations.used, limit: view.creations.limit })}</p>
        <div className={styles.meter} aria-hidden="true">
          <span style={{ width: `${view.creations.limit ? Math.min(100, (view.creations.used / view.creations.limit) * 100) : 100}%` }} />
        </div>
        <p className={styles.notice}>{view.creations.exhausted ? t("creationsExhausted") : t("creationsNote")}</p>
        {features?.stripe_pro_checkout && <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.primary}`} href="/pricing">{t("seePro")}</Link>
        </div>}
      </>}

      {view.manage === "portal" && <>
        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={() => void openPortal()} disabled={opening}>
            {opening ? t("opening") : view.interval === "lifetime" ? t("manageLifetime") : t("manage")}
          </button>
        </div>
        <p className={styles.notice}>{t("manageNote")}</p>
        {manageError && <p className={styles.error} role="alert">{manageError}</p>}
      </>}
      {view.manage === "app_store" && <>
        <h3>{t("appStoreTitle")}</h3>
        <p>{t("appStoreNote")}</p>
        <div className={styles.actions}>
          <a className={styles.button} href={APPLE_MANAGE_SUBSCRIPTIONS_URL} rel="noopener noreferrer" target="_blank">{t("appStoreLink")}</a>
        </div>
      </>}
      {view.manage === "none" && view.tier === "pro" && <p className={styles.notice}>{t("nothingToManage")}</p>}
    </section>
  );
}
