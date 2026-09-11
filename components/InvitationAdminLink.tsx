"use client";

import { useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import { canManageInvitations, loadSession } from "@/lib/api";

/** Discovery follows the server capability; the API authorizes every operation. */
export default function InvitationAdminLink({ token, className }: { token?: string; className?: string }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setAllowed(false);
    const currentToken = token || loadSession()?.token;
    if (currentToken) {
      canManageInvitations(currentToken)
        .then(value => { if (!cancelled) setAllowed(value); })
        .catch(() => { if (!cancelled) setAllowed(false); });
    }
    return () => { cancelled = true; };
  }, [token]);
  return allowed ? <Link href="/admin/invitations" className={className}>Invitations</Link> : null;
}
