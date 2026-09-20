"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { canManageInvitations, loadSession } from "@/lib/api";

/** Discovery follows the server capability; the API authorizes every operation. */
export default function InvitationAdminLink({ token, className }: { token?: string; className?: string }) {
  const t = useTranslations("nav");
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    const check = (currentToken?: string) => {
      const request = ++generation;
      setAllowed(false);
      if (currentToken) {
        canManageInvitations(currentToken)
          .then(value => { if (!cancelled && request === generation) setAllowed(value); })
          .catch(() => { if (!cancelled && request === generation) setAllowed(false); });
      }
    };
    check(token || loadSession()?.token);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "toone.session" || event.key === null) check(loadSession()?.token);
    };
    window.addEventListener("storage", onStorage);
    return () => { cancelled = true; window.removeEventListener("storage", onStorage); };
  }, [token]);
  return allowed ? <Link href="/admin/invitations" className={className}>{t("invitations")}</Link> : null;
}
