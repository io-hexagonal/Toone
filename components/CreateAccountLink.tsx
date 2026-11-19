"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { useStoredSession } from "@/lib/hooks/useStoredSession";

/**
 * The site's "Create account" call to action. A signed-in visitor already has
 * an account, so the same button takes them to their downloads instead.
 * The server HTML always holds the create-account link.
 */
export default function CreateAccountLink({ className, placement, children }: {
  className?: string;
  /** Where the button sits, for analytics ("header", "footer", …). */
  placement: string;
  /** The signed-out label. */
  children: ReactNode;
}) {
  const t = useTranslations("account.common");
  const { session, ready } = useStoredSession();
  if (ready && session) {
    return (
      <Link className={className} href="/downloads" data-umami-event="downloads" data-umami-event-placement={placement}>
        {t("downloads")}
      </Link>
    );
  }
  return (
    <Link className={className} href="/create-account" data-umami-event="create-account" data-umami-event-placement={placement}>
      {children}
    </Link>
  );
}
