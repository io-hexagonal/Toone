"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { CodeBenefit, Entitlement } from "@/lib/billing/api";
import { formatRedeemDate, isLifetimeActive, redeemDoneCopy } from "./redeem-code";
import styles from "./account.module.css";

/**
 * What a redeemed code (or a sign-up with one) gave, with the way to the Mac
 * app. Lifetime Pro reads "Toone Pro Lifetime is active"; everything else
 * keeps `title` and a line naming what changed. Either way the visitor is
 * told to sign in to the app with the same account.
 */
export default function RedeemDone({
  benefit,
  entitlement,
  email,
  title,
  headingLevel = 2,
  children,
}: {
  benefit: CodeBenefit | null;
  /** The updated entitlement; null when it could not be read. */
  entitlement: Entitlement | null;
  /** The account's address: sign in to the app with it. */
  email: string;
  /** The heading when the code did not give Toone Pro for the life of the product. */
  title: string;
  headingLevel?: 2 | 3;
  /** Actions after the download button. */
  children?: ReactNode;
}) {
  const t = useTranslations("account.redeem");
  const locale = useLocale();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  // Lifetime: the heading says it all.
  const lifetime = isLifetimeActive(benefit, entitlement);
  let line: string | null = null;
  if (benefit && !lifetime) {
    const done = entitlement ? redeemDoneCopy(benefit, entitlement) : { key: "doneGeneric" as const };
    line = done.key === "doneProUntil"
      ? t("doneProUntil", { date: formatRedeemDate(done.date, locale) })
      : done.key === "doneCreations"
        ? t("doneCreations", done.values)
        : t(done.key);
  }
  return (
    <div aria-live="polite">
      <Heading>{lifetime ? t("doneLifetimeTitle") : title}</Heading>
      {line && <p className={styles.ok} role="status">{line}</p>}
      <p>{t("doneSameAccount", { email })}</p>
      <p className={styles.notice}>{t("doneNote")}</p>
      <div className={styles.actions}>
        <Link className={`${styles.button} ${styles.primary}`} href="/downloads">{t("download")}</Link>
        {children}
      </div>
    </div>
  );
}
