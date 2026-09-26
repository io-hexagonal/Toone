"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { rememberPrivacyChoice, savedPrivacyChoice, type PrivacyChoice } from "@/lib/privacy-choices";
import styles from "./PrivacyChoices.module.css";

const SCRIPT_ID = "toone-website-analytics";
const OPEN_EVENT = "toone:open-privacy-choices";

export function PrivacyChoicesButton({ className }: { className?: string }) {
  const t = useTranslations("privacyChoices");
  return (
    <button
      className={className ?? styles.inlineButton}
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      {t("reopen")}
    </button>
  );
}

export default function PrivacyChoices() {
  const t = useTranslations("privacyChoices");
  const [choice, setChoice] = useState<PrivacyChoice | null | undefined>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const existing = savedPrivacyChoice();
    setChoice(existing);
    setOpen(existing === null);
    const showChoices = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, showChoices);
    return () => window.removeEventListener(OPEN_EVENT, showChoices);
  }, []);

  useEffect(() => {
    if (choice !== "allow" || document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://analytics.truleaf.org/script.js";
    script.async = true;
    script.dataset.websiteId = "70c91dbc-6116-453f-9702-cbd942760e51";
    script.dataset.domains = "trytoone.com,www.trytoone.com";
    document.head.appendChild(script);
  }, [choice]);

  function choose(next: PrivacyChoice) {
    const analyticsWasLoaded = document.getElementById(SCRIPT_ID) !== null;
    rememberPrivacyChoice(next);
    if (next === "deny" && analyticsWasLoaded) {
      // Removing a loaded script cannot remove its event listeners. Reload to
      // stop all tracking before the visitor continues browsing.
      window.location.reload();
      return;
    }
    setChoice(next);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <aside className={styles.panel} aria-label={t("title")}>
      <div className={styles.copy}>
        <h2>{t("title")}</h2>
        <p>{t("description")} <Link href="/privacy">{t("details")}</Link></p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => choose("deny")}>{t("deny")}</button>
        <button type="button" onClick={() => choose("allow")}>{t("allow")}</button>
      </div>
    </aside>
  );
}
