"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import AuthPage from "@/components/AuthPage";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";
import { createOpenAttempt } from "@/lib/explore/presentation";
import { initialCheckoutReturn, pollCheckoutReturn, type CheckoutReturnState } from "@/lib/billing/checkout-return";
import { rememberOrderRef } from "@/lib/billing/order-ref";
import {
  TOONE_PRO_SUCCESS_URL,
  cameFromApp,
  forgetCheckoutSession,
  returnReceipt,
  returnPollConfig,
  returnView,
  takeCheckoutSessionId,
} from "./CheckoutReturn.helpers";
import { legalInvoiceCopy } from "./legal-invoice";

/** Sentinel the open attempt "navigates" to when the app did not take over. */
const NO_FALLBACK = "about:blank#toone-not-opened";

/**
 * The page Stripe returns to. It confirms the purchase by polling the
 * checkout status and the account's entitlement (Pro shows as on only when
 * the checkout is complete and the entitlement says Pro) and never treats
 * the address it was opened with as proof of payment.
 */
export default function CheckoutReturn() {
  const t = useTranslations("billing.success");
  const { session, ready, setSession, endSession } = useStoredSession();
  // Read once, before the first poll; null until the browser has run.
  const [checkout, setCheckout] = useState<{ id: string | null; fromApp: boolean } | null>(null);
  const [state, setState] = useState<CheckoutReturnState>(initialCheckoutReturn);
  const [round, setRound] = useState(0);
  const [notOpened, setNotOpened] = useState(false);
  const cancelOpen = useRef<(() => void) | null>(null);

  useEffect(() => {
    const id = takeCheckoutSessionId(window);
    setCheckout({ id, fromApp: cameFromApp(window.location.search, window) });
  }, []);

  useEffect(() => () => cancelOpen.current?.(), []);

  const token = session?.token ?? null;
  const userId = session?.user.id ?? "";
  useEffect(() => {
    if (!ready || !checkout) return;
    const controller = new AbortController();
    void pollCheckoutReturn({
      token,
      sessionId: checkout.id,
      config: returnPollConfig(checkout.id !== null),
      signal: controller.signal,
      onState: next => {
        setState(next);
        if (next.kind === "signed_out" && token) endSession();
        // The account page shows it later in this browser (the server only returns it here).
        const orderRef = returnReceipt(next)?.orderRef;
        if (orderRef) rememberOrderRef(userId, orderRef);
        // A processing checkout stays remembered, so a reload checks it again.
        if (next.kind === "active" || (next.kind === "error" && next.reason === "expired")) {
          forgetCheckoutSession(window);
        }
      },
    });
    return () => controller.abort();
  }, [ready, checkout, token, userId, round, endSession]);

  const retry = useCallback(() => {
    setState(initialCheckoutReturn());
    setRound(value => value + 1);
  }, []);

  function openToone() {
    setNotOpened(false);
    cancelOpen.current?.();
    cancelOpen.current = createOpenAttempt(
      {
        listen: (name, fn) => {
          const target = name === "visibilitychange" ? document : window;
          target.addEventListener(name, fn);
          return () => target.removeEventListener(name, fn);
        },
        later: (fn, ms) => {
          const timer = window.setTimeout(fn, ms);
          return () => window.clearTimeout(timer);
        },
        visible: () => document.visibilityState === "visible",
        // The page never leaves on its own: if Toone did not open, say so.
        navigate: destination => {
          if (destination === TOONE_PRO_SUCCESS_URL) window.location.assign(destination);
          else setNotOpened(true);
        },
      },
      TOONE_PRO_SUCCESS_URL,
      NO_FALLBACK,
    );
  }

  const hasCheckout = checkout?.id != null;
  const view = !ready || !checkout ? "pending" : returnView(state, hasCheckout);
  const receipt = returnReceipt(state);
  const invoice = legalInvoiceCopy(receipt?.legalInvoice);
  const receiptBlock = receipt && (receipt.orderRef || invoice) && (
    <div className="pro-return-order">
      {receipt.orderRef && <>
        <p>{t.rich("orderRef", { ref: receipt.orderRef, code: (chunks) => <code>{chunks}</code> })}</p>
        <p className="pro-return-muted">
          {t.rich("orderRefNote", { link: (chunks) => <Link href="/cancel-contract">{chunks}</Link> })}
        </p>
      </>}
      {invoice && <p data-invoice={receipt.legalInvoice?.status}>{"values" in invoice ? t(invoice.key, invoice.values) : t(invoice.key)}</p>}
    </div>
  );

  if (view === "signed_out") {
    // The sign-in page is a full page of its own; the checkout id stays in
    // memory and polling resumes once a session exists.
    return (
      <>
        <p className="pro-return-banner" role="status">
          <strong>{t("signedOutTitle")}</strong> {t("signedOutSub")}
        </p>
        <AuthPage mode="signin" onAuthenticated={setSession} />
      </>
    );
  }

  return (
    <main className="pro-return">
      <Link href="/" aria-label="Toone" className="pro-return-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/brand/toone-mark.svg" alt="" />
        <span className="wm">toone</span>
      </Link>
      <div className="pro-return-card" role="status" aria-live="polite" data-state={view}>
        {view === "pending" && (
          <>
            <span className="pro-return-spinner" aria-hidden="true" />
            <h1>{t("pendingTitle")}</h1>
            <p>{t("pendingSub")}</p>
          </>
        )}

        {view === "active" && (
          <>
            <h1>{t("activeTitle")}</h1>
            <p>{t("activeSub", { email: session?.user.email ?? "" })}</p>
            {receiptBlock}
            {checkout?.fromApp ? (
              <>
                <button type="button" className="pro-return-button" onClick={openToone} data-umami-event="pro-return-to-app">
                  {t("returnToApp")}
                </button>
                <p className="pro-return-muted">{notOpened ? t("returnHint") : t("returnNote")}</p>
              </>
            ) : (
              <>
                <p className="pro-return-strong">{t("backToApp")}</p>
                <p className="pro-return-muted">
                  {t("noApp")} <Link href="/downloads">{t("download")}</Link>
                </p>
              </>
            )}
          </>
        )}

        {view === "processing" && (
          <>
            <h1>{t("processingTitle")}</h1>
            <p>{t("processingSub")}</p>
            {receiptBlock}
            <button type="button" className="pro-return-button" onClick={retry}>{t("checkAgain")}</button>
          </>
        )}

        {view === "timeout" && (
          <>
            <h1>{t("timeoutTitle")}</h1>
            <p>{t("timeoutSub")}</p>
            <button type="button" className="pro-return-button" onClick={retry}>{t("checkAgain")}</button>
          </>
        )}

        {view === "unreachable" && (
          <>
            <h1>{t("unreachableTitle")}</h1>
            <p>{t("unreachableSub")}</p>
            <button type="button" className="pro-return-button" onClick={retry}>{t("checkAgain")}</button>
          </>
        )}

        {view === "expired" && (
          <>
            <h1>{t("expiredTitle")}</h1>
            <p>{t("expiredSub")}</p>
            <Link className="pro-return-button" href="/pricing">{t("seePricing")}</Link>
          </>
        )}

        {view === "already_pro" && (
          <>
            <h1>{t("alreadyProTitle")}</h1>
            <p>{t("alreadyProSub")}</p>
            <Link className="pro-return-button" href="/account">{t("seeAccount")}</Link>
          </>
        )}

        {view === "wrong_account" && (
          <>
            <h1>{t("wrongAccountTitle")}</h1>
            <p>{t("wrongAccountSub")}</p>
            {/* Only the signed-in account is named; the server never says who paid. */}
            {session?.user.email && <p className="pro-return-muted">{t("wrongAccountCurrent", { email: session.user.email })}</p>}
            {/* Signing out shows the sign-in form; the checkout id stays, so the right account sees the purchase. */}
            <button type="button" className="pro-return-button" onClick={endSession}>{t("switchAccount")}</button>
          </>
        )}

        {view === "none" && (
          <>
            <h1>{t("noneTitle")}</h1>
            <p>{t("noneSub")}</p>
            <Link className="pro-return-button" href="/pricing">{t("seePricing")}</Link>
          </>
        )}
      </div>
    </main>
  );
}
