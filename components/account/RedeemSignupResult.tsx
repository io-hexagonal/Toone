"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { InvitationOutcome } from "@/components/AuthPage";
import { billingFailure, checkCode, getEntitlement, type Entitlement } from "@/lib/billing/api";
import { forgetPendingCode } from "@/lib/billing/pending-code";
import EmailVerification from "./EmailVerification";
import RedeemDone from "./RedeemDone";
import RedeemForm from "./RedeemForm";
import { benefitCopy, providerSignupState, signupCodeState } from "./redeem-code";
import styles from "./account.module.css";

type View =
  | { name: "checking" }
  | { name: "applied"; entitlement: Entitlement | null }
  | { name: "waits" }
  | { name: "redeem" };

/**
 * /redeem after "Create one with this code": the account was just created
 * (or, with Google or Apple, maybe signed in) with the code. Shows what the
 * code gave, the email confirmation a shared code's benefit waits for, or,
 * when the sign-in was an existing account that ignored the code, the usual
 * redeem flow with the same code.
 */
export default function RedeemSignupResult({ outcome, onSessionEnded }: { outcome: InvitationOutcome; onSessionEnded: () => void }) {
  const t = useTranslations("account");
  const [view, setView] = useState<View>({ name: "checking" });
  const started = useRef(false);
  const { session, code, benefit } = outcome;

  async function showApplied(known: Entitlement | null = null) {
    forgetPendingCode();
    let entitlement = known;
    if (!entitlement) {
      try {
        entitlement = await getEntitlement(session.token);
      } catch (caught) {
        if (billingFailure(caught).kind === "unauthenticated") {
          onSessionEnded();
          return;
        }
      }
    }
    setView({ name: "applied", entitlement });
  }

  useEffect(() => {
    // Once: effects may run twice in development.
    if (started.current) return;
    started.current = true;
    const state = signupCodeState(outcome.via, benefit, outcome.shared);
    if (state === "applied") {
      void showApplied();
      return;
    }
    if (state === "waits_for_email") {
      forgetPendingCode();
      setView({ name: "waits" });
      return;
    }
    void (async () => {
      let next: "applied" | "redeem";
      try {
        await checkCode(session.token, code);
        next = providerSignupState({ ok: true });
      } catch (caught) {
        const failure = billingFailure(caught);
        if (failure.kind === "unauthenticated") {
          onSessionEnded();
          return;
        }
        next = providerSignupState({ ok: false, failure });
      }
      if (next === "applied") await showApplied();
      else setView({ name: "redeem" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view.name === "checking") return <p role="status">{t("common.checking")}</p>;

  if (view.name === "redeem") {
    return <RedeemForm token={session.token} email={session.user.email} initialCode={code} onSessionEnded={onSessionEnded} />;
  }

  const benefitName = benefit && (() => {
    const copy = benefitCopy(benefit);
    return "values" in copy ? t(`redeem.${copy.key}`, copy.values) : t(`redeem.${copy.key}`);
  })();

  if (view.name === "waits") {
    return (
      <div aria-live="polite">
        <h2>{t("redeem.signupDoneTitle")}</h2>
        <p>{t("redeem.signupWaits", { email: session.user.email, benefit: benefitName ?? t("redeem.benefitUnknown") })}</p>
        <EmailVerification
          token={session.token}
          email={session.user.email}
          onVerified={(entitlement) => void showApplied(entitlement)}
          onSessionEnded={onSessionEnded}
        />
      </div>
    );
  }

  return (
    <RedeemDone benefit={benefit} entitlement={view.entitlement} email={session.user.email} title={t("redeem.signupDoneTitle")}>
      <Link className={styles.button} href="/account">{t("redeem.viewAccount")}</Link>
    </RedeemDone>
  );
}
