"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api";
import { getEmailPreferences, setProductUpdates } from "@/lib/email-preferences";
import styles from "./account.module.css";

const unauthenticated = (caught: unknown) => caught instanceof ApiError && caught.status === 401;

/**
 * "Notifications": one switch for product emails (news and updates). The
 * switch moves at once and goes back if saving fails; account emails are not
 * covered by it.
 */
export default function NotificationsPanel({ token, onSessionEnded }: { token: string; onSessionEnded: () => void }) {
  const t = useTranslations("account.notifications");
  const [productUpdates, setProductUpdatesState] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    getEmailPreferences(token)
      .then((preferences) => { if (active.current) setProductUpdatesState(preferences.productUpdates); })
      .catch((caught: unknown) => {
        if (!active.current) return;
        if (unauthenticated(caught)) onSessionEnded();
        else setError(t("loadError"));
      });
    return () => { active.current = false; };
  }, [token, onSessionEnded, t]);

  async function toggle(next: boolean) {
    if (saving || productUpdates === null) return;
    const previous = productUpdates;
    setProductUpdatesState(next);
    setSaving(true);
    setError("");
    try {
      const stored = await setProductUpdates(token, next);
      if (active.current) setProductUpdatesState(stored.productUpdates);
    } catch (caught) {
      if (!active.current) return;
      if (unauthenticated(caught)) { onSessionEnded(); return; }
      setProductUpdatesState(previous);
      setError(t("saveError"));
    } finally {
      if (active.current) setSaving(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="account-notifications" aria-busy={productUpdates === null && !error}>
      <h2 id="account-notifications">{t("title")}</h2>
      <div className={styles.choiceGroup}>
        <label>
          <input type="checkbox" role="switch" checked={productUpdates ?? false} disabled={productUpdates === null || saving}
            aria-describedby="account-product-updates-sub" onChange={(event) => void toggle(event.target.checked)} />
          {t("productUpdates")}
        </label>
        <small id="account-product-updates-sub">{t("productUpdatesSub")}</small>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  );
}
