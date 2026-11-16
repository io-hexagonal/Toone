"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import PricingPlans from "@/components/billing/PricingPlans";
import { getEntitlement, isPro, type Price } from "@/lib/billing/api";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

type Props = {
  /** The API says downloads need Toone Pro for now. */
  paidEntry: boolean;
  prices: Price[];
  checkoutEnabled: boolean;
  freeCreations: number;
  refundDays: number;
  /** The normal download page: heading and the two installers. */
  children: ReactNode;
};

/** Development only: `?preview=wall` shows the plans without an account. */
function previewWall(): boolean {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("preview") === "wall";
}

/**
 * While entry is paid, a signed-in account without Toone Pro sees the plans
 * here instead of the installers. This only decides what to show: the API
 * refuses the download itself for an account without Pro.
 *
 * Signed-out visitors and Pro accounts get the normal page. If the plan can't
 * be read, the normal page is shown and the API still decides.
 */
export default function DownloadGate({ paidEntry, prices, checkoutEnabled, freeCreations, refundDays, children }: Props) {
  const t = useTranslations("billing.paidEntry");
  const { session, ready } = useStoredSession();
  const [state, setState] = useState<"checking" | "open" | "wall">("checking");
  const token = session?.token ?? null;

  useEffect(() => {
    if (previewWall()) return setState("wall");
    if (!paidEntry) return setState("open");
    if (!ready) return;
    if (!token) return setState("open");
    const controller = new AbortController();
    setState("checking");
    getEntitlement(token, controller.signal)
      .then((entitlement) => setState(isPro(entitlement) ? "open" : "wall"))
      .catch(() => {
        if (!controller.signal.aborted) setState("open");
      });
    return () => controller.abort();
  }, [paidEntry, ready, token]);

  if (state === "open") return <>{children}</>;
  if (state === "checking") {
    return <div className="download-access" aria-busy="true">{t("checking")}</div>;
  }
  return (
    <div className="download-wall" data-paid-entry="">
      <header className="download-head">
        <h1>{t("title")}</h1>
        <p className="download-wall-sub">
          <strong>{t("ready")}</strong> {t("sub")}
        </p>
      </header>
      <PricingPlans
        prices={prices}
        checkoutEnabled={checkoutEnabled || previewWall()}
        freeCreations={freeCreations}
        refundDays={refundDays}
        paidEntry
      />
    </div>
  );
}
